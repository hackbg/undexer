import EventEmitter from 'node:events'
import { Console } from '@hackbg/fadroma'
import getRPC from './connection.js'
import { retryForever } from './utils.js'

const console = new Console('Events')

export default class Events extends EventEmitter {

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
    this.log = console
  }

  async poll (interval = 5000) {
    this.pollInterval = interval
    const { connection, query } = getRPC(this.latest + 1)
    const latest = await getBlockHeight(connection)
    //this.log(`Latest block of ${connection.url}:`, latest)
    if (latest !== this.latest) {
      console.log('Newer block:', latest)
      this.latest = latest
      this.emit('block', latest)
    } else {
      this.log('No newer block')
    }
    setTimeout(()=>this.poll(), this.pollInterval)
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

export async function blockQueueHandler () {
  const height = this.queue.shift()
  const decoded = connection.decode.block(...await Promise.all([
    fetch(`${this.connection.url}/block?height=${height}`)
      .then(response=>response.text()),
    fetch(`${this.connection.url}/block_results?height=${height}`)
      .then(response=>response.text()),
  ]))
}
