#!/usr/bin/env -S node --import @ganesha/esbuild
import './testDb.js'
import { Console } from "@hackbg/logs"
import { Indexer } from '../src/index.js'
import getRPC from '../src/rpc.js'
const console = new Console("Test: Indexing")
const indexer = new Indexer({
  log: console,
  chain: await getRPC('https://rpc.namada.tududes.com/'),
    //log: console,
    //connections: [ { log: console } ]
  //}
})
await Promise.all([
  indexer.fetcher.fetchHeight(),
  indexer.fetcher.fetchBlock(),
  indexer.fetcher.fetchBlockResults(),
  indexer.fetcher.fetchEpoch(),
  indexer.fetcher.fetchTotalStake(),
  indexer.fetcher.fetchAllParameters(),
  indexer.fetcher.fetchCurrentAndPastConsensusValidatorAddresses(),
  //indexer.fetcher.fetchRemainingValidatorAddresses(),
  indexer.fetcher.fetchValidatorAddresses(),
  //indexer.fetcher.fetchAllValidators(),
  //indexer.fetcher.fetchValidators(),
  //indexer.fetcher.fetchValidator(),
  indexer.fetcher.fetchProposalCount(),
  //indexer.fetcher.fetchProposals(),
  indexer.fetcher.fetchAllActiveProposalsWithVotes(),
  //indexer.fetcher.fetchProposalsWithVotes(),
  //indexer.fetcher.fetchProposal(),
  //indexer.fetcher.fetchProposalInfo(),
  //indexer.fetcher.fetchProposalResult(),
  //indexer.fetcher.fetchProposalsVotes(),
  //indexer.fetcher.fetchProposalVotes(),
])
//await indexer.update()
