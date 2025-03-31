import { Logged } from './utils.js'
import db from './db.js'
import {
  Epoch,
  Validator,
  Proposal,
  Vote,
  Block,
  BlockDataResponse,
  BlockResultsResponse,
  RPCResponse,
  Transaction,
} from './dbModel.js'

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
    await db.transaction(async transaction => {
      const context = { transaction }
      // Store epoch with total stake and parameters
      await Epoch.upsert({ id: epoch, totalStake, parameters }, context)
      // Store validator states
      for (const validator of validators) {
        validator.epoch = epoch
        validator.consensusAddress = validator.address
        const { namadaAddress, state, stake } = validator
        this.logE(epoch, `Updating validator ${namadaAddress} (${state.state}) ${stake}`)
        await Validator.upsert(validator, context)
      }
      // Store proposals and votes
      for (const { votes, ...proposal } of proposals) {
        await Proposal.upsert(proposal, context)
        // Store updated votes for each proposal
        for (const vote of votes) {
          await Vote.upsert(Object.assign(vote, { epoch }), transaction)
        }
      }
    })
  }

  /** Update a single block in the database.
    * Called on block increment. */
  async updateBlock ({ height, block }) {

    // Timed logging helper
    let t0 = performance.now()
    const stopwatch = info => {
      const t = (performance.now() - t0)
      this.logEH(epoch, height, info, `in`, (performance.now() - t0).toFixed(0), 'msec')
      t0 = performance.now()
    }

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
    this.logEH(epoch, height, { validatorsToUpdate, proposalsToUpdate })
    // Fetch data for validators and proposals that were updated during the block.
    const [updatedValidators, updatedProposals] = await Promise.all([
      this.fetcher.fetchValidators([...validatorsToUpdate], epoch),
      this.fetcher.fetchProposalsWithVotes([...proposalsToUpdate], epoch),
    ])

    // TODO: check for governance proposals that were not caught by the above logic

    stopwatch('Fetched block update')

    // Store raw RPC responses:
    await db.transaction(async transaction => { // store raw responses
      const context = { transaction }
      if (block.responses?.block) {
        await RPCResponse.upsert({ ...block.responses.block, blockHeight: block.height }, context)
      } else {
        this.warnEH(epoch, height, 'No raw block response')
      }
      if (block.responses?.results) {
        await RPCResponse.upsert({ ...block.responses?.results, blockHeight: block.height }, context)
      } else {
        this.warnEH(epoch, height, 'No raw results response')
      }
    })

    stopwatch('Stored raw block responses')

    // Store parsed RPC responses:
    await db.transaction(async transaction => {
      const context = { transaction }
      if (block.responses?.block?.response) {
        await BlockDataResponse.upsert({
          chainId:      block.header.chainId,
          blockHash:    block.hash,
          blockHeight:  block.height,
          blockTime:    block.time,
          blockData:    JSON.parse(block.responses.block.response),
        }, context)
      } else {
        this.warnEH(epoch, height, 'No parsed block response')
      }
      if (block.responses?.results?.response) {
        await BlockResultsResponse.upsert({
          chainId:      block.header.chainId,
          blockHash:    block.hash,
          blockHeight:  block.height,
          blockTime:    block.time,
          blockResults: JSON.parse(block.responses.results.response),
        }, context)
      } else {
        this.warnEH(epoch, height, 'No parsed results response')
      }
    })

    stopwatch('Stored parsed block responses')

    // Store fully decoded block data
    await db.transaction(async transaction => {

      const context = { transaction }

      // Update block header
      await Block.upsert({
        chainId:      block.header.chainId,
        blockHash:    block.hash,
        blockHeight:  block.height,
        blockTime:    block.time,
        blockHeader:  block.header,
        epoch,
      }, context)

      // Update each transaction in block
      for (const tx of block.transactions) {
        // Update transaction data
        this.logEH(epoch, height, `TX ${tx.id}: ${tx.data?.content[0]?.type}`)
        await Transaction.upsert({
          chainId:     tx.data.chainId,
          blockHash:   tx.block.hash,
          blockTime:   tx.block.time,
          blockHeight: tx.block.height,
          txHash:      tx.id,
          txTime:      tx.data.timestamp,
          txData:      tx
        }, context)
      }

      for (const validator of updatedValidators) {
        await Validator.upsert(validator, context)
      }

      for (const { votes, ...proposal } of updatedProposals) {
        await Proposal.upsert(proposal, context)
        // Store updated votes for each proposal
        for (const vote of votes) {
          await Vote.upsert(Object.assign(vote, { epoch }), transaction)
        }
      }

    })

    stopwatch('Stored block header, transactions, updated validators, updated proposals')

    //// Store updated validators
    //await db.transaction(async transaction => {
      //const context = { transaction }
    //})

    //stopwatch('Stored updated validators')

    //// Store updated proposals
    //await db.transaction(async transaction => {
      //const context = { transaction }
    //})

    //stopwatch('Stored updated proposals and votes')

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

  /** Update a single governance proposal.
    * Called from updateGovernance. */
  //async updateProposal (id, epoch, height) {
    //const proposal = await Proposal.findOne({ where: { id } })
    //if (proposal?.get().result) {
      //this.log.debug('Epoch', epoch, 'block', height, 'proposal', id, 'has result, skipping')
      //return
    //}
    //if (proposal === null) {
      //const proposalInfo = await this.fetcher.chain.fetchProposalInfo(id)
      //this.logEH(epoch, height, 'Adding proposal', id)
      //const { id: _, content, ...metadata } = proposalInfo
      //const fields = { id, content, metadata }
      //await Proposal.upsert(fields)
    //}
    //this.logEH('Proposal', id, 'fetching result')
    //const result = await this.fetcher.chain.fetchProposalResult(id)
    //if (result) {
      //await Proposal.upsert({ id, result })
      //this.logEH('Proposal', id, 'stored result')
    //}
    //const votes = await this.fetcher.chain.fetchProposalVotes(id)
    //this.logEH('Proposal', id, 'fetching power for', votes.length, 'votes')
    //await runParallel({ max: 30, inputs: votes, process: async vote => Object.assign(vote, {
      //power: vote.isValidator
        //? await this.fetcher.chain.fetchValidatorStake(vote.validator, epoch)
        //: await this.fetcher.chain.fetchBondWithSlashing(vote.delegator, vote.validator, epoch)
    //}) })
    //this.logEH('Proposal', id, 'storing', votes.length, 'votes')
    //const transaction = undefined
    ////await db.transaction(async transaction=>{
      //await Vote.destroy({ where: { proposal: id } }, {transaction})
      //for (const vote of votes) {
        //await Vote.upsert({ ...vote, proposal: id }, {transaction})
      //}
    ////})
    //this.logEH('Proposal', id, 'updated with', votes.length, 'votes')
  //}
