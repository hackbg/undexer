import * as Namada from '@fadroma/namada';
import Commands from "@hackbg/cmds";
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { readFileSync } from 'node:fs';
import uploadProposals from "./scripts/proposal.js";
import uploadVotersToDb from "./scripts/voters.js";
import uploadBlocksAndTxs from "./scripts/block.js";

export default class UndexerCommands extends Commands {
  // see https://github.com/hackbg/fadroma/blob/v2/packages/namada/namada.ts
  // for examples how to define commands

  constructor (...args) {
    super(...args)
    this.log.label = 'Undexer'
  }

  txs = this.command({
    name: "txs",
    info: "download all txs",
    args: "RPC_URL",
  }, async (RPC_URL: string) => {
    const { default: uploadBlocksAndTxs } = await import('./scripts/block.js')
    uploadBlocksAndTxs(RPC_URL);
  });

  proposal = this.command({
    name: "proposals",
    info: "download all proposals",
    args: "RPC_URL",
  }, async (url: string) => {
    const { default: uploadProposals } = await import('./scripts/proposal.js')
    uploadProposals(url);
  });

  voters = this.command({
    name: "voters",
    info: "download all voters",
    args: "RPC_URL",
  }, async (url: string) => {
    const { default: uploadVotersToDb } = await import('./scripts/voters.js')
    uploadVotersToDb(url);
  });

  blockResults = this.command({
    name: 'block',
    info: 'fetch block results',
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
