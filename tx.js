#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import * as Namada from '@fadroma/namada'
await Namada.initDecoder(readFileSync('./node_modules/@fadroma/namada/pkg/fadroma_namada_bg.wasm'))
const connection = Namada.testnet({ url: 'https://namada-testnet-rpc.itrocket.net' })
let latest = await connection.height
let current = 1
do {
  const blockPath = `data/block/${current}.json`
  if (!existsSync(blockPath)) {
    console.log('\nIndexing block:', current, 'of', latest, `(${((current/latest)*100).toFixed(3)}%)`)
    const {txs, ...block} = await connection.getBlock(current)
    //console.log('Block ID:',     block.id)
    //console.log('Block header:', block.header)
    //console.log('Block TXs:',    txs.length)
    await Promise.all(block.txsDecoded.map(tx=>{
      const txPath = `data/tx/${tx.dataHash}.json`
      console.log('Writing',     txPath)
      return writeFile(txPath, JSON.stringify(tx, (_, v) => typeof v === 'bigint' ? v.toString() : v))
    }))
    console.log('Writing',       blockPath)
    await writeFile(blockPath, JSON.stringify(block, (_, v) => typeof v === 'bigint' ? v.toString() : v))
  }
  current++
  if (current === latest) {
    console.log('Latest block:', latest)
    latest = await connection.height
  }
} while (current < latest)
