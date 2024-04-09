import * as Namada from '@fadroma/namada';
import Commands from "@hackbg/cmds";

export default class UndexerCommands extends Commands {
  // see https://github.com/hackbg/fadroma/blob/v2/packages/namada/namada.ts
  // for examples how to define commands

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
    const connection = Namada.testnet()
    const [
      blockResponse,
      blockResultsResponse
    ] = await Promise.all([
      fetch(`${connection.url}/block?height=${height}`)
        .then(response=>response.json()),
      fetch(`${connection.url}/block_results?height=${height}`)
        .then(response=>response.json()),
    ])
    console.log({
      url,
      height,
      connection,
      blockResponse,
      blockResultsResponse
    })
    connection.decode.decoded_block(
      blockResponse,
      blockResultsResponse
    )
  })

}
