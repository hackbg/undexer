#!/usr/bin/env -S node --import=@ganesha/esbuild

import Events from './events.js'
import Queue from './queue.js'

const blockQueue = new Queue(1024*1024)

indexLatestBlock()

async function indexLatestBlock () {
  const index = blockQueue.last()
  if (index !== null) {
    console.log({indexBlock: index})
    blockQueue.complete(index)
  }
  setImmediate(indexLatestBlock)
}

const proposalQueue = new Queue(2048)

const events = await new Events()

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
