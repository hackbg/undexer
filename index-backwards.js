#!/usr/bin/env -S node --import=@ganesha/esbuild

import * as Namada from '@fadroma/namada'
import getRPC      from './connection.js'
import Events      from './events.js'
import Queue       from './queue.js'
import indexBlock from './index-block.js'
import indexProposal from './index-proposal.js'
import sequelize  from "./db/index.js";

await sequelize.sync({
  force: Boolean(process.env.START_FROM_SCRATCH)
});

const console       = new Namada.Core.Console('Undexer')
const events        = await new Events()
const blockQueue    = new Queue(1024*1024)
const proposalQueue = new Queue(2048)

// Index blocks from queue.
;(async function indexLatestBlock () {
  const index = blockQueue.last()
  if (index === null) {
    console.debug('Waiting for new blocks')
    setTimeout(indexLatestBlock, 1000)
  } else {
    try {
      await indexBlock(index, events)
      blockQueue.complete(index)
    } catch (e) {
      e.message = `Failed to index block ${index}: ${e.message}`
      blockQueue.failure(index)
      console.error(e)
    }
    setTimeout(indexLatestBlock, 100)
  }
})()

// Index proposals from queue
;(async function indexLatestProposal () {
  const index = proposalQueue.last()
  if (index === null) {
    console.debug('Waiting for new proposals')
    setTimeout(indexLatestProposal, 1000)
  } else {
    try {
      await indexProposal(index)
      proposalQueue.complete(index)
    } catch (e) {
      e.message = `Failed to index proposal ${index}: ${e.message}`
      proposalQueue.failure(index)
      console.error(e)
    }
    setTimeout(indexLatestProposal, 100)
  }
})()

events
  .on('block',    onBlock)
  .on('proposal', onProposal)
  .on('vote',     onVote)
  .poll(1000)

async function onBlock (height) {
  // TODO: Efficiently query DB and don't enqueue
  //       blocks that have already been stored!
  for (let i = (blockQueue.first() || 1); i <= height; i++) {
    blockQueue.enqueue(i)
  }
}

async function onProposal ({ height }) {
  console
    .br()
    .warn('TODO:', {onVote: {height}})
    .warn('TODO:', 'if height > lastHeightWhenListOfProposalsWasUpdated:')
    .warn('TODO:', '  proposalCount = updateProposalCount()')
    .warn('TODO:', '  for i from 1 to proposalCount:')
    .warn('TODO:', '    proposalQueue.enqueue(proposal)')
    .warn('TODO:', 'Only the new proposals should get enqueued')
    .br()
}

async function onVote ({ height, proposal }) {
  console
    .br()
    .warn('TODO:', {onVote: {height, proposal}})
    .warn('TODO:', 'if height > lastHeightWhenThisProposalWasUpdated:')
    .warn('TODO:', '  proposalQueue.enqueue(proposal, true)')
    .warn('TODO:', "Don't forget the 'true' parameter (forces proposal reindex)!")
    .br()
}
