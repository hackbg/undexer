import Commands from "@hackbg/cmds";
import uploadProposals from "./scripts/proposal.js";
import uploadVotersToDb from "./scripts/voters.js";
import uploadBlocksAndTxs from "./scripts/block.js";
export default class UndexerCommands extends Commands {
    // see https://github.com/hackbg/fadroma/blob/v2/packages/namada/namada.ts
    // for examples how to define commands

  txs = this.command({
    name: "txs",
    info: "download all txs",
    args: "RPC_URL",
  }, function (RPC_URL: string) {
    uploadBlocksAndTxs(RPC_URL);
  });

  proposal = this.command({
    name: "proposals",
    info: "download all proposals",
    args: "RPC_URL",
  },
  async function (url: string) {
    uploadProposals(url);
  });

  voters = this.command({
    name: "voters",
    info: "download all voters",
    args: "RPC_URL",
  }, async function (url: string) {
    uploadVotersToDb(url);
  });
}
