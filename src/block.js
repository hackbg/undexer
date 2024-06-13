import { Console } from '@fadroma/namada'
import * as DB from './db.js';
import {
  GOVERNANCE_TRANSACTIONS,
  VALIDATOR_TRANSACTIONS,
  NODE_LOWEST_BLOCK_HEIGHT
} from './config.js'
import { cleanup } from './utils.js'

const console = new Console('Block')

export async function checkForNewBlock (
  chain,
  events
) {
  // should use newer node for the blockchain height
  const currentBlockOnChain = await chain.fetchHeight();
  const latestBlockInDb     = await DB.latestBlock() || Number(NODE_LOWEST_BLOCK_HEIGHT);
  console.log("=> Current block on chain:", currentBlockOnChain);
  console.log("=> Latest block in DB:", latestBlockInDb);
  if (currentBlockOnChain > latestBlockInDb) {
    await updateBlocks(
      chain, events, latestBlockInDb + 1, currentBlockOnChain
    );
  } else {
    console.info("=> No new blocks");
  }
}

export async function updateBlocks (
  chain,
  events,
  startHeight,
  endHeight
) {
  console.log("=> Processing blocks from", startHeight, "to", endHeight);
  for (let height = startHeight; height <= endHeight; height++) {
    await updateBlock({ chain, events, height })
  }
}

export async function updateBlock ({
  chain,
  events,
  height,
  block = chain.fetchBlock({ height, raw: true })
}) {
  const t0 = performance.now()
  block = await Promise.resolve(block)
  await DB.withErrorLog(() => DB.default.transaction(async dbTransaction => {
    const data = {
      chainId:      block.header.chainId,
      blockTime:    block.time,
      blockHeight:  block.height,
      blockHash:    block.hash,
      blockHeader:  block.header,
      rpcResponses: block.responses,
    }
    await DB.Block.create(data, { transaction: dbTransaction });
    for (const transaction of block.transactions) {
      await updateTransaction({
        block,
        events,
        height,
        transaction,
        dbTransaction,
      })
    }
  }), { update: 'block', height })
  const t = performance.now() - t0
  const console = new Console(`Block ${height}`)
  for (const transaction of block.transactions) {
    console.log("++ Added transaction", transaction.id);
  }
  console.log("++ Added block", height, 'in', t.toFixed(0), 'msec');
  console.br()
}

export async function updateTransaction ({
  block,
  events,
  height,
  transaction,
  dbTransaction,
}) {
  const console = new Console(
    `Block ${height}, TX ${transaction.id.slice(0, 8)}`
  )
  if (transaction.content) {
    console.log("=> Add content", transaction.content.type);
    const uploadData = { ...transaction.content }
    if (GOVERNANCE_TRANSACTIONS.includes(uploadData.type)) {
      uploadData.data.proposalId = Number(uploadData.data.id);
      delete uploadData.data.id;
    }
    if (VALIDATOR_TRANSACTIONS.includes(transaction.content.type)) {
      events?.emit("updateValidators", height);
    }
    if (transaction.content.type === "transaction_vote_proposal.wasm") {
      events?.emit("updateProposal", transaction.content.data.proposalId, height);
    }
    if (transaction.content.type === "transaction_init_proposal.wasm") {
      events?.emit("createProposal", transaction.content.data, height);
    }
  } else {
    console.warn(`Unsupported content ${transaction.content.type}`)
  }
  for (let section of transaction.sections) {
    console.log("=> Add section", section.type);
  }
  console.log("=> Adding transaction");
  await DB.Transaction.create({
    chainId:     transaction.block.chain.id,
    blockHash:   transaction.block.hash,
    blockTime:   transaction.block.time,
    blockHeight: transaction.block.height,
    txHash:      transaction.hash,
    txHeader:    transaction.header,
    txTime:      transaction.time,
    data:        transaction
  }, {
    transaction: dbTransaction
  });
}
