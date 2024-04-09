#!/usr/bin/env -S node --import=@ganesha/esbuild

import EventEmitter from "node:events";
import { initialize, serialize } from "./utils.js";
import { getValidator, getValidatorsFromNode } from "./scripts/validator.js";
import { Query } from "./shared/pkg/shared.js";
import * as Namada from "@fadroma/namada";
import Block, { getLatestBlockInDB } from "./models/Block.js";
import Proposal from "./models/Proposal.js";
import {
  NODE_LOWEST_BLOCK_HEIGHT,
  POST_UNDEXER_RPC_URL,
  PRE_UNDEXER_RPC_URL
} from "./constants.js";
import Validator from "./models/Validator.js";
import VoteProposal from "./models/Contents/VoteProposal.js";
import sequelizer from "./db/index.js";
import { Sequelize } from "sequelize";
import TransactionManager from "./TransactionManager.js";

let isProcessingNewBlock = false;
let isProcessingNewValidator = false;

await initialize();
sequelizer.sync({ force: Boolean(process.env.START_FROM_SCRATCH) });

const console = new Namada.Core.Console('Index')
const eventEmitter = new EventEmitter();

checkForNewBlock();
async function checkForNewBlock() {
  // should use newer node for the blockchain height
  const currentBlockOnChain =
    await getUndexerRPCUrl(NODE_LOWEST_BLOCK_HEIGHT+1).conn.height;
  const isDatabaseEmpty =
    (await Block.count()) === 0
  if (isDatabaseEmpty) {
    await updateBlocks(1, currentBlockOnChain)
  } else {
    const latestBlockInDb =
      await getLatestBlockInDB();
    if (currentBlockOnChain > latestBlockInDb) {
      console.br().log('Starting from block', latestBlockInDb + 1)
      await updateBlocks(latestBlockInDb + 1, currentBlockOnChain)
    } else {
      console.log("=====================================");
      console.info("No new blocks");
      console.log("=====================================");
    }
  }
  setTimeout(checkForNewBlock, 5000)
}

async function updateBlocks (blockHeightDb, chainHeight) {
    if (isProcessingNewBlock) return;
    isProcessingNewBlock = true;

    console.log("=====================================");
    console.log("Processing new blocks");
    console.log("=====================================");

    for (let i = blockHeightDb; i <= chainHeight; i++) {
        const { conn } = getUndexerRPCUrl(i);
        const block = await conn.getBlock(i);
        const { txsDecoded } = block;

        await Block.create(block);
        for (let tx of txsDecoded) {
            await TransactionManager.handleTransaction(i, tx, eventEmitter);
        }
        console.log('Added block', i)
    }
    isProcessingNewBlock = false;
}

eventEmitter.on("updateValidators", async () => {
    if (isProcessingNewValidator) return;
    isProcessingNewValidator = true;

    const { q, conn } = getUndexerRPCUrl(NODE_LOWEST_BLOCK_HEIGHT+1);

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
    const { q } = getUndexerRPCUrl(blockHeight);

    const proposal = await q.query_proposal(BigInt(proposalId));
    await VoteProposal.create(proposal);
});

function getUndexerRPCUrl(blockHeight) {
    if(blockHeight > NODE_LOWEST_BLOCK_HEIGHT) {
        return {
            q: new Query(POST_UNDEXER_RPC_URL),
            conn: Namada.testnet({ url: POST_UNDEXER_RPC_URL })
        }
    }
    else {
        return {
            q: new Query(PRE_UNDEXER_RPC_URL),
            conn: Namada.testnet({ url: PRE_UNDEXER_RPC_URL })
        }
    }
}
