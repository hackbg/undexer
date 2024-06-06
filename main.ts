import * as Namada from '@fadroma/namada'
import Commands from "@hackbg/cmds"
import { pathToFileURL, fileURLToPath } from 'node:url'
import { resolve, dirname } from 'node:path'
import { readFileSync } from 'node:fs'
import getRPC from './src/config/connection.js'

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
    info: 'fetch and decode a block',
    args: 'HEIGHT'
  }, async (height: number) => {
    const { connection } = await getRPC(height)
    const block = await connection.fetchBlock({ height })
    console.log(block)
  })

}
