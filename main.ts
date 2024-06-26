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
    name: "unsafe-sync",
    info: "delete database and recreate with up-to-date schema"
  }, async () => {
    this.log.br().log('Synchronizing database...')
    const { default: db } = await import('./src/db.js')
    await db.sync({ force: true })
    this.log.br().log('Done.')
  })

  api = this.command({
    name: "api",
    info: "run the API server"
  }, () => import('./bin/api.js'))

  indexer = this.command({
    name: "index",
    info: "run the indexer"
  }, () => import('./bin/indexer.js'))

  block = this.command({
    name: 'block',
    info: 'fetch, print, and index a block of transactions',
    args: 'HEIGHT'
  }, async (height: number) => {
    const t0 = performance.now()
    const { updateBlock } = await import('./src/block.js')
    const { default: getRPC } = await import('./src/rpc.js')
    const chain = await getRPC(height)
    // Fetch and decode block
    const block = await chain.fetchBlock({ height })
    height ??= block.height
    // Print block and transactions
    this.log.br().log(block)
    for (const transaction of block.transactions) {
      this.log.br().log(transaction)
    }
    // Write block to database
    this.log.br().log('Syncing database...')
    const { default: db } = await import('./src/db.js')
    await db.sync()
    this.log.br().log('Saving block', height, 'to database...').br()
    await updateBlock({ chain, height, block, })
    this.log.info('Done in', performance.now() - t0, 'msec')
  })

  validatorsFetch = this.command({
    name: 'validators fetch',
    info: 'fetch current info about validators'
  }, async () => {
    const { default: getRPC } = await import('./src/rpc.js')
    const chain = await getRPC()
    console.log(Object.values(await chain.fetchValidators()))
  })

  validatorsUpdate = this.command({
    name: 'validators update',
    info: 'fetch validators and update in db'
  }, async () => {
    const { default: getRPC } = await import('./src/rpc.js')
    const chain = await getRPC()
    const { updateValidators } = await import('./src/validator.js')
    const validators = await updateValidators(chain)
    for (const i in validators) {
      console.log(`#${Number(i)+1}:`, validators[i])
    }
  })

  validatorsStates = this.command({
    name: 'validators states',
    info: 'count validators in database by state'
  }, async (height: number) => {
    const { callRoute, dbValidatorStates } = await import('./src/routes.js')
    const states = await callRoute(dbValidatorStates)
    console.log({states})
  })

}
