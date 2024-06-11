#!/usr/bin/env -S node --import=@ganesha/esbuild

import "dotenv/config"

import { Console } from '@hackbg/fadroma'
const console = new Console('Undexer')
console.log('⏳ Starting at', new Date())

console.log('⏳ Patching globalThis.fetch...')
import '../src/fetch.js'

console.log('⏳ Initializing...')
import { initialize } from '../src/utils.js'
await initialize()

console.log('⏳ Syncing DB schema...')
import db from '../src/db.js'
import { START_FROM_SCRATCH } from '../src/config.js'
await db.sync({ force: Boolean(START_FROM_SCRATCH) })

console.log('⏳ Connecting...')
import { getRPC } from "../src/rpc.js"
const { chain, query } = await getRPC()

import EventEmitter from "node:events"
const events = new EventEmitter()

import { updateValidators } from '../src/validator.js'
events.on("updateValidators",
  height => updateValidators(chain, query, height))

import { createProposal, updateProposal } from '../src/proposal.js'
events.on("createProposal", createProposal)
events.on("updateProposal", updateProposal)

console.log('🚀 Begin indexing!')

import { runForever } from '../src/utils.js'
import { BLOCK_UPDATE_INTERVAL, VALIDATOR_UPDATE_INTERVAL } from "../src/config.js"
import { checkForNewBlock } from '../src/block.js'
import { checkValidators } from '../src/validator.js'
await Promise.all([
  runForever(BLOCK_UPDATE_INTERVAL, checkForNewBlock, chain, events),
  runForever(VALIDATOR_UPDATE_INTERVAL, checkValidators, chain),
])
