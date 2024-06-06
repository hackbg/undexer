#!/usr/bin/env -S node --import=@ganesha/esbuild

import {
  BLOCK_UPDATE_INTERVAL,
  NODE_LOWEST_BLOCK_HEIGHT,
  START_FROM_SCRATCH,
  VALIDATOR_FETCH_PARALLEL,
  VALIDATOR_FETCH_DETAILS_PARALLEL,
  VALIDATOR_TRANSACTIONS,
  VALIDATOR_UPDATE_INTERVAL,
} from "./config/index.js";
import getRPC from "./config/connection.js";
console.log('Indexer is starting at', new Date());
import { Console } from '@hackbg/fadroma'
import sequelize, {
  withLogErrorToDB,
  Block,
  Proposal,
  Validator,
  Transaction,
  WASM_TO_CONTENT,
  Sections,
} from "./db/index.js";
import EventEmitter from "node:events";
import {
  initialize,
  format,
  cleanup
} from "./utils.js";
import {
  getValidator,
  getValidatorsFromNode,
} from "./validator.js";

// Initialize WASM

console.log('Initializing...')
await initialize();

// Initialize database schema

console.log('Syncing DB schema...')
await sequelize.sync({ force: Boolean(START_FROM_SCRATCH) });

// This emits events to update validators and proposals

const events = new EventEmitter();

// Connect to chain:

console.log('Connecting...')
const { connection, query } = await getRPC();

// Start indexing blocks and validators:

console.log('Begin indexing!')
checkForNewBlock();
updateValidators();

async function updateValidators () {
  const console = new Console(`Validators`)
  const validators = await connection.getValidators({
    details:         true,
    parallel:        VALIDATOR_FETCH_PARALLEL,
    parallelDetails: VALIDATOR_FETCH_DETAILS_PARALLEL,
  });
  await withLogErrorToDB(() => sequelize.transaction(async dbTransaction => {
    await Validator.destroy({ where: {} }, { transaction: dbTransaction });
    await Validator.bulkCreate(validators, { transaction: dbTransaction });
  }), {
    update: 'validators'
  })
  console.log('Updated to', Object.keys(validators).length, 'validators')
  setTimeout(updateValidators, VALIDATOR_UPDATE_INTERVAL);
}

async function checkForNewBlock () {
  // should use newer node for the blockchain height
  const currentBlockOnChain = await connection.height;
  const latestBlockInDb     = await Block.max('height') || Number(NODE_LOWEST_BLOCK_HEIGHT);
  console.log("=> Current block on chain:", currentBlockOnChain);
  console.log("=> Latest block in DB:", latestBlockInDb);
  if (currentBlockOnChain > latestBlockInDb) {
    await updateBlocks(latestBlockInDb + 1, currentBlockOnChain);
  } else {
    console.info("=> No new blocks");
  }
  setTimeout(checkForNewBlock, BLOCK_UPDATE_INTERVAL);
}

async function updateBlocks (startHeight, endHeight) {
  console.log("=> Processing blocks from", startHeight, "to", endHeight);
  for (let height = startHeight; height <= endHeight; height++) {
    await updateBlock(height)
  }
}

async function updateBlock (height) {
  const console = new Console(`Block ${height}`)
  const t0 = performance.now()
  const block = await connection.fetchBlock({ height, raw: true });
  const blockData = {
    id:          block.id,
    header:      block.header,
    height:      block.header.height,
    results:     JSON.parse(block.rawResultsResponse),
    rpcResponse: JSON.parse(block.rawBlockResponse),
  };
  await withLogErrorToDB(() => sequelize.transaction(async dbTransaction => {
    await Block.create(blockData, { transaction: dbTransaction });
    for (const transaction of block.transactions) {
      transaction.txId = transaction.id
      await updateTransaction(height, transaction, events, dbTransaction);
    }
  }), {
    update: 'block',
    height
  })
  const t = performance.now() - t0
  for (const transaction of block.transactions) {
    console.log("++ Added transaction", transaction.id);
  }
  console.log("++ Added block", height, 'in', t.toFixed(0), 'msec');
  console.br()
}

export async function updateTransaction (
  height, transaction, events, dbTransaction
) {
  const console = new Console(`Block ${height}, TX ${transaction.id.slice(0, 8)}`)
  if (transaction.content !== undefined) {
    console.log("=> Add content", transaction.content.type);
    const uploadData = format(Object.assign(transaction.content));
    const TxContent = WASM_TO_CONTENT[transaction.content.type]
    if (TxContent) {
      await TxContent.create(uploadData.data);
      if (VALIDATOR_TRANSACTIONS.includes(transaction.content.type)) {
        events.emit("updateValidators", height);
      }
      if (transaction.content.type === "transaction_vote_proposal.wasm") {
        events.emit("updateProposal", transaction.content.data.proposalId, height);
      }
      if (transaction.content.type === "transaction_init_proposal.wasm") {
        events.emit("createProposal", transaction.content.data, height);
      }
    } else {
      console.warn(`Unsupported content ${transaction.content.type}`)
    }
  }
  for (let section of transaction.sections) {
    section = cleanup(section)
    const Section = Sections[section.type]
    if (!Section) {
      throw new Error(`Encountered unsupported transaction section: ${section.type}`)
    }
    await Section.create(section, { transaction: dbTransaction });
    console.log("=> Add section", section.type);
  }
  delete transaction.content
  delete transaction.sections
  console.log("=> Add");
  await Transaction.create(transaction, { transaction: dbTransaction });
}

events.on("updateValidators", async (height) => {
  console.log("=> Updating validators");
  const validatorsBinary = await getValidatorsFromNode(connection);
  const validators = []
  for (const validatorBinary of validatorsBinary) {
    const validator = await getValidator(query, connection, validatorBinary);
    //const validatorData = JSON.parse(serialize(validator));
    validators.push(validator);
  }
  await withLogErrorToDB(() => sequelize.transaction(async dbTransaction => {
    for (const validatorData of validators) {
      await Validator.create(validatorData, { transaction: dbTransaction });
    }
  }), {
    update: 'validators',
    height
  })
});

events.on("createProposal", async (txData, height) => {
  console.log("=> Creating proposal", txData);
  await withLogErrorToDB(() => Proposal.create(txData), {
    create: 'proposal',
    height
  })
  // const latestProposal = await Proposal.findOne({ order: [["id", "DESC"]] });
  /*
    const { q } = getUndexerRPCUrl(NODE_LOWEST_BLOCK_HEIGHT+1)
    const proposalChain = await q.query_proposal(BigInt(txData.proposalId));
    await Proposal.create(proposalChain);
    */
});

events.on("updateProposal", async (proposalId, height) => {
  console.log("=> Updating proposal");
  const proposal = await q.query_proposal(BigInt(proposalId));
  await withLogErrorToDB(() => sequelize.transaction(async dbTransaction => {
    await Proposal.destroy({ where: { id: proposalId } }, { transaction: dbTransaction });
    await WASM_TO_CONTENT["tx_vote_proposal.wasm"].create(proposal, { transaction: dbTransaction });
  }), {
    update: 'proposal',
    height,
    proposalId,
  })
});
