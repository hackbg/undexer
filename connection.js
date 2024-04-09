import { Query } from "./shared/pkg/shared.js";
import * as Namada from "@fadroma/namada";
import {
  POST_UNDEXER_RPC_URL,
  PRE_UNDEXER_RPC_URL,
  NODE_LOWEST_BLOCK_HEIGHT,
} from "./constants.js";
import { initialize } from "./utils.js";

await initialize();

/** Map of first block number that uses a certain RPC URL
  * to a pair of { query, connection } objects that wrap the RPC. */
export const rpcs = toSortedRPCs({

  1: {
    q: new Query(POST_UNDEXER_RPC_URL),
    conn: Namada.testnet({
      url: POST_UNDEXER_RPC_URL
    })
  },

  [NODE_LOWEST_BLOCK_HEIGHT]: {
    q: new Query(PRE_UNDEXER_RPC_URL),
    conn: Namada.testnet({
      url: PRE_UNDEXER_RPC_URL
    })
  }

})

/** Validate record of (first block number -> RPC) and
  * convert to list (latest first). */
function toSortedRPCs (rpcs) {
  const sortedRPCs = []
  const limits = new Set()
  for (const limit of Object.keys(rpcs)) {
    if (isNaN(Number(limit))) {
      throw new Error(`Non-number block limit ${limit}`)
    }
  }
  for (const limit of Object.keys(rpcs).sort((a,b)=>b-a)) {
    if (limits.has(Number(limit))) {
      throw new Error(`Duplicate block limit ${limit}`)
    }
    limits.add(Number(limit))
    sortedRPCs.push([Number(limit), rpcs[limit]])
  }
  return sortedRPCs
}

/** Iterate over list of (first block number, RPC)
  * and return the RPC corresponding to a given height */
export default function getRPC (height = Infinity) {
  for (const [limit, connection] of rpcs) {
    if (height >= limit) {
      return connection
    }
  }
  throw new Error(`Could not find suitable RPC for height ${height}`)
}
