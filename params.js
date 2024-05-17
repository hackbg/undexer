import init, { Query } from "./shared/pkg/shared.js";
import { deserialize } from "borsh";
import { save } from "./utils.js";
import { mkdirSync, readFileSync } from "node:fs";
import { ProposalSchema, ProposalsSchema } from "./borsher-schema.js";

import { POST_UNDEXER_RPC_URL } from "./constants.js";

await init(readFileSync("shared/pkg/shared_bg.wasm"));
const q = new Query(
    POST_UNDEXER_RPC_URL
);

const params = await q.query_protocol_parameters();
console.log(params);
