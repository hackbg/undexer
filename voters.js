import init, { Query } from "./shared/pkg/shared.js";
import { save } from "./utils.js";
import { mkdirSync, readFileSync } from "node:fs";
import "dotenv/config";
import fs from "fs";

await init(readFileSync("shared/pkg/shared_bg.wasm"));
const q = new Query(
  process.env.UNDEXER_RPC_URL || "http://namada-testnet-rpc.stakeandrelax.net"
);

if (process.env.UNDEXER_DATA_DIR) {
  await mkdirSync(process.env.UNDEXER_DATA_DIR + "/voters", {
    recursive: true,
  });
  process.chdir(process.env.UNDEXER_DATA_DIR + "/voters/");
} else {
  throw new Error("set UNDEXER_DATA_DIR");
}

const allProposals = JSON.parse(
  fs.readFileSync(`../proposals/all_proposals.json`, "utf8")
);

for (let i = 0; i <= allProposals.lenght; i++) {
  const proposal = JSON.parse(
    fs.readFileSync(`../proposals/${i}.json`, "utf8")
  );
  console.log(`${i}/${allProposals.length}`);
  const voters = await q.query_voters_power_by_proposal_id(
    BigInt(i),
    BigInt(Number(proposal.endEpoch))
  );
  await save(`${i}.json`, voters);
}