import init, { Query } from "./shared/pkg/shared.js";
import { deserialize } from "borsh";
import { save } from "./utils.js";
import { mkdirSync, readFileSync } from "node:fs";
import { ProposalSchema, ProposalsSchema } from "./borsher-schema.js";

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

const lastProposal = await q.last_proposal_id();

for(let i = 1; i < Number(lastProposal); i++) {
    const voters = await q.get_voters_power_by_proposal_id(BigInt(1), BigInt(12));
    await save(`${i}.json`, voters);
}