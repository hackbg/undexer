import * as Namada from '@fadroma/namada'
import getRPC from './connection.js'

const console = new Namada.Core.Console('Proposal')

export default async function indexProposal (id) {
  console.debug('Indexing proposal', height)
  const { connection, query } = getRPC()
}
