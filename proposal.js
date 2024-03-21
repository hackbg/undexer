import init, { Query } from "./shared/pkg/shared.js";
import { deserialize } from "borsh";
import { save} from "./utils.js";
import { mkdirSync, readFileSync } from "node:fs";
import { ProposalSchema } from "./borsher-schema.js";

await init(readFileSync('shared/pkg/shared_bg.wasm'));
const q = new Query(process.env.UNDEXER_RPC_URL || 'https://namada-testnet-rpc.itrocket.net');

try{
    await mkdirSync("governance");
}
catch(ex){
    console.log("Governance already exists");
}
process.chdir("governance");
try{
    await mkdirSync("proposal");
}
catch(ex){
    console.log("Proposal already exists");
}
process.chdir("proposal");


const proposals = await q.query_proposals();
const proposalsDeserialized = deserialize(ProposalsSchema, proposals);

for (let i = 0; i < proposalsDeserialized.length-1; i++) {
    const proposalBinary = await q.query_proposal(BigInt(i));
    const proposalDeserialized = deserialize(ProposalSchema, proposalBinary);
    save(`${i}.json`, proposalDeserialized);
}

