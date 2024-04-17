import { Core } from "@fadroma/namada";
import { Query } from "./rust/pkg/shared.js";
import { deserialize } from "borsh";
import Proposal from "./models/Proposal.js";
import { ProposalSchema } from "./borsher-schema.js";

const flags = process.argv.slice(2);
const shouldInit = flags.some((flag) => {
  return flag === "--init";
});

const q = new Query("https://rpc-namada-testnet.whispernode.com");
const console = new Core.Console("Proposals");


if (shouldInit) {
  const lastProposal = {
    chain: await q.last_proposal_id(),
    db: await getLastProposalDb(),
  };
  const newProposalIds = Array.from(
    { length: lastProposal.chain },
    (_, i) => i
  ).slice(lastProposal.db, lastProposal.chain);
  const QUERY_THREADS = 20;

  console.log("Initializing new proposals...");
  await queryMultipleProposals(QUERY_THREADS, newProposalIds, saveProposals);
}

setInterval(async () => {
  console.log("Querying active proposals...");
  const activeProposalIds = await q.query_active_proposals();
  const QUERY_THREADS = 20;
  await queryMultipleProposals(QUERY_THREADS, activeProposalIds, saveProposals);
}, 1000 * 60 * 5);

async function queryMultipleProposals(
  threads,
  proposalIds,
  batchProposalsCallback
) {
  for (let i = 0; i < proposalIds.length; i += threads) {
    const batchPromises = [];
    const tempProposalIds = proposalIds.slice(i, i + threads);

    for (const id of tempProposalIds) {
      console.log("Querying proposal", id);
      batchPromises.push(q.query_proposal(BigInt(id)));
    }
    const batchProposals = await Promise.all(batchPromises);
    const proposals = batchProposals.map((proposal) =>
      deserialize(ProposalSchema, proposal)
    );
    await batchProposalsCallback(proposals);
  }
}

async function getLastProposalDb() {
  const latestProposal = await Proposal.findOne({
    raw: true,
    order: [["id", "DESC"]],
  });
  return latestProposal ? latestProposal.id+1 : 0;
}

async function saveProposals(proposals) {
  await Proposal.bulkCreate(proposals);
}
