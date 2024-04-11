import { Query } from "./rust/pkg/shared.js";
import { Core } from "@fadroma/namada";
import { deserialize } from "borsh";
import { ProposalSchema } from "./borsher-schema.js";
import sequelizer from "./db/index.js";
import Proposal from "./models/Proposal.js";

const console = new Core.Console("Proposals");
const q = new Query("https://rpc-namada-testnet.whispernode.com");
await Proposal.sync({ force: true });

// add finished proposals to the database
try {
  console.log("Querying finished proposals");
  const finishedProposals = await q.query_finished_proposals();
  console.log("Finished querying proposals", finishedProposals.join(", "));
  for (let proposal of finishedProposals) {
    console.log(`Querying proposal with id: ${proposal}`);
    const proposalBinary = await q.query_proposal(BigInt(proposal));
    const finishedProposal = deserialize(ProposalSchema, proposalBinary);
    console.log("Finished proposal:", finishedProposal);
    await Proposal.create(finishedProposal, {
      where: {
        id: BigInt(proposal),
      },
    });
  }
} catch (error) {
    console.log(err);
}

// update active proposals every 3 hours
setInterval(async () => {
  for (let proposal of activeProposals) {
    try {
      const activeProposals = await q.query_active_proposals();
      console.log("Active Proposals", activeProposals.join(", "));
      console.log(`Querying proposal with id: ${proposal}`);
      const proposalBinary = await q.query_proposal(BigInt(proposal));
      const updatedProposal = deserialize(ProposalSchema, proposalBinary);
      console.log("Proposal:", updatedProposal);
      await Proposal.update(updatedProposal, {
        where: {
          id: BigInt(proposal),
        },
      });
    } catch (err) {
      console.log(err);
    }
  }
}, 1000 * 60 * 60 * 3);
