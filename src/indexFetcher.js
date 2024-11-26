import { Console } from '@fadroma/namada'
import { Logged, retryForever, runParallel } from './utils.js'

const console = new Console('')

export class Fetcher extends Logged {
  constructor ({ log, chain }) {
    super({ log })
    this.chain = chain
  }

  fetchTotalStake (epoch) {
    this.logE(epoch, 'Fetching total stake')
    return retryForever(1000, () => this.chain.fetchTotalStaked({ epoch }))
  }

  fetchBlock (height) {
    this.logH(height, 'Fetching block')
    return retryForever(1000, () => this.chain.fetchBlock({ height, raw: true }))
  }
  
  fetchBlockResults (height) {
    this.logEH(epoch, 'Fetching block results')
    return retryForever(1000, () => this.chain.fetchBlockResults({ height }))
  }

  fetchEpoch (height) {
    this.logH(height, 'Fetching epoch at height')
    return retryForever(1000, () => this.chain.fetchEpoch({ height }))
  }

  async fetchCurrentAndPastConsensusValidatorAddresses (epoch) {
    this.logE(epoch, 'Fetching consensus validators')
    const [currentConsensusValidators, previousConsensusValidators] = await Promise.all([
      this.chain.fetchValidatorsConsensus(epoch),
      (epoch > 0n) ? await this.chain.fetchValidatorsConsensus(epoch - 1n) : Promise.resolve([])
    ])
    return new Set([
      ...currentConsensusValidators.map(y=>y.address),
      ...previousConsensusValidators.map(y=>y.address),
    ])
  }

  async fetchRemainingValidatorAddresses (consAddrs, epoch) {
    this.logE(epoch, 'Fetching non-consensus validators')
    const allAddrs = await this.chain.fetchValidatorAddresses(epoch)
    return allAddrs.filter(x=>!consAddrs.has(x))
  }

  async fetchValidatorAddresses (epoch) {
    this.logE(epoch, 'Fetching validator addresses')
    return await this.chain.fetchValidatorAddresses(epoch)
  }

  async fetchValidators (inputs, epoch) {
    this.logE(epoch, `Fetching ${inputs.length} validator(s)`)
    const iterator   = this.chain.fetchValidatorsIter({ epoch: Number(epoch), addresses: inputs })
    const process    = async _ => (await iterator.next()).value
    const validators = await runParallel({ max: 50, inputs, process })
    //console.log({validators})
    return validators
  }

  async fetchValidator (address, epoch) {
    this.logE(epoch, `Fetching validators`, address)
    const validator = await this.chain.fetchValidator(address, { epoch })
    return Object.assign(validator, { epoch })
  }

  async fetchProposalCount (epoch) {
    this.logE(epoch, `Fetching proposal count`)
    return await this.chain.fetchProposalCount(epoch)
  }

  async fetchProposals (ids, epoch) {
    this.logE(epoch, `Fetching ${ids.length} proposal(s)`)
    throw new Error('todo')
  }

  async fetchProposalInfo (id, epoch) {
    this.logE(epoch, `Fetching proposal info`, id)
    const { id: _, content, ...metadata } = await this.chain.fetchProposalInfo(id, epoch)
    return { id, content, metadata }
  }

  async fetchProposalResult (id, epoch) {
    this.logE(epoch, `Fetching proposal result`, id)
    return await this.chain.fetchProposalResult(id, epoch)
  }

  async fetchProposalsVotes (ids, epoch) {
    this.logE(epoch, `Fetching votes for ${ids.length} proposal(s)`)
    return await Promise.all(ids.map(id=>this.fetchProposalVotes(id, epoch)))
  }

  async fetchProposalVotes (id, epoch) {
    this.logE(epoch, `Fetching proposal votes`, id)
    const votes = await this.chain.fetchProposalVotes(id)
    return await runParallel({
      max:     30,
      inputs:  votes,
      process: async vote => {
        const isValidator = vote.isValidator
        const kind  = isValidator ? 'validator' : 'delegator'
        const voter = isValidator ? vote.validator : vote.delegator
        const power = isValidator
          ? await this.chain.fetchValidatorStake(vote.validator, epoch)
          : await this.chain.fetchBondWithSlashing(vote.delegator, vote.validator, epoch)
        console.log(`Epoch ${epoch} proposal ${id} vote by ${kind} ${voter}: ${power}`)
        return {
          proposal: id,
          voter,
          isValidator,
          validator: vote.validator,
          delegator: vote.delegator,
          power
        }
      }
    })
  }
}

  /** Update all governance proposals.
    * Called on every block. */
  //async updateGovernance (height, epoch) {
    //const proposals = await this.fetcher.chain.fetchProposalCount(epoch)
    //this.logEH(epoch, height, 'Proposals:', proposals)
    //const inputs = Array(Number(proposals)).fill(-1).map((_,i)=>i).reverse()
    //await runParallel({ max: 30, inputs, process: id => this.updateProposal(id, epoch, height) })
  //}

  /** Update a single governance proposal.
    * Called from updateGovernance. */
  //async updateProposal (id, epoch, height) {
    //const proposal = await DB.Proposal.findOne({ where: { id } })
    //if (proposal?.get().result) {
      //this.log.debug('Epoch', epoch, 'block', height, 'proposal', id, 'has result, skipping')
      //return
    //}
    //if (proposal === null) {
      //const proposalInfo = await this.fetcher.chain.fetchProposalInfo(id)
      //this.logEH(epoch, height, 'Adding proposal', id)
      //const { id: _, content, ...metadata } = proposalInfo
      //const fields = { id, content, metadata }
      //await DB.Proposal.upsert(fields)
    //}
    //this.logEH('Proposal', id, 'fetching result')
    //const result = await this.fetcher.chain.fetchProposalResult(id)
    //if (result) {
      //await DB.Proposal.upsert({ id, result })
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
    ////await DB.default.transaction(async transaction=>{
      //await DB.Vote.destroy({ where: { proposal: id } }, {transaction})
      //for (const vote of votes) {
        //await DB.Vote.upsert({ ...vote, proposal: id }, {transaction})
      //}
    ////})
    //this.logEH('Proposal', id, 'updated with', votes.length, 'votes')
  //}
