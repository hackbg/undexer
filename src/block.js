import { Console } from '@fadroma/namada'
import db, { Block, withLogErrorToDB } from './db/index.js'

export async function checkForNewBlock (connection) {
  // should use newer node for the blockchain height
  const currentBlockOnChain = await connection.height;
  const latestBlockInDb     = await Block.max('height') || Number(NODE_LOWEST_BLOCK_HEIGHT);
  console.log("=> Current block on chain:", currentBlockOnChain);
  console.log("=> Latest block in DB:", latestBlockInDb);
  if (currentBlockOnChain > latestBlockInDb) {
    await updateBlocks(connection, latestBlockInDb + 1, currentBlockOnChain);
  } else {
    console.info("=> No new blocks");
  }
  setTimeout(checkForNewBlock, BLOCK_UPDATE_INTERVAL);
}

export async function updateBlocks (connection, startHeight, endHeight) {
  console.log("=> Processing blocks from", startHeight, "to", endHeight);
  for (let height = startHeight; height <= endHeight; height++) {
    await updateBlock(connection, height)
  }
}

export async function updateBlock (connection, height) {
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
  await withLogErrorToDB(() => db.transaction(async dbTransaction => {
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
