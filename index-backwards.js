#!/usr/bin/env -S node --import=@ganesha/esbuild
import * as Namada from '@fadroma/namada'
import Events from './events.js'
import Queue from './queue.js'
import getRPC from './connection.js'

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
    await indexBlock(index)
    blockQueue.complete(index)
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

async function indexBlock (height) {
  console.debug('Indexing block', height)
  const { connection, query } = getRPC(height)
  const [ blockResponse, blockResultsResponse ] = await Promise.all([
    fetch(`${connection.url}/block?height=${height}`)
      .then(response=>response.text()),
    fetch(`${connection.url}/block_results?height=${height}`)
      .then(response=>response.text()),
  ])
  const decoded = connection.decode.block(
    blockResponse,
    blockResultsResponse
  )
  console.log({decoded})
}

async function indexProposal (id) {
  console.debug('Indexing proposal', height)
  const { connection, query } = getRPC()
}
