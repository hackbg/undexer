#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import * as Namada from '@fadroma/namada'
await Namada.initDecoder(readFileSync('./node_modules/@fadroma/namada/pkg/fadroma_namada_bg.wasm'))
const connection = Namada.testnet({ url: 'https://namada-testnet-rpc.itrocket.net' })
console.log(await connection.getGovernanceParameters())
const proposals = await connection.getProposalCount()
console.log('Proposals:', proposals)
let index = Number(proposals) - 1
do {
  console.log(`Fetching proposal ${index}`)
  const {proposal, votes, result} = await connection.getProposalInfo(index)
  console.log(`Proposal ${index}:`, proposal)
  console.log(`Votes on ${index}:`, votes)
  console.log(`Result of ${index}:`, result)
  index--
} while (index >= 0)
