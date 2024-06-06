import * as Namada from '@fadroma/namada';
import Commands from "@hackbg/cmds";
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { readFileSync } from 'node:fs';

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
    args: 'BLOCK_HEIGHT [RPC_URL]'
  }, async (height: number, url: string) => {
    height = Number(height)
    url ||= Namada.testnet().url
    const decoder = readFileSync(resolve(
      dirname(fileURLToPath(import.meta.url)),
      'node_modules/@fadroma/namada/pkg/fadroma_namada_bg.wasm',
    ))
    const connection = await Namada.connect({ url, decoder })
    const [
      blockResponse,
      blockResultsResponse
    ] = await Promise.all([
      fetch(`${connection.url}/block?height=${height}`)
        .then(response=>response.text()),
      fetch(`${connection.url}/block_results?height=${height}`)
        .then(response=>response.text()),
    ])
    //this.log({
      //url,
      //height,
      //connection,
      //blockResponse,
      //blockResultsResponse
    //})
    const decoded = connection.decode.block(
      blockResponse,
      blockResultsResponse
    )
    for (const tx of decoded.txs) {
      //if (tx.content.type !== 'tx_init_proposal.wasm') continue
      this.log(tx)
      //this.log(tx.content)
    }
  })

}
