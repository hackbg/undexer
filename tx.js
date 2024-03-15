#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs'
import * as Namada from '@fadroma/namada'
await Namada.initDecoder(readFileSync('./node_modules/@fadroma/namada/pkg/fadroma_namada_bg.wasm'))
const connection = Namada.testnet({ url: 'https://namada-testnet-rpc.itrocket.net' })
let latest  = await connection.height
let current = 1
console.log({latest})
do {
  console.log('Indexing block:', current)
  const {txs, ...block} = await connection.getBlock(current)
  const blockPath = `data/block/${block.header.height}.${block.id}.json`
  //console.log('Block ID:',     block.id)
  //console.log('Block header:', block.header)
  //console.log('Block TXs:',    txs.length)
  console.log('Writing',       blockPath)
  writeFileSync(blockPath, JSON.stringify(block, (_, v) => typeof v === 'bigint' ? v.toString() : v))
  for (const tx of block.txsDecoded) {
    const txPath = `data/tx/${tx.dataHash}.json`
    console.log('Writing',     txPath)
    writeFileSync(txPath, JSON.stringify(tx, (_, v) => typeof v === 'bigint' ? v.toString() : v))
  }
  console.log('Latest block:', latest)
  latest = await connection.height
  current++
} while (current < latest)
