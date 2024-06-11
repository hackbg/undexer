import Commands from "@hackbg/cmds"
import EventEmitter from 'node:events'

export default class UndexerCommands extends Commands {
  // see https://github.com/hackbg/fadroma/blob/v2/packages/namada/namada.ts
  // for examples how to define commands

  constructor (...args) {
    super(...args)
    this.log.label = ''
  }

  sync = this.command({
    name: "sync",
    info: "sync the database schema"
  }, async () => {
    this.log.br().log('Synchronizing database...')
    const { default: db } = await import('./src/db.js')
    await db.sync({ force: true })
    this.log.br().log('Done.')
  })

  api = this.command({
    name: "api",
    info: "run the API server"
  }, () => import('./src/api/main.js'))

  indexer = this.command({
    name: "indexer",
    info: "run the indexer"
  }, () => import('./src/main.js'))

  block = this.command({
    name: 'block',
    info: 'fetch, print, and index a block of transactions',
    args: 'HEIGHT'
  }, async (height: number) => {
    const t0 = performance.now()
    const { getRPC } = await import('./src/config.js')
    const { updateBlock } = await import('./src/block.js')
    const { chain } = await getRPC(height)
    // Fetch and decode block
    const block = await chain.fetchBlock({ height })
    // Print block and transactions
    this.log.br().log(block)
    for (const transaction of block.transactions) {
      this.log.br().log(transaction)
    }
    // Write block to database
    this.log.br().log('Syncing database...')
    const { default: db } = await import('./src/db.js')
    await db.sync({ force: true })
    this.log.br().log('Saving block', height, 'to database...').br()
    await updateBlock({ chain, height, block, })
    this.log.info('Done in', performance.now() - t0, 'msec')
  })

}
