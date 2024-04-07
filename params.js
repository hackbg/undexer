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

const params = await q.query_protocol_parameters();
console.log(params);
