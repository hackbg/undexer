#!/usr/bin/env -S node --import=@ganesha/esbuild

import EventEmitter from "node:events";
import { initialize, serialize } from "./utils.js";
import { getValidator, getValidatorsFromNode } from "./scripts/validator.js";
import { Console } from "@fadroma/agent";
import Block, { getLatestBlockInDB } from "./models/Block.js";
import Proposal from "./models/Proposal.js";
import {
  NODE_LOWEST_BLOCK_HEIGHT,
  START_FROM_SCRATCH
} from "./constants.js";
import Validator from "./models/Validator.js";
import VoteProposal from "./models/Contents/VoteProposal.js";
import sequelize from "./db/index.js";
import TransactionManager from "./TransactionManager.js";
import getRPC from "./connection.js";

let isProcessingNewBlock = false;
let isProcessingNewValidator = false;

await initialize();
await sequelize.sync({ force: Boolean(START_FROM_SCRATCH) });

const console = new Console("Index");
const eventEmitter = new EventEmitter();

setTimeout(checkForNewBlock, 5000);
async function checkForNewBlock() {
  // should use newer node for the blockchain height
   const { connection }= await getRPC(NODE_LOWEST_BLOCK_HEIGHT+1);
  const currentBlockOnChain = await connection.height;
  const latestBlockInDb = Number(NODE_LOWEST_BLOCK_HEIGHT) || (await getLatestBlockInDB());
  console.log({ currentBlockOnChain, latestBlockInDb });
  if (currentBlockOnChain > latestBlockInDb) {
    console.br().log("Starting from block", latestBlockInDb + 1);
    await updateBlocks(latestBlockInDb + 1, currentBlockOnChain);
  } else {
    console.log("=====================================");
    console.info("No new blocks");
    console.log("=====================================");
  }

  setTimeout(checkForNewBlock, 5000);
}

async function updateBlocks(blockHeightDb, chainHeight) {
  if (isProcessingNewBlock) return;
  isProcessingNewBlock = true;

  console.log("=====================================");
  console.log("Processing new blocks");
  console.log("=====================================");

  for (let i = blockHeightDb; i <= chainHeight; i++) {
    const { connection } = await getRPC(i);

    const { id, header, blockRaw, resultsRaw, txs } = await connection.fetchBlock({ height:i });

    header.height = String(header.height)
    header.version.block = String(header.version.block)
    header.version.app = String(header.version.app)

    const blockData = {
      id,
      header,
      height:      header.height,
      results:     JSON.parse(resultsRaw),
      rpcResponse: JSON.parse(blockRaw),
    }

    console.log(blockData)

    await Block.create(blockData);

    const txsDecoded = []
    for (const i in txs) {
      try {
        txsDecoded[i] = Namada.TX.Transaction.fromDecoded(txs[i])
      } catch (error) {
        console.error(error)
        console.warn(`Failed to decode transaction #${i} in block ${height}, see above for details.`)
        txsDecoded[i] = new Namada.TX.Transactions.Undecoded({
          data: txs[i],
          error: error
        })
      }
    }
    for (let tx of txsDecoded) {
      tx.txId = tx.id
      await TransactionManager.handleTransaction(i, tx, eventEmitter);
      console.log(i, tx)
    }

    console.log("Added block", i);
  }
  isProcessingNewBlock = false;
}


eventEmitter.on("updateValidators", async () => {
  if (isProcessingNewValidator) return;
  isProcessingNewValidator = true;

  const { q, conn } = getRPC(NODE_LOWEST_BLOCK_HEIGHT + 1);

  console.log("=====================================");
  console.log("Processing new validator");
  console.log("=====================================");

  const validatorsBinary = await getValidatorsFromNode(conn);
  for (const validatorBinary of validatorsBinary) {
    const validator = await getValidator(q, conn, validatorBinary);
    await Validator.create(JSON.parse(serialize(validator)));
  }

  isProcessingNewValidator = false;
});

eventEmitter.on("createProposal", async (txData) => {
  await Proposal.create(txData);
  // const latestProposal = await Proposal.findOne({ order: [["id", "DESC"]] });
  /*
    const { q } = getUndexerRPCUrl(NODE_LOWEST_BLOCK_HEIGHT+1)
    const proposalChain = await q.query_proposal(BigInt(txData.proposalId));
    await Proposal.create(proposalChain);
    */
});

eventEmitter.on("updateProposal", async (proposalId, blockHeight) => {
  await Proposal.destroy({ where: { id: proposalId } });
  const { q } = getRPC(blockHeight);

  const proposal = await q.query_proposal(BigInt(proposalId));
  await VoteProposal.create(proposal);
});

