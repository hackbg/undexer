
import { Query } from "./rust/pkg/shared.js";
import { Core } from '@fadroma/namada'
import { deserialize } from "borsh";
import { ProposalSchema } from "./borsher-schema.js";
import sequelizer from './db/index.js';
import Proposal from "./models/Proposal.js";

const console = new Core.Console('Proposals')
const q = new Query("https://rpc-namada-testnet.whispernode.com");
await sequelizer.sync();

console.log("Querying active proposals...");
const activeProposals = await q.query_active_proposals();
console.log("Active Proposals", activeProposals.join(', '));
for(let proposal of activeProposals){
    console.log(`Querying proposal with id: ${proposal}`);
    const proposalBinary = await q.query_proposal(BigInt(proposal));
    const updatedProposal = deserialize(ProposalSchema, proposalBinary);
    console.log("Proposal:", updatedProposal);
    await Proposal.update(updatedProposal,{where: {
        id: BigInt(proposal)
    }})
}