import * as Namada from "@fadroma/namada";
import * as DB from './db.js';
import { base16 } from '@hackbg/fadroma';
const console = new Namada.Console(`Governance`)

export async function tryUpdateProposals (chain, height) {
  try {
    await updateProposals(chain, height)
  } catch (e) {
    console.error('Failed to update proposals.')
    console.error(e)
  }
}

export async function updateProposals (chain, height) {
  const proposals = await chain.fetchProposalCount()
  console.log('Fetching', proposals, 'proposals, starting from latest')
  for (let id = proposals - 1n; id >= 0n; id--) {
    await updateProposal(chain, id, height)
  }
}

export async function updateProposal (chain, id, height) {
  console.log('Fetching proposal', id)
  const {
    proposal: { id: _, content, ...metadata },
    votes,
    result,
  } = await chain.fetchProposalInfo(id)
  await DB.withErrorLog(() => DB.default.transaction(async dbTransaction => {
    await DB.Proposal.destroy({ where: { id } }, { transaction: dbTransaction })
    await DB.Proposal.create({ id, content, metadata, result }, { transaction: dbTransaction })
    console.log('++ Adding proposal', id, 'with', votes.length, 'votes')
    await DB.Vote.destroy({ where: { proposal: id } }, { transaction: dbTransaction })
    for (const vote of votes) {
      console.log('++ Adding vote for', id)
      await DB.Vote.create({ proposal: id, data: vote }, { transaction: dbTransaction })
    }
  }), {
    update: 'proposal',
    height,
    id,
  })
  console.log('++ Added proposal', id, 'with', votes.length, 'votes')
}
