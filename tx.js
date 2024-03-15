#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import * as Namada from '@fadroma/namada'
await Namada.initDecoder(readFileSync('./node_modules/@fadroma/namada/pkg/fadroma_namada_bg.wasm'))
const connection = Namada.testnet({ url: 'https://namada-testnet-rpc.itrocket.net' })
if (process.env.UNDEXER_DATA_DIR) {
  process.chdir(process.env.UNDEXER_DATA_DIR)
} else {
  throw new Error('set UNDEXER_DATA_DIR')
}
let latest = await connection.height
let current = 1
let average = 0
do {
  const blockPath = `data/block/${current}.json`
  if (!existsSync(blockPath)) {
    const t0 = performance.now()
    console.log('\nIndexing block:', current, 'of', latest, `(${((current/latest)*100).toFixed(3)}%)`)
    const {txs, ...block} = await connection.getBlock(current)
    await Promise.all(block.txsDecoded.map(tx=>{
      const txPath = `data/tx/${tx.dataHash}.json`
      console.log('Writing',     txPath)
      return writeFile(txPath, JSON.stringify({
        block: current,
        tx
      }, (_, v) => typeof v === 'bigint' ? v.toString() : v))
    }))
    console.log('Writing',       blockPath)
    await writeFile(blockPath, JSON.stringify(block, (_, v) => typeof v === 'bigint' ? v.toString() : v))
    const t = performance.now() - t0
    average = (average + t) / 2
    console.log('\nAverage:', average.toFixed(0), 'msec')
    console.log('ETA: in', ((latest - current) * average / 1000).toFixed(0), 'sec')
  }
  current++
  if (current === latest) {
    console.log('Latest block:', latest)
    latest = await connection.height
  }
} while (current < latest)
