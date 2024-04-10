import init, { Query } from "./shared/pkg/shared.js";
import { deserialize } from "borsh";
import { save } from "./utils.js";
import { ProposalSchema, ProposalsSchema } from "./borsher-schema.js";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { writeFile, readdir } from 'node:fs/promises'
import { makeDirIfItDoesntExist, save } from "./utils.js";
import "dotenv/config";

await init(
  readFileSync("shared/pkg/shared_bg.wasm")
);

const q = new Query(
  process.env.UNDEXER_RPC_URL || "https://namada-testnet-rpc.itrocket.net"
);

if (process.env.UNDEXER_DATA_DIR) {
  await mkdirSync(process.env.UNDEXER_DATA_DIR + "/proposals", {
    recursive: true,
  });
} else {
  throw new Error("set UNDEXER_DATA_DIR");
}

let averageTime = 0

main()

export default async function main () {

  let latest = await getLatestProposal()
  setTimeout(pollCurrentBlock, 5000)

  let current = 1
  pollCurrentProposalId()

  ingestProposals()

  async function pollCurrentProposalId() {
    latest = await q.last_proposal_id()
    console.log('Latest proposal:', latest)
  }

  async function ingestProposals () {
    while (true) {
      if (current <= latest) {
        await retryForever(
          `ingest proposal ${current}/${latest}`, 5000,
          ingestProposal, current, latest
        )
        current++
      } else {
        console.log('Reached latest proposal, waiting for next')
        await waitFor(5000)
      }
    }
  }
}

export async function getLatestProposal () {
  return retryForever(
    'get latest proposal id', 5000, async () => {
      const proposalId = Number(await q.last_proposal_id())
      if (isNaN(proposalId)) {
        throw new Error(`returned proposal id ${proposalId}`)
      }
      return proposalId
    }
  )
}

export async function ingestProposal (current, latest) {

  const proposalsRoot = `proposals`
  // const pageIndex  = `${proposalsRoot}/index.json`
  const proposalDir  = `${proposalsRoot}/${current}`

  if (!existsSync(proposalDir)) {

    const t0 = performance.now()

    console.log(
      '\nIndexing proposal:', current,
      'of', latest,
      `(${((current/latest)*100).toFixed(3)}%)`
    )

    const proposalBinary = await retryForever(
      `get proposal ${current}`, 5000, () => q.query_proposal(BigInt(current))
    )

    const proposalDeserialized = deserialize(ProposalSchema, proposalBinary);

    //Fetch all proposals
    const allProposals = JSON.parse(
      readFileSync(`all_proposals.json`, "utf8")
    );
    allProposals.push(proposalDeserialized);
    
    await Promise.all([
      save(`${i}.json`, proposalDeserialized),
      save(`all_proposals.json`, allProposals),
    ]);

    // await Promise.all([
    //   save(blockPath, {...block, txids}),
    //   readdir(blockPage).then(listing=>save(pageIndex, {
    //     blocks: listing.filter(x=>x!=='index.json')
    //       .map(x=>Number(x))
    //       .filter(x=>!isNaN(x))
    //       .sort((a, b) => (b - a))
    //   })),
    //   readdir(blockRoot).then(listing=>save(pageList, {
    //     latestBlock:   latest,
    //     latestIndexed: current,
    //     pages: listing.filter(x=>x!=='index.json')
    //   })),
    // ])

    const t = performance.now() - t0
    averageTime = (averageTime + t) / 2

    console.log(
      '\nAverage:', 
      averageTime.toFixed(0),
      'msec'
    )

    console.log(
      'ETA: in',
      ((latest - current) * averageTime / 1000).toFixed(0),
      'sec'
    )
  }

}

const proposals = await q.query_proposals();
const proposalsDeserialized = deserialize(ProposalsSchema, proposals);
await save("all_proposals.json", proposalsDeserialized);
