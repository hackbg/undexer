#!/usr/bin/env -S node --import @ganesha/esbuild
import './testDb.js'
import { Console } from "@hackbg/logs"
import { Indexer } from '../src/index.js'
import getRPC from '../src/rpc.js'
const console = new Console("Test: Indexing")
const indexer = new Indexer({
  log: console,
  chain: await getRPC('https://rpc.namada.tududes.com/'),
    //log: console,
    //connections: [ { log: console } ]
  //}
})
await indexer.update()
