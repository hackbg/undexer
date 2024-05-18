import { Console } from '@hackbg/fadroma';
import getRPC from './connection.js';
// import Proposal from './models/Proposal.js';
// import { deserialize } from 'borsh';

export const ProposalSchema = {
  struct: {
    id: 'string',
    proposalType: 'string',
    author: 'string',
    startEpoch: 'u64',
    endEpoch: 'u64',
    graceEpoch: 'u64',
    content: 'string',
    status: 'string',
    result: 'string',
    totalVotingPower: 'string',
    totalYayPower: 'string',
    totalNayPower: 'string',
    totalAbstainPower: 'string',
    tallyType: 'string',
  },
};

const console = new Console('Proposal');

export default async function indexProposal(id) {
  console.debug('Indexing proposal', id);
  // const { connection, query } = getRPC();

  const t0 = performance.now();

  // Fetch proposal data
  console.debug('Fetching proposal', id);

  // const proposal = await query.query_proposal(BigInt(id));

  console.debug('Deserialize proposal', id);
  // const deserializedProposal = deserialize(ProposalSchema, proposal);

  // console.log(deserializedProposal);

  // Write block and all transactions to database.
  console.debug('Storing proposal', id);

  // TODO: Wrap this big promise in a PostgreSQL transaction
  //       so that block/transactions/sectionds/contents are either
  //       saved fully, or not at all!
  // await Promise.all([
  //   // Block
  //   Proposal.create({
  //     ...proposal,
  //   }),
  // ]);

  // Write block and all transactions to database.
  console.debug('Indexed in', performance.now() - t0, 'msec');
}
