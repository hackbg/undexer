import { Core } from "@fadroma/namada";
import { Query } from "./rust/pkg/shared.js";
import Voter from './models/Voter.js'

const flags = process.argv.slice(2);
const shouldInit = flags.some((flag) => {
  return flag === "--init";
});
const q = new Query(POST_UNDEXER_RPC_URL);
const console = new Core.Console("Proposals");

if (shouldInit) {
  const lastProposal = {
    chain: await q.last_proposal_id(),
    db: await getLastAddedVoter(),
  };
  const newProposalIds = Array.from(
    { length: lastProposal.chain },
    (_, i) => i
  ).slice(lastProposal.db, lastProposal.chain);
  const QUERY_THREADS = 1;

  console.log("Initializing new voters...");
  await queryMultipleVoters(QUERY_THREADS, newProposalIds, saveVoters);
}

setInterval(async () => {
  console.log("Querying active voter powers...");
  const activeProposalIds = await q.query_active_proposals();
  const QUERY_THREADS = 1;
  await queryMultipleVoters(QUERY_THREADS, activeProposalIds, saveVoters);
}, 1000 * 60 * 5);

async function queryMultipleVoters(threads, proposalIds, batchVotersCallback) {
  for (let i = 0; i < proposalIds.length; i += threads) {
    const batchPromises = [];
    const tempProposalIds = proposalIds.slice(i, i + threads);
    const ids = [];
    for (const id of tempProposalIds) {
      console.log("Querying voter powers", id);
      batchPromises.push(q.query_voters_power_by_proposal_id(BigInt(id)));
      ids.push(id);
    }
    const batchVoters = await Promise.all(batchPromises);
    await batchVotersCallback(ids, batchVoters[0]);
  }
}

async function getLastAddedVoter() {
  const result = await Voter.findOne({
    raw: true,
    order: [["proposalId", "DESC"]],
  });
  return result ? result.proposalId+1 : 0
}

async function saveVoters(proposalIds, voters) {
  for(const proposalId of proposalIds){
      await Voter.bulkCreate(format(proposalId, voters));
  }
}

function format(proposalId, voters){
  const addresses = Object.keys(voters);
  return addresses.map((address) => {
    return {
      vote: voters[address].vote,
      power: voters[address].power,
      voter: address,
      proposalId,
    }
  })
}