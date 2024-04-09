#!/usr/bin/env -S node --import=@ganesha/esbuild

import { Events, BlockQueue, ProposalQueue } from './events.js'

const events = await new Events()
  .on('block', onBlock)
  .poll()

async function onBlock () {
  console.log({onBlock: arguments})
}
