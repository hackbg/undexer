import Namada from "@fadroma/namada";
import { readFile } from "fs/promises";
import { Query } from "../rust/pkg/shared.js";

export const PRE_UNDEXER_RPC_URL =
  process.env.PRE_UNDEXER_RPC_URL || "https://rpc.luminara.icu" || "http://51.159.167.32:26657/";
  //process.env.PRE_UNDEXER_RPC_URL || "http://51.159.167.32:26657/";

export const POST_UNDEXER_RPC_URL =
  process.env.POST_UNDEXER_RPC_URL || "https://rpc.luminara.icu";

export const DATABASE_URL =
  process.env.DATABASE_URL || 'postgres://postgres:insecure@localhost:5432'

export const NODE_LOWEST_BLOCK_HEIGHT =
  process.env.NODE_LOWEST_BLOCK_HEIGHT ?? 0; //237907;

export const START_FROM_SCRATCH =
  process.env.START_FROM_SCRATCH || false;

export const UNDEXER_API_URL = 
  process.env.UNDEXER_API_URL || "http://v2.namada.undexer.demo.hack.bg";

export const VALIDATOR_UPDATE_INTERVAL =
  Number(process.env.VALIDATOR_UPDATE_INTERVAL) || 30000

export const VALIDATOR_FETCH_PARALLEL =
  Boolean(process.env.VALIDATOR_FETCH_PARALLEL) || false

export const VALIDATOR_FETCH_DETAILS_PARALLEL =
  Boolean(process.env.VALIDATOR_FETCH_DETAILS_PARALLEL) || false

export const BLOCK_UPDATE_INTERVAL =
  Number(process.env.BLOCK_UPDATE_INTERVAL) || 5000

export const VALIDATOR_TRANSACTIONS = [
  "tx_become_validator.wasm",
  "tx_change_validator_commission.wasm",
  "tx_change_validator_metadata.wasm",
  "tx_deactivate_validator.wasm",
  "tx_activate_validator.wasm",
  "tx_remove_validator.wasm",
  "tx_add_validator.wasm",
  "tx_change_validator_power.wasm",
  "tx_change_validator_commission.wasm",
  "tx_deactivate_validator.wasm",
  "tx_reactivate_validator.wasm",
  "tx_unjail_validator.wasm",
  "tx_bond.wasm",
]

export const GOVERNANCE_TRANSACTIONS = [
  "tx_vote_proposal.wasm",
  "tx_init_proposal.wasm"
]

const rpcVariant = async (url) => ({
  chain: await Namada.connect({
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
  [NODE_LOWEST_BLOCK_HEIGHT]: rpcVariant(POST_UNDEXER_RPC_URL),
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
export function getRPC (height = Infinity) {
  for (const [limit, variant] of rpcs) {
    if (height >= limit) {
      return variant
    }
  }
  throw new Error(`Could not find suitable RPC for height ${height}`)
}
