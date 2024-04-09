#!/usr/bin/env -S node --import=@ganesha/esbuild

import * as assert from 'node:assert'
import getRPCForHeight from './connection.js'
import {
  POST_UNDEXER_RPC_URL,
  PRE_UNDEXER_RPC_URL,
  NODE_LOWEST_BLOCK_HEIGHT,
} from "./constants.js";

assert.throws(
  ()=>getRPCForHeight(0)
)

assert.equal(
  getRPCForHeight(1).conn.url,
  POST_UNDEXER_RPC_URL
)

assert.equal(
  getRPCForHeight(100).conn.url,
  POST_UNDEXER_RPC_URL
)

assert.equal(
  getRPCForHeight(NODE_LOWEST_BLOCK_HEIGHT).conn.url,
  PRE_UNDEXER_RPC_URL
)

assert.equal(
  getRPCForHeight(NODE_LOWEST_BLOCK_HEIGHT + 100).conn.url,
  PRE_UNDEXER_RPC_URL
)
