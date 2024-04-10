import * as Namada from '@fadroma/namada';
import getRPC from './connection.js';
import Block from './models/Block.js';
import Proposal from './models/Proposal.js';

const console = new Namada.Core.Console('Proposal');

export default async function indexProposal(id) {
  console.debug('Indexing proposal', id);
  const { connection, query } = getRPC();

  const t0 = performance.now();

  // Fetch block data
  console.debug('Fetching proposal', id);
  const [proposal] = await Promise.all([connection.getProposal(id)]);

  // Decode block data
  console.debug('Decoding proposal', id);

  console.log(proposal)
  // const { id, txs } = connection.decode.proposal(
  //   blockResponse,
  //   blockResultsResponse,
  // );

  // Write block and all transactions to database.
  console.debug('Storing proposal', id);

  // TODO: Wrap this big promise in a PostgreSQL transaction
  //       so that block/transactions/sectionds/contents are either
  //       saved fully, or not at all!
  await Promise.all([
    // Block
    Proposal.create({
      ...proposal,
    }),
  ]);

  // Write block and all transactions to database.
  console.debug('Indexed in', performance.now() - t0, 'msec');
}
