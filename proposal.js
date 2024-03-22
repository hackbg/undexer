import init, { Query } from "./shared/pkg/shared.js";
import { deserialize } from "borsh";
import { save } from "./utils.js";
import { mkdirSync, readFileSync } from "node:fs";
import { ProposalSchema, ProposalsSchema } from "./borsher-schema.js";
import "dotenv/config";

await init(readFileSync("shared/pkg/shared_bg.wasm"));
const q = new Query(
    process.env.UNDEXER_RPC_URL || "https://namada-testnet-rpc.itrocket.net"
);

if (process.env.UNDEXER_DATA_DIR) {
    await mkdirSync(process.env.UNDEXER_DATA_DIR + "/proposals", {
        recursive: true,
    });
    process.chdir(process.env.UNDEXER_DATA_DIR + "/proposals/");
} else {
    throw new Error("set UNDEXER_DATA_DIR");
}

const proposals = await q.query_proposals();
const proposalsDeserialized = deserialize(ProposalsSchema, proposals);

for (let i = 0; i < proposalsDeserialized.length - 1; i++) {
  const proposalBinary = await q.query_proposal(BigInt(i));
  const proposalDeserialized = deserialize(ProposalSchema, proposalBinary);
  await save(`${i}.json`, proposalDeserialized);
}
