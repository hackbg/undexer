#!/usr/bin/env -S node --import=@ganesha/esbuild

import "dotenv/config"

import { Console } from '@hackbg/fadroma'
const console = new Console('Undexer')
console.log('⏳ Starting at', new Date())

console.log('⏳ Patching globalThis.fetch...')
import './fetch.js'

console.log('⏳ Initializing...')
import { initialize } from './utils.js'
await initialize()

console.log('⏳ Syncing DB schema...')
import db from './db/index.js'
import { START_FROM_SCRATCH } from './config.js'
await db.sync({ force: Boolean(START_FROM_SCRATCH) })

console.log('⏳ Connecting...')
import { getRPC } from "./config.js"
const { connection, query } = await getRPC()

import EventEmitter from "node:events"
const events = new EventEmitter()

import { updateValidators } from './validator.js'
events.on("updateValidators", updateValidators)

import { createProposal, updateProposal } from './proposal.js'
events.on("createProposal", createProposal)
events.on("updateProposal", updateProposal)

console.log('🚀 Begin indexing!')

import { runForever } from './utils.js'
import { BLOCK_UPDATE_INTERVAL, VALIDATOR_UPDATE_INTERVAL } from "./config.js"
import { checkForNewBlock } from './block.js'
import { checkValidators } from './validator.js'
await Promise.all([
  runForever(BLOCK_UPDATE_INTERVAL, checkForNewBlock, connection, events),
  runForever(VALIDATOR_UPDATE_INTERVAL, checkValidators, connection),
])
