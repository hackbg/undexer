import { Logged } from './utils.js'
import * as DB from './db.js'

/** Fetches data using the `Fetcher` and writes it into the `DB`. */
export class Updater extends Logged {
  constructor ({ log, fetcher }) {
    super({ log })
    this.fetcher = fetcher
  }

  async updateEpoch ({ epoch }) {
    // Fetch total stake
    this.logE(epoch, 'Updating total stake')
    const totalStake = await this.fetcher.fetchTotalStake(epoch)
    // Fetch parameters
    this.logE(epoch, 'Updating chain parameters')
    const parameters = await this.fetcher.fetchAllParameters(epoch)
    // Fetch validators
    this.logE(epoch, 'Updating all validators')
    const validators = await this.fetcher.fetchAllValidators(epoch)
    // Fetch proposals and votes
    this.logE(epoch, 'Updating all active proposals')
    const proposals = await this.fetcher.fetchAllActiveProposalsWithVotes(epoch)
    // Store epoched data
    await DB.default.transaction(async transaction => {
      // Store epoch with total stake and parameters
      await DB.Epoch.upsert({ id: epoch, totalStake, parameters }, { transaction })
      // Store validator states
      for (const validator of validators) {
        validator.epoch = epoch
        validator.consensusAddress = validator.address
        const { namadaAddress, state, stake } = validator
        this.logE(epoch, `Updating validator ${namadaAddress} (${state.state}) ${stake}`)
        await DB.Validator.upsert(validator, { transaction })
      }
      // Store proposals and votes
      for (const { votes, ...proposal } of proposals) {
        await DB.Proposal.upsert(proposal, { transaction })
        // Store updated votes for each proposal
        for (const vote of votes) {
          await DB.Vote.upsert(Object.assign(vote, { epoch }), transaction)
        }
      }
    })
  }

  /** Update a single block in the database.
    * Called on block increment. */
  async updateBlock ({ height, block }) {
    const t0 = performance.now()
    // If no block was passed, fetch it.
    block ??= await this.fetcher.fetchBlock(height)
    // Make sure there isn't a mismatch between required and actual height.
    height = block.height
    // Fetch epoch number
    const epoch = await this.fetcher.fetchEpoch(height)
    this.logEH(epoch, height)
    // Fetch block results
    const blockResults = await this.fetcher.fetchBlockResults(height)
    // Things that need to be updated separately after the block. This is because
    // if we try to fetch them during the block update, the db transaction would time out.
    const { validatorsToUpdate, proposalsToUpdate } = this.findValidatorsAndProposalsToUpdate(
      epoch, height, block, blockResults
    )
    // Fetch data for validators and proposals that were updated during the block.
    const [updatedValidators, updatedProposals] = await Promise.all([
      this.fetcher.fetchValidators([...validatorsToUpdate], epoch),
      this.fetcher.fetchProposalsWithVotes([...proposalsToUpdate], epoch),
    ])
    // TODO: check for governance proposals that were not caught by the above logic
    // Update the block and the contained transaction.
    await DB.default.transaction(async transaction => {
      // Update block record
      const data = {
        chainId:      block.header.chainId,
        blockTime:    block.time,
        blockHeight:  block.height,
        blockHash:    block.hash,
        blockHeader:  block.header,
        blockData:    JSON.parse(block.responses?.block.response||"null"),
        blockResults: JSON.parse(block.responses?.results?.response||"null"),
        rpcResponses: block.responses,
        epoch,
      }
      // Update block data
      await DB.Block.upsert(data, { transaction })
      await DB.RPCResponse.upsert({
        ...block.responses?.block
        blockHeight: block.height,
      }, { transaction })
      await DB.RPCResponse.upsert({
        ...block.responses?.results,
        blockHeight: block.height,
      }, { transaction })
      // Update each transaction in block
      for (const tx of block.transactions) {
        // Update transaction data
        this.logEH(epoch, height, `TX ${tx.id}: ${tx.data?.content[0]?.type}`)
        await DB.Transaction.upsert({
          chainId:     tx.data.chainId,
          blockHash:   tx.block.hash,
          blockTime:   tx.block.time,
          blockHeight: tx.block.height,
          txHash:      tx.id,
          txTime:      tx.data.timestamp,
          txData:      tx
        }, { transaction })
      }
      // Store updated validators
      for (const validator of updatedValidators) {
        await DB.Validator.upsert(validator, { transaction })
      }
      // Store updated proposals
      for (const { votes, ...proposal } of updatedProposals) {
        await DB.Proposal.upsert(proposal, { transaction })
        // Store updated votes for each proposal
        for (const vote of votes) {
          await DB.Vote.upsert(Object.assign(vote, { epoch }), transaction)
        }
      }
    })
    // Log performed updates.
    const t = performance.now() - t0
    this.logEH(epoch, height, `Added in`, t.toFixed(0), 'msec')
  }

  /** Find validators and proposals in the a block that need to be updated.
    * Called from updateBlock. */
  findValidatorsAndProposalsToUpdate (epoch, height, block, blockResults) {
    const validatorsToUpdate = new Set()
    const proposalsToUpdate  = new Set()
    for (const tx of block.transactions) {
      for (const content of tx.data?.content || []) {
        const { type: txType, data: txData } = content || {}
        if (txType) switch (txType) {
          case "tx_become_validator.wasm":
          case "tx_deactivate_validator.wasm":
          case "tx_reactivate_validator.wasm":
          case "tx_unjail_validator.wasm": {
            this.logEH(epoch, height, `Need to update validator`, txData.address)
            validatorsToUpdate.add(txData.address)
            break
          }
          case "tx_activate_validator.wasm":
          case "tx_bond.wasm":
          case "tx_change_validator_commission.wasm":
          case "tx_change_validator_metadata.wasm":
          case "tx_change_validator_power.wasm":
          case "tx_unbond.wasm": {
            this.logEH(epoch, height, `Need to update validator`, txData.validator)
            validatorsToUpdate.add(txData.validator)
            break
          }
          case "tx_init_proposal.wasm": {
            const id = this.findProposalId(blockResults.endBlockEvents, tx.id)
            if (id) {
              this.logEH(epoch, height, `New proposal`, id)
              proposalsToUpdate.add(id)
            } else {
              this.warnEH(epoch, height, `New proposal, unknown id`)
            }
            break
          }
          case "tx_vote_proposal.wasm": {
            const { id, voter, vote } = txData
            this.logEH(epoch, height, `Vote on`, id, 'by', voter, ':', vote)
            proposalsToUpdate.add(id)
            break
          }
        } else {
          this.warnEH(epoch, height, `Unupported content in TX ${tx.id}`, content)
        }
      }
    }
    return { validatorsToUpdate, proposalsToUpdate }
  }

  /** Find proposal ID of newly created proposal in blockResults. */
  findProposalId (endBlockEvents, txHash) {
    for (const { type, attributes } of endBlockEvents) {
      if (type === 'tx/applied') {
        for (const { key, value } of attributes) {
          if (key === 'hash' && value === txHash) {
            for (const { key, value } of attributes) {
              if (key === 'batch') {
                const batch = JSON.parse(value)
                const { Ok } = Object.values(batch)[0] || {}
                if (Ok) {
                  const { events } = Ok
                  for (const event of events) {
                    if (event.event_type?.inner === 'governance/proposal/new') {
                      return event.attributes.proposal_id
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    return null
  }

}
