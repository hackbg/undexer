import EventEmitter from 'node:events'
import { Core } from '@fadroma/namada'
import getRPC from './connection.js'
import { retryForever } from './utils.js'

const console = new Core.Console('Events')

export class Events extends EventEmitter {
  static async init (interval = 5000) {
    const emitter = new this()
    await pollCurrentBlock(emitter, interval)
    return emitter
  }

  constructor () {
    super()
    this.rpc = getRPC()
    this.latest = 0
    this.pollInterval = 5000
  }

  async poll () {
    const { conn, query } = getRPC(this.latest + 1)
    const latest = await getBlockHeight(conn)
    if (latest !== this.latest) {
      console.log('Latest block:', latest)
      this.latest = latest
      this.emit('block', latest)
    }
    setTimeout(pollCurrentBlock, this.pollInterval)
    return this
  }
}

export async function getBlockHeight (connection, retryInterval = 5000) {
  return retryForever('get block height', retryInterval, async () => {
    const height = Number(await connection.height)
    if (isNaN(height)) {
      throw new Error(`returned height ${height}`)
    }
    return height
  })
}

export async function pollCurrentBlock (emitter, interval = 5000) {
  const latest = await getBlockHeight()
  if (latest !== emitter.latest) {
    console.log('Latest block:', latest)
    emitter.latest = latest
    emitter.emit('block', latest)
  }
  setTimeout(pollCurrentBlock, interval)
}

export class Queue {
  queue = []
  paused = true
  addToQueue () {
    this.paused = false
    setImmediate(()=>this.processQueue())
  }
  async processQueue () {
    if (this.queue.length > 0) {
      await this.takeFromQueue()
    } else {
      this.paused = true
    }
  }
}

export class BlockQueue extends Queue {
  constructor (connection, events) {
    this.connection = connection
    events.on('block', (height)=>this.addToQueue(height))
  }
  addToQueue (height) {
    this.queue.unshift(height)
    super.addToQueue()
  }
  async takeFromQueue () {
    const height = this.queue.shift()
    const decoded = connection.decode.block(...await Promise.all([
      fetch(`${this.connection.url}/block?height=${height}`)
        .then(response=>response.text()),
      fetch(`${this.connection.url}/block_results?height=${height}`)
        .then(response=>response.text()),
    ]))
  }
}

export class ProposalQueue extends Queue {
  constructor (connection, events) {
    this.connection = connection
    events.on('vote', (proposalId)=>this.addToQueue(proposalId))
  }
  addToQueue (proposalId) {
    this.queue.unshift(proposalId)
    super.addToQueue()
  }
  async takeFromQueue () {
    const proposalId = this.queue.shift()
  }
}
