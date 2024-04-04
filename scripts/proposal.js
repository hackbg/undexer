import init, { Query } from "../shared/pkg/shared.js";
import { deserialize } from "borsh";
import { readFileSync } from "node:fs";
import { ProposalSchema } from "../borsher-schema.js";
import "dotenv/config";
import Proposal from "../models/Proposal.js";

await init(readFileSync("shared/pkg/shared_bg.wasm"));

async function uploadProposal(proposalId, rpc_url) {
    const q = new Query(
        process.env.UNDEXER_RPC_URL || rpc_url || "https://rpc.namada.info/"
    );
    //const lastProposalId = Number(await q.last_proposal_id());

    console.log("Querying proposal:", i, "...");
    const proposalBinary = await q.query_proposal(BigInt(proposalId));
    const proposalDeserialized = deserialize(ProposalSchema, proposalBinary);

    const proposalDb = await Proposal.create(proposalDeserialized);
    await proposalDb.save();
    console.log("Proposal:", i, "uploaded successfully!");
}

export default uploadProposal;
