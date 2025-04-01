#!/usr/bin/env node
import "dotenv/config"
import process from "node:process"
export const DEFAULT_PAGE_SIZE  = process.env.DEFAULT_PAGE_SIZE || 25
export const CHAIN_ID           = process.env.CHAIN_ID          || 'namada.5f5de2dd1b88cba30586420'
export const DATABASE_USER      = process.env.DATABASE_USER     || 'postgres'
export const DATABASE_PASS      = process.env.DATABASE_PASS     || 'insecure'
export const DATABASE_HOST      = process.env.DATABASE_HOST     || 'localhost'
export const DATABASE_PORT      = process.env.DATABASE_PORT     || '5432'
export const DATABASE_NAME      = process.env.DATABASE_NAME     || CHAIN_ID
export const DATABASE_URL       = process.env.DATABASE_URL      || `postgres://${DATABASE_USER}:${DATABASE_PASS}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}`
export const NODE_CONTROL_URL   = process.env.NODE_CONTROL_URL  || 'http://node:25551'
export const PROXY_CONTROL_URL  = process.env.PROXY_CONTROL_URL || 'http://sync-proxy:25552'
export const RPC_URL            = process.env.RPC_URL           || 'http://rpc-proxy:26657'
/** Don't reset the indexing node from scratch if more than 2 epochs out of sync */
export const ALLOW_INCOMPLETE   = Boolean(process.env.ALLOW_INCOMPLETE) || false
/** Force truncate the database on start (`db.sync({ force: true })`) */
export const START_FROM_SCRATCH = process.env.START_FROM_SCRATCH || false
/** Interval per which the indexer checks for new block and epoch. */
export const TICK = Number(process.env.TICK) || 1000

export const LOG_CONFIG = {
  color: false,
  json:  true,
  jsonLevelField: 'level',
  jsonMetaField:  'meta',
  jsonDataField:  'data'
}

export const GOVERNANCE_TRANSACTIONS = [
  "tx_vote_proposal.wasm",
  "tx_init_proposal.wasm"
]

const token = (address, symbol, coin) => ({address, symbol, coin})
export const TOKENS = [
  token("tnam1q9gr66cvu4hrzm0sd5kmlnjje82gs3xlfg3v6nu7", "NAM", "Namada"),
  //token("tnam1qyfl072lhaazfj05m7ydz8cr57zdygk375jxjfwx", "DOT", "Polkadot"),
  //token("tnam1qxvnvm2t9xpceu8rup0n6espxyj2ke36yv4dw6q5", "ETH", "Ethereum"),
  //token("tnam1qy8qgxlcteehlk70sn8wx2pdlavtayp38vvrnkhq", "BTC", "Bitcoin"),
  //token("tnam1q9f5yynt5qfxe28ae78xxp7wcgj50fn4syetyrj6", "SCH", "Schnitzel"),
  //token("tnam1qyvfwdkz8zgs9n3qn9xhp8scyf8crrxwuq26r6gy", "APF", "Apfel"),
  //token("tnam1qyx93z5ma43jjmvl0xhwz4rzn05t697f3vfv8yuj", "KAR", "Kartoffel")
]

import { fileURLToPath } from 'node:url'
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dbPass = DATABASE_PASS.replace(/./g, '*')
  console.log('Current configuration:', {
    DEFAULT_PAGE_SIZE,
    CHAIN_ID,
    DATABASE_USER,
    DATABASE_PASS: dbPass,
    DATABASE_HOST,
    DATABASE_PORT,
    DATABASE_NAME,
    DATABASE_URL: DATABASE_URL.replaceAll(DATABASE_PASS, dbPass),
    NODE_CONTROL_URL,
    PROXY_CONTROL_URL,
    RPC_URL,
    ALLOW_INCOMPLETE,
    START_FROM_SCRATCH,
  })
}
