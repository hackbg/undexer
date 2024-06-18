#!/usr/bin/env -S node --import=@ganesha/esbuild

import "dotenv/config"

import { Console } from '@hackbg/fadroma'
const console = new Console('Undexer')
console.log('⏳ Starting at', new Date())

console.log('⏳ Patching globalThis.fetch...')
import '../src/fetch.js'

console.log('⏳ Syncing DB schema...')
import db from '../src/db.js'
import { START_FROM_SCRATCH } from '../src/config.js'
await db.sync({ force: Boolean(START_FROM_SCRATCH) })

console.log('⏳ Connecting...')
import { getRPC } from "../src/rpc.js"
const { chain } = await getRPC()

import EventEmitter from "node:events"
const events = new EventEmitter()

import { tryUpdateValidators } from '../src/validator.js'
events.on("updateValidators", height => tryUpdateValidators(chain, height))

import { tryUpdateProposals, updateProposal } from '../src/proposal.js'
events.on("createProposal", updateProposal)
events.on("updateProposal", updateProposal)

console.log('🚀 Begin indexing!')
import {
  BLOCK_UPDATE_INTERVAL,
  VALIDATOR_UPDATE_INTERVAL,
  PROPOSAL_UPDATE_INTERVAL
} from "../src/config.js"
import { runForever } from '../src/utils.js'
import { checkForNewBlock } from '../src/block.js'
await Promise.all([
  runForever(BLOCK_UPDATE_INTERVAL,     checkForNewBlock, chain, events),
  runForever(VALIDATOR_UPDATE_INTERVAL, tryUpdateValidators, chain),
  runForever(PROPOSAL_UPDATE_INTERVAL,  tryUpdateProposals, chain),
])
