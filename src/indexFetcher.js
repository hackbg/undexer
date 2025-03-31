import { Console } from '@fadroma/namada'
import { Logged, retryForever, runParallel } from './utils.js'
import db from './db.js'
import * as Query from './dbQuery.js'

const console = new Console('indexFetcher.js', { json: true, color: false })

export class Fetcher extends Logged {
  constructor ({ log, chain, retry = 1000 }) {
    super({ log })
    this.chain = chain
    this.retry = retry
  }
  fetchHeight () {
    this.log('Fetching block height')
    return retryForever(this.retry, () => this.chain.fetchHeight())
  }
  fetchBlock (height) {
    this.logH(height, 'Fetching block')
    return retryForever(this.retry, () => this.chain.fetchBlock({ height, raw: true }))
  }
  fetchBlockResults (height) {
    this.logH(height, 'Fetching block results')
    return retryForever(this.retry, () => this.chain.fetchBlockResults({ height }))
  }
  fetchEpoch (height) {
    this.logH(height, 'Fetching epoch at height')
    return retryForever(this.retry, () => this.chain.fetchEpoch({ height }))
  }
  fetchTotalStake (epoch) {
    this.logE(epoch, 'Fetching total stake')
    return retryForever(this.retry, () => this.chain.fetchTotalStaked({ epoch }))
  }
  async fetchAllParameters (epoch) {
    this.logE(epoch, 'Fetching all chain parameters')
    const [protocol, pgf, pos, gov] = await Promise.all([
      retryForever(this.retry, () => this.chain.fetchProtocolParameters()),
      retryForever(this.retry, () => this.chain.fetchPGFParameters()),
      retryForever(this.retry, () => this.chain.fetchStakingParameters()),
      retryForever(this.retry, () => this.chain.fetchGovernanceParameters())
    ])
    return {
      protocol,
      pgf,
      pos,
      gov
    }
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
  async fetchAllValidators (epoch) {
    this.logE(epoch, `Fetching all validators`)
    const addresses = await this.fetchValidatorAddresses(epoch)
    return await this.fetchValidators(addresses, epoch)
  }
  async fetchValidators (inputs, epoch) {
    if (inputs.length > 0) {
      this.logE(epoch, `Fetching ${inputs.length} validator(s)`)
      const iterator = this.chain.fetchValidatorsIter({ epoch: Number(epoch), addresses: inputs })
      return await runParallel({
        max: 50,
        inputs,
        process: async _ => {
          const validator = (await iterator.next()).value
          validator.epoch = epoch
          validator.consensusAddress = validator.address
          return validator
        }
      })
    } else {
      return []
    }
  }
  async fetchValidator (address, epoch) {
    this.logE(epoch, `Fetching validators`, address)
    const validator = await this.chain.fetchValidator(address, { epoch })
    return Object.assign(validator, { epoch, consensusAddress: address })
  }
  async fetchProposalCount (epoch) {
    this.logE(epoch, `Fetching proposal count`)
    return await this.chain.fetchProposalCount(epoch)
  }
  async fetchProposals (ids, epoch) {
    if (ids.length > 0) {
      this.logE(epoch, `Fetching ${ids.length} proposal(s)`)
      return await Promise.all(ids.map(id=>this.fetchProposal(id, epoch)))
    } else {
      return []
    }
  }
  async fetchAllActiveProposalsWithVotes (epoch) {
    this.logE(epoch, `Fetching all active proposals with votes`)
    const count = await this.fetchProposalCount(epoch)
    const idsWithoutResults = new Set(await Query.proposalsWithoutResults())
    const ids = []
    for (let id = 0; id < count; id++) {
      const result = await this.fetchProposalResult(id, epoch)
      if (result) {
        if (idsWithoutResults.has(id)) {
          this.logE(epoch, 'Proposal', id, 'has new result, storing')
          ids.push(id)
        } else {
          this.logE(epoch, 'Proposal', id, 'already has stored result, not updating')
        }
      } else {
        ids.push(id)
      }
    }
    return await this.fetchProposalsWithVotes(ids, epoch)
  }
  async fetchProposalsWithVotes (ids, epoch) {
    if (ids.length > 0) {
      this.logE(epoch, `Fetching ${ids.length} proposal(s)`)
      return await Promise.all(ids.map(async id=>{
        const proposal = await this.fetchProposal(id, epoch)
        proposal.votes = await this.fetchProposalVotes(id, epoch)
        return proposal
      }))
    } else {
      return []
    }
  }
  async fetchProposal (id, epoch) {
    this.logE(epoch, `Fetching proposal`, id)
    const { id: _, content, ...metadata } = await this.chain.fetchProposalInfo(id, { epoch })
    const result = await this.chain.fetchProposalResult(id)
    return { id, epoch, content, metadata, result }
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
    if (ids.length > 0) {
      this.logE(epoch, `Fetching votes for ${ids.length} proposal(s)`)
      return await Promise.all(ids.map(id=>this.fetchProposalVotes(id, epoch)))
    } else {
      return []
    }
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
        //this.logE(epoch, `Proposal ${id}: vote ${vote.data} by ${kind} ${voter}: ${power}`)
        return {
          proposal: id,
          kind,
          isValidator,
          validator: vote.validator,
          delegator: vote.delegator,
          voter,
          power,
          data: vote.data,
          epoch,
        }
      }
    })
  }
}
