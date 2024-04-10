import * as Namada from '@fadroma/namada';
import getRPC from './connection.js';
import Block from './models/Block.js';
import Transaction from './models/Transaction.js';

const console = new Namada.Core.Console('Block');

const fetchText = (url) => {
  console.log(`Fetching ${url}`);
  return fetch(url).then((response) => response.text());
};

export default async function indexBlock(height, events) {
  const t0 = performance.now();

  // Get connection correspondinf to block height
  const { connection, query } = getRPC(height);

  // Fetch block data
  console.debug('Fetching block', height);
  const [block, blockResponse, blockResultsResponse] = await Promise.all([
    connection.getBlock(height),
    fetchText(`${connection.url}/block?height=${height}`),
    fetchText(`${connection.url}/block_results?height=${height}`),
  ]);

  // Decode block data
  console.debug('Decoding block', height);
  const { id, txs } = connection.decode.block(
    blockResponse,
    blockResultsResponse,
  );

  // Write block and all transactions to database.
  console.debug('Storing block', height, block.id);

  // TODO: Wrap this big promise in a PostgreSQL transaction
  //       so that block/transactions/sections/contents are either
  //       saved fully, or not at all!

  // Block
  await Block.create({
    height,
    ...block,
  }),
    // Each transaction in the block:
    [...txs].map(
      async (tx) =>
        await // The transaction
        Transaction.create({
          ...tx,
          txId: tx.id,
          blockId: block.id,
          blockHeight: height,
          sections: JSON.parse(
            JSON.stringify(
              tx.sections,
              (key, value) =>
                typeof value === 'bigint' ? value.toString() : value, // return everything else unchanged
            ),
          ),
          content: JSON.parse(
            JSON.stringify(
              tx.content,
              (key, value) =>
                typeof value === 'bigint' ? value.toString() : value, // return everything else unchanged
            ),
          ),
        }),
    ),
    // Write block and all transactions to database.
    console.debug('Indexed in', performance.now() - t0, 'msec');

  // If the event emitter has been passed in,
  // emit events for transactions of interest
  if (events) {
    for (const tx of txs) {
      if (tx.content.type === 'tx_init_proposal.wasm') {
        events.emit('proposal', { height });
      }
      if (tx.content.type === 'tx_vote_proposal.wasm') {
        events.emit('vote', { height, proposal: tx.content.data.proposalId });
      }
    }
  }
}
