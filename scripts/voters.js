import init, { Query } from "../shared/pkg/shared.js";
import Voter from "../models/Voter.js";
import { readFileSync } from "node:fs";
import { POST_UNDEXER_RPC_URL } from '../constants.js'

await init(readFileSync("shared/pkg/shared_bg.wasm"));

export default async function uploadVotersToDb(proposalId, rpc) {
    await Voter.sync();
    const q = new Query(POST_UNDEXER_RPC_URL || rpc );
    let voters = [];

    const { endEpoch } = await Proposal.findOne({
        where: {
            id: proposalId,
        },
    }); 

    voters = await q.query_voters_power_by_proposal_id(
        BigInt(proposalId),
        BigInt(Number(endEpoch))
    );

    for (const [key, value] of Object.entries(voters)) {
        await Voter.create({
            vote: value.vote,
            power: value.power,
            voter: key,
            proposalId: proposalId,
        });
    }

    console.log("Voters uploaded successfully!");
    console.log(await Voter.findAll());
}

uploadVotersToDb(6, "https://rpc.namada.info/");
