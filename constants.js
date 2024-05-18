import "dotenv/config"

export const PRE_UNDEXER_RPC_URL =
  process.env.PRE_UNDEXER_RPC_URL || "http://51.159.167.32:26657/";
export const POST_UNDEXER_RPC_URL =
  process.env.POST_UNDEXER_RPC_URL || "https://namada-rpc.stake-machine.com"; //"https://rpc.namada.info/";
export const DATABASE_URL =
  process.env.DATABASE_URL || 'postgres://postgres:insecure@postgres:5432'
export const NODE_LOWEST_BLOCK_HEIGHT =
  process.env.NODE_LOWEST_BLOCK_HEIGHT || 237907;
export const START_FROM_SCRATCH =
  process.env.START_FROM_SCRATCH ||  false;
export const UNDEXER_API_URL = 
  process.env.UNDEXER_API_URL || "http://v2.namada.undexer.demo.hack.bg";
