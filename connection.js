import { Query } from "./shared/pkg/shared.js";
import { readFile } from "fs/promises";
import Namada from "@fadroma/namada";
import { initialize } from "./utils.js";
import { PRE_UNDEXER_RPC_URL, POST_UNDEXER_RPC_URL, START_BLOCK } from './constants.js';

await initialize();

const rpcVariant = async (url) => ({
  connection: await Namada.connect({
    url,
    decoder: await readFile(
      "node_modules/@fadroma/namada/pkg/fadroma_namada_bg.wasm"
    )
  }),
  query: new Query(url),
})

/** Map of first block number that uses a certain RPC URL
  * to a pair of { query, connection } objects that wrap the RPC. */
export const rpcs = toSortedRPCs({
  1: rpcVariant(PRE_UNDEXER_RPC_URL),
  [START_BLOCK]: rpcVariant(POST_UNDEXER_RPC_URL),
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
  for (const [limit, variant] of rpcs) {
    if (height >= limit) {
      return variant
    }
  }
  throw new Error(`Could not find suitable RPC for height ${height}`)
}
