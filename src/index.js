import { Console } from '@fadroma/namada'
import * as Config from './config.js'
import * as Query from './dbQuery.js'
import { Updater } from './indexUpdater.js'
import { Fetcher } from './indexFetcher.js'
import { RemoteControl } from './indexRemote.js'
import { Logged, retryForever } from './utils.js'

const console = new Console('', Config.LOG_CONFIG)
console.debug = () => {}

/** Main indexer controller. */
export class Indexer extends Logged {
  constructor ({
    chain, // NamadaChain instance from Fadroma.
    proxyApi = Config.PROXY_CONTROL_URL,
    nodeApi  = Config.NODE_CONTROL_URL,
    log      = console,
  } = {}) {
    super({ log })
    // Mute debug logging.
    this.log.debug = () => {}
    // Enable fetching well-formed data from the chain.
    this.fetcher = new Fetcher({ log, chain })
    // Enable copying data from the chain into the DB.
    this.updater = new Updater({ log, fetcher: this.fetcher })
    // Enable pausing and resyncing the node.
    this.remote  = new RemoteControl({ log, chain, proxyApi, nodeApi })
    // Initialize counters
    this.blockOnChain    = 0n
    this.blockInDatabase = 0n
    this.epochOnChain    = 0n
    this.epochInDatabase = 0n
  }

  async run () {
    // Connect to remote control sockets (for pausing/unpausing/resyncing node)
    await this.remote.connect()
    // Query latest indexed block and epoch from DB
    this.blockInDatabase = BigInt(await Query.latestBlock()||0)
    this.epochInDatabase = BigInt(await Query.latestEpoch()??-1)
    this.logEH(this.epochInDatabase, this.blockInDatabase, 'Starting')
    while (true) {
      await retryForever(Config.TICK, () => this.update())
    }
  }

  async update () {
    // Update block counter.
    this.log.br()
    this.blockOnChain    = BigInt(await this.fetcher.fetchHeight())
    this.blockInDatabase = BigInt(await Query.latestBlock()||0)
    this.log(
      `Block`, String(this.blockInDatabase), `/`, String(this.blockOnChain),
      `(${String(this.blockOnChain - this.blockInDatabase)} behind)`
    )
    // Update block data, transactions, validators, proposals, votes.
    if (this.blockInDatabase < this.blockOnChain) {
      const height = this.blockInDatabase + 1n
      await retryForever(1000, () => this.updater.updateBlock({ height }))
      // Update epoch counter.
      this.log.br()
      this.epochOnChain    = BigInt(await this.fetcher.fetchEpoch(this.blockOnChain))
      this.epochInDatabase = BigInt(await Query.latestEpoch()??-1)
      this.log(
        `Epoch`, String(this.epochInDatabase), `/`, String(this.epochOnChain),
        `(${String(this.epochOnChain - this.epochInDatabase)} behind)`
      )
      // Update epoch data, resume, or resync:
      if (this.epochInDatabase < this.epochOnChain - 2n) {
        // If we are more than 2 epochs behind the chain, it becomes
        // impossible to fetch correct values for certain fields (pruned).
        // So... we need to trigger a full resync of the local node :(
        //
        // Normally, this should not happen, as the node controller
        // automatically tells the sync proxy controller to cut off
        // the connection on epoch increment, thus pausing the sync
        // on each epoch for the indexer to catch up.
        //
        // Thus, if this code is reached, it signals a bug in the
        // sync pauser, or else another invalid condition.
        if (Config.ALLOW_INCOMPLETE) {
          console.warn(
            `DB is >2 epochs behind chain (DB ${this.inDB}, `+
            `chain ${this.onChain}). Historical data may be inaccurate! `+
            `Run with ALLOW_INCOMPLETE=0 to force resync.`
          )
        } else {
          console.warn(
            `🚨🚨🚨 DB is >2 epochs behind chain (DB ${this.inDB}, `+
            `chain ${this.onChain}). Resyncing node from block 1!`
          )
          await this.remote.restart()
        }
      } else if (this.epochInDatabase < this.epochOnChain) {
        // If we are 1 or 2 epochs behind, we can update the data
        // for the given epoch, thus advancing the epoch counter.
        await this.updater.updateEpoch({ epoch: this.epochInDatabase + 1n })
      }
    } else if (await this.remote.isPaused()) {
      // If we are not behind, but the sync is paused,
      // this means we are ready to resume the sync.
      console.log('🟢 Resuming sync')
      await this.remote.resume()
    } else {
      await new Promise(resolve=>setTimeout(resolve, Config.TICK))
    }
  }
}
