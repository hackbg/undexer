#!/usr/bin/env -S node --import=@ganesha/esbuild

import { Events, BlockQueue, ProposalQueue } from './events.js'

const events = new Events()

await events.poll()
