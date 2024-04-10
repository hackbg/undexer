#!/usr/bin/env -S node --import=@ganesha/esbuild

import * as Namada from '@fadroma/namada'
import getRPC      from './connection.js'
import Events      from './events.js'
import Queue       from './queue.js'
import indexBlock  from './index-block.js'
import sequelizer  from "./db/index.js";

await sequelizer.sync({
  force: Boolean(process.env.START_FROM_SCRATCH)
});

const console       = new Namada.Core.Console('Undexer')
const events        = await new Events()
const blockQueue    = new Queue(1024*1024)
const proposalQueue = new Queue(2048)

;(async function indexLatestBlock () {
  const index = blockQueue.last()
  if (index === null) {
    console.debug('Waiting for blocks to index')
    setTimeout(indexLatestBlock, 1000)
  } else {
    try {
      await indexBlock(index)
      blockQueue.complete(index)
    } catch (e) {
      e.message = `Failed to index block ${index}: ${e.message}`
      blockQueue.failure(index)
      console.error(e)
    }
    setTimeout(indexLatestBlock, 100)
  }
})()

;(async function indexLatestProposal () {
  const index = proposalQueue.last()
  if (index === null) {
    console.debug('Waiting for proposals to index')
    setTimeout(indexLatestProposal, 1000)
  } else {
    await indexProposal(index)
    proposalQueue.complete(index)
    setTimeout(indexLatestProposal, 100)
  }
})()

events
  .on('block',    onBlock)
  .on('proposal', onProposal)
  .on('vote',     onVote)
  .poll(1000)

async function onBlock (height) {
  const blocksToIndex = []
  for (let i = (blockQueue.first() || 1); i <= height; i++) {
    blockQueue.enqueue(i)
  }
}

async function onProposal () {
  console.log({onProposal: arguments})
}

async function onVote () {
  console.log({onVote: arguments})
}
