import "dotenv/config"

export const PRE_UNDEXER_RPC_URL =
  process.env.PRE_UNDEXER_RPC_URL || "http://51.159.167.32:26657/";

export const POST_UNDEXER_RPC_URL =
  process.env.POST_UNDEXER_RPC_URL || "https://rpc.luminara.icu";

export const DATABASE_URL =
  process.env.DATABASE_URL || 'postgres://postgres:insecure@postgres:5432'

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
