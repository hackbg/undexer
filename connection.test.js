#!/usr/bin/env -S node --import=@ganesha/esbuild

import * as assert from 'node:assert'
import getRPC from './connection.js'
import {
  POST_UNDEXER_RPC_URL,
  PRE_UNDEXER_RPC_URL,
  NODE_LOWEST_BLOCK_HEIGHT,
} from "./constants.js";

assert.throws(
  ()=>getRPC(0)
)

assert.equal(
  getRPC(1).conn.url,
  POST_UNDEXER_RPC_URL
)

assert.equal(
  getRPC(100).conn.url,
  POST_UNDEXER_RPC_URL
)

assert.equal(
  getRPC(NODE_LOWEST_BLOCK_HEIGHT).conn.url,
  PRE_UNDEXER_RPC_URL
)

assert.equal(
  getRPC(NODE_LOWEST_BLOCK_HEIGHT + 100).conn.url,
  PRE_UNDEXER_RPC_URL
)
