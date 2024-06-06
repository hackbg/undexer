import Commands from "@hackbg/cmds"
import { getRPC } from './src/config.js'

export default class UndexerCommands extends Commands {
  // see https://github.com/hackbg/fadroma/blob/v2/packages/namada/namada.ts
  // for examples how to define commands

  constructor (...args) {
    super(...args)
    this.log.label = ''
  }

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
    info: 'print block and transactions in block',
    args: 'HEIGHT'
  }, async (height: number) => {
    const { connection } = await getRPC(height)
    const block = await connection.fetchBlock({ height })
    console.log(block)
    for (const transaction of block.transactions) {
      console.log()
      console.log(transaction)
    }
  })

}
