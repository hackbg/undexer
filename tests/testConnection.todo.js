#!/usr/bin/env -S node --import=@ganesha/esbuild

import * as assert from 'node:assert'
import getRPC from '../src/rpc.js'
import {
  POST_UNDEXER_RPC_URL,
  PRE_UNDEXER_RPC_URL,
  NODE_LOWEST_BLOCK_HEIGHT,
} from "../src/config.js";

assert.throws(
  ()=>getRPC(0)
)

assert.equal(
  getRPC(1).url,
  POST_UNDEXER_RPC_URL
)

assert.equal(
  getRPC(100).url,
  POST_UNDEXER_RPC_URL
)

assert.equal(
  getRPC(NODE_LOWEST_BLOCK_HEIGHT).url,
  PRE_UNDEXER_RPC_URL
)

assert.equal(
  getRPC(NODE_LOWEST_BLOCK_HEIGHT + 100).url,
  PRE_UNDEXER_RPC_URL
)
