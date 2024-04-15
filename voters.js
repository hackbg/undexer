import { Core } from "@fadroma/namada";
import { Query } from "./rust/pkg/shared.js";
import fs from "fs/promises";
import { save } from "./utils.js";

const flags = process.argv.slice(2);
const shouldInit = flags.some((flag) => {
  return flag === "--init";
});
const q = new Query("https://rpc.namada.info");
const console = new Core.Console("Proposals");

process.chdir("data/voters");

if (shouldInit) {
  const lastProposal = {
    chain: await q.last_proposal_id(),
    file: await getLastAddedFile(),
  };
  const newProposalIds = Array.from(
    { length: lastProposal.chain },
    (_, i) => i
  ).slice(lastProposal.file, lastProposal.chain);
  const QUERY_THREADS = 1;

  console.log("Initializing new voters...");
  await queryMultipleVoters(QUERY_THREADS, newProposalIds, saveVoters);
}

setInterval(async () => {
  console.log("Querying active voter powers...");
  const activeProposalIds = await q.query_voters_power_by_proposal_id();
  const QUERY_THREADS = 1;
  await queryMultipleVoters(QUERY_THREADS, activeProposalIds, saveVoters);
}, 1000 * 60 * 5);

async function queryMultipleVoters(threads, proposalIds, batchVotersCallback) {
  const ids = [];
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

async function getLastAddedFile() {
  const files = await fs.readdir("./");
  const fileIds = files
    .map((file) => parseInt(file.split(".")[0]))
    .sort((a, b) => a - b);
  return fileIds[fileIds.length - 1];
}

async function saveVoters(proposalIds, voters) {
  for (let i = 0; i < proposalIds.length; i++) {
    const proposalId = proposalIds[i];
    await save(proposalId + ".json", voters);
  }
}
