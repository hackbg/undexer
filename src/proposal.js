import { Query } from "@namada/shared"
import { deserialize } from "borsh"
import { Proposal } from "./db/index.js"

export async function createProposal (txData, height) {
  console.log("=> Creating proposal", txData)
  await withLogErrorToDB(() => Proposal.create(txData), {
    create: 'proposal',
    height
  })
  // const latestProposal = await Proposal.findOne({ order: [["id", "DESC"]] })
  /*
    const { q } = getUndexerRPCUrl(NODE_LOWEST_BLOCK_HEIGHT+1)
    const proposalChain = await q.query_proposal(BigInt(txData.proposalId))
    await Proposal.create(proposalChain)
    */
}

export async function updateProposal (proposalId, height) {
  console.log("=> Updating proposal")
  const proposal = await q.query_proposal(BigInt(proposalId))
  await withLogErrorToDB(() => sequelize.transaction(async dbTransaction => {
    await Proposal.destroy({ where: { id: proposalId } }, { transaction: dbTransaction })
    await WASM_TO_CONTENT["tx_vote_proposal.wasm"].create(proposal, { transaction: dbTransaction })
  }), {
    update: 'proposal',
    height,
    proposalId,
  })
}

export const ProposalSchema = {
  struct: {
    id: "string",
    proposalType: "string",
    author: "string",
    startEpoch: "u64",
    endEpoch: "u64",
    graceEpoch: "u64",
    contentJSON: "string",
    status: "string",
    result: "string",
    totalVotingPower: "string",
    totalYayPower: "string",
    totalNayPower: "string",
    totalAbstainPower: "string",
    tallyType: "string",
  },
}

export const ProposalsSchema = {
  array: {
    type: ProposalSchema,
  },
}

export async function queryMultipleProposals (
  threads,
  proposalIds,
  batchProposalsCallback
) {
  for (let i = 0; i < proposalIds.length; i += threads) {
    const batchPromises = []
    const tempProposalIds = proposalIds.slice(i, i + threads)

    for (const id of tempProposalIds) {
      console.log("Querying proposal", id)
      batchPromises.push(q.query_proposal(BigInt(id)))
    }
    const batchProposals = await Promise.all(batchPromises)
    const proposals = batchProposals.map((proposal) =>
      deserialize(ProposalSchema, proposal)
    )
    await batchProposalsCallback(proposals)
  }
}

export async function getLastProposalDb () {
  const latestProposal = await Proposal.findOne({
    raw: true,
    order: [["id", "DESC"]],
  })
  return latestProposal ? latestProposal.id + 1 : 0
}

export async function saveProposals (proposals) {
  await Proposal.bulkCreate(proposals)
}

//import { POST_UNDEXER_RPC_URL } from "./config.js"
//await Proposal.sync({ force: true })

//const flags = process.argv.slice(2)
//const shouldInit = flags.some((flag) => {
  //return flag === "--init"
//})

//import { Console } from "@fadroma/namada"
//const q = new Query(POST_UNDEXER_RPC_URL)
//const console = new Console("Proposals")

//if (shouldInit) {
  //const lastProposal = {
    //chain: await q.last_proposal_id(),
    //db: await getLastProposalDb(),
  //}
  //const newProposalIds = Array.from(
    //{ length: lastProposal.chain },
    //(_, i) => i
  //).slice(lastProposal.db, lastProposal.chain)
  //const QUERY_THREADS = 20

  //console.log("Initializing new proposals...")
  //await queryMultipleProposals(QUERY_THREADS, newProposalIds, saveProposals)
//}

//setInterval(async () => {
  //console.log("Querying active proposals...")
  //const activeProposalIds = await q.query_active_proposals()
  //const QUERY_THREADS = 20
  //await queryMultipleProposals(QUERY_THREADS, activeProposalIds, saveProposals)
//}, 1000 * 60 * 5)
