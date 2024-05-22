#!/usr/bin/env -S node --import=@ganesha/esbuild

import {
  NODE_LOWEST_BLOCK_HEIGHT,
  START_FROM_SCRATCH,
  VALIDATOR_UPDATE_INTERVAL,
  BLOCK_UPDATE_INTERVAL
} from "./constants.js";

import getRPC from "./connection.js";
import sequelize from "./db/index.js";
import EventEmitter from "node:events";
import { initialize, serialize } from "./utils.js";
import { getValidator, getValidatorsFromNode } from "./scripts/validator.js";
import { Console } from "@hackbg/fadroma";
import { format } from "./utils.js";

import Block from "./models/Block.js";
import Proposal from "./models/Proposal.js";
import Validator from "./models/Validator.js";
import VoteProposal from "./models/Contents/VoteProposal.js";
import Cipher from "./models/Sections/Cipher.js";
import Code from "./models/Sections/Code.js";
import Data from "./models/Sections/Data.js";
import ExtraData from "./models/Sections/ExtraData.js";
import MaspBuilder from "./models/Sections/MaspBuilder.js";
import Signature from "./models/Sections/Signature.js";
import Transaction from "./models/Transaction.js";
import { WASM_TO_CONTENT } from './models/Contents/index.js';

await initialize();
await sequelize.sync({ force: Boolean(START_FROM_SCRATCH) });

const console = new Console("Index");
const events = new EventEmitter();

checkForNewBlock();
updateValidators();

async function updateValidators() {
  const { connection } = await getRPC(NODE_LOWEST_BLOCK_HEIGHT+1);
  const validators = await connection.getValidators({ details: true });
  await sequelize.transaction(async dbTransaction => {
    await Validator.destroy({ where: {} }, { transaction: dbTransaction });
    await Validator.bulkCreate(validators, { transaction: dbTransaction });
  })
  setTimeout(updateValidators, VALIDATOR_UPDATE_INTERVAL);
}

async function checkForNewBlock() {
  // should use newer node for the blockchain height
  const { connection }      = await getRPC(NODE_LOWEST_BLOCK_HEIGHT+1);
  const currentBlockOnChain = await connection.height;
  const latestBlockInDb     = await Block.max('height') || Number(NODE_LOWEST_BLOCK_HEIGHT);
  if (currentBlockOnChain > latestBlockInDb) {
    console.log("=> Current block on chain:", currentBlockOnChain);
    console.log("=> Latest block in DB:", latestBlockInDb);
    await updateBlocks(latestBlockInDb + 1, currentBlockOnChain);
  } else {
    console.info("=> No new blocks");
  }
  setTimeout(checkForNewBlock, BLOCK_UPDATE_INTERVAL);
}

async function updateBlocks(startHeight, endHeight) {
  console.log("=> Processing blocks from", startHeight, "to", endHeight);
  for (let i = startHeight; i <= endHeight; i++) {
    const { connection } = await getRPC(i);
    const { id, header, blockRaw, resultsRaw, txs } = await connection.fetchBlock({ height: i });
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
    await sequelize.transaction(async dbTransaction => {
      await Block.create(blockData, { transaction: dbTransaction });
      for (let tx of txsDecoded) {
        tx.txId = tx.id
        await handleTransaction(i, tx, events, dbTransaction);
        console.log(i, tx)
      }
    })
    console.log("Added block", i);
  }
}

events.on("updateValidators", async () => {
  const { q, conn } = getRPC(NODE_LOWEST_BLOCK_HEIGHT + 1);
  console.log("=====================================");
  console.log("Processing new validator");
  console.log("=====================================");
  const validatorsBinary = await getValidatorsFromNode(conn);
  const validators = []
  for (const validatorBinary of validatorsBinary) {
    const validator = await getValidator(q, conn, validatorBinary);
    const validatorData = JSON.parse(serialize(validator));
    validators.push(validatorData);
  }
  await sequelize.transaction(async dbTransaction => {
    for (const validatorData of validators) {
      await Validator.create(validatorData, { transaction: dbTransaction });
    }
  })
});

events.on("createProposal", async (txData) => {
  await Proposal.create(txData);
  // const latestProposal = await Proposal.findOne({ order: [["id", "DESC"]] });
  /*
    const { q } = getUndexerRPCUrl(NODE_LOWEST_BLOCK_HEIGHT+1)
    const proposalChain = await q.query_proposal(BigInt(txData.proposalId));
    await Proposal.create(proposalChain);
    */
});

events.on("updateProposal", async (proposalId, blockHeight) => {
  const { q } = getRPC(blockHeight);
  const proposal = await q.query_proposal(BigInt(proposalId));
  await sequelize.transaction(async dbTransaction => {
    await Proposal.destroy({ where: { id: proposalId } }, { transaction: dbTransaction });
    await VoteProposal.create(proposal, { transaction: dbTransaction });
  })
});

export async function handleTransaction(blockHeight, tx, events, dbTransaction) {
  if (tx.content !== undefined) {
    const uploadData = format(Object.assign(tx.content));
    await WASM_TO_CONTENT[tx.content.type].create(uploadData.data);
    if (VALIDATOR_TRANSACTIONS.includes(tx.content.type)) {
      events.emit("updateValidators", blockHeight);
    }
    if (tx.content.type === "tx_vote_proposal.wasm") {
      events.emit("updateProposal", tx.content.data.proposalId, blockHeight);
    }
    if (tx.content.type === "tx_init_proposal.wasm") {
      events.emit("createProposal", tx.content.data);
    }
  }
  for (let i = 0; i < tx.sections.length; i++) {
    const section = tx.sections[i];
    if (section.type == "ExtraData") {
      await ExtraData.create(section, { transaction: dbTransaction });
    }
    if (section.type == "Code") {
      await Code.create(section, { transaction: dbTransaction });
    }
    if (section.type == "Data") {
      await Data.create(section, { transaction: dbTransaction });
    }
    if (section.type == "Signature") {
      await Signature.create(section, { transaction: dbTransaction });
    }
    if (section.type == "MaspBuilder") {
      await MaspBuilder.create(section, { transaction: dbTransaction });
    }
    if (section.type == "Cipher") {
      await Cipher.create(section, { transaction: dbTransaction });
    }
    if (section.type == "MaspBuilder") {
      await MaspBuilder.create(section, { transaction: dbTransaction });
    }
  }
  await Transaction.create(tx, { transaction: dbTransaction });
}
