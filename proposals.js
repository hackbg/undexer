import init, { Query } from "./shared/pkg/shared.js";
import { deserialize } from "borsh";
import { save } from "./utils.js";
import { mkdirSync, readFileSync } from "node:fs";
import { ProposalSchema, ProposalsSchema } from "./borsher-schema.js";
import fs from "fs";
import "dotenv/config";

await init(readFileSync("shared/pkg/shared_bg.wasm"));
const q = new Query(
  process.env.UNDEXER_RPC_URL || "https://namada-testnet-rpc.itrocket.net"
);

if (process.env.UNDEXER_DATA_DIR) {
  await mkdirSync(process.env.UNDEXER_DATA_DIR + "/proposals", {
    recursive: true,
  });
  process.chdir(process.env.UNDEXER_DATA_DIR + "/proposals/");
} else {
  throw new Error("set UNDEXER_DATA_DIR");
}

while (true) {
  const allProposals = JSON.parse(
    fs.readFileSync(`all_proposals.json`, "utf8")
  );

  const lastProposalId = await q.last_proposal_id();
  console.log(`Last proposal ID: ${lastProposalId}`);

  if (allProposals.length < lastProposalId) {
    console.log(
      `Last indexed proposal: ${allProposals.length}/${lastProposalId}. Indexing...`
    );
    for (let i = allProposals.length; i < lastProposalId; i++) {
      console.log(`Indexing proposal #${i}`);
      const proposalBinary = await q.query_proposal(BigInt(i));
      const proposalDeserialized = deserialize(ProposalSchema, proposalBinary);
      await save(`${i}.json`, proposalDeserialized);
      allProposals.push(proposalDeserialized);
      await save(`all_proposals.json`, allProposals);
    }
  }
}
