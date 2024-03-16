#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import * as Namada from '@fadroma/namada'
import { Core } from '@fadroma/agent'
import { mkdirp, mkdirpSync } from 'mkdirp'

await Namada.initDecoder(readFileSync('./node_modules/@fadroma/namada/pkg/fadroma_namada_bg.wasm'))

const connection = Namada.testnet({
  url: process.env.UNDEXER_RPC_URL || 'https://namada-testnet-rpc.itrocket.net'
})

if (process.env.UNDEXER_DATA_DIR) {
  process.chdir(process.env.UNDEXER_DATA_DIR)
} else {
  throw new Error('set UNDEXER_DATA_DIR')
}

let averageTime = 0

main()

async function main () {
  let latest = await connection.height
  let current = 1
  mkdirpSync('block')
  mkdirpSync('tx')
  while (true) {
    await ingestBlock(current, latest)
    current++
    if (current === latest) {
      console.log('Reached latest block', current)
      let newLatest = await connection.height
      while (newLatest === latest) {
        console.log('Waiting for new block', current)
        await new Promise(resolve=>setTimeout(resolve, 2000))
        newLatest = await connection.height
      }
      latest = newLatest
    }
  }
}

export async function ingestBlock (current, latest) {

  const blockDir  = `block/${paginated(current)}/${current}`
  const blockPath = `${blockDir}/block.json`
  const txsPath   = `${blockDir}/txs.json`
  const txsDir    = `${blockDir}/txs`

  if (!existsSync(blockPath)) {

    const t0 = performance.now()

    console.log(
      '\nIndexing block:', current,
      'of', latest,
      `(${((current/latest)*100).toFixed(3)}%)`
    )

    const {
      txs,
      txsDecoded,
      ...block
    } = await connection.getBlock(current)

    await mkdirp(blockDir)

    const txids = txsDecoded.map(tx=>{
      if (tx.dataHash) {
        return tx.dataHash
      } else {
        console.warn('Failed to decode TX')
        return false
      }
    }).filter(Boolean)

    if (txids.length > 0) {
      await mkdirp(txsDir)
    }

    await Promise.all([
      save(txsPath, { block: current, txs }),
      ...txsDecoded.map(tx=>{
        if (tx.dataHash) {
          const txPath = `${txsDir}/${tx.dataHash}.json`
          return save(txPath, { block: current, tx })
        }
      })
    ])

    await save(blockPath, {...block, txids})

    const t = performance.now() - t0
    averageTime = (averageTime + t) / 2

    console.log(
      '\nAverage:', 
      averageTime.toFixed(0),
      'msec'
    )

    console.log(
      'ETA: in',
      ((latest - current) * averageTime / 1000).toFixed(0),
      'sec'
    )
  }

}

function save (path, data) {
  console.log('Writing', path)
  return writeFile(path, serialize(data))
}

function paginated (x, perPage = 1000) {
  return String(Math.floor(x/1000)*1000) + '-' + String((Math.floor(x/1000)+1)*1000-1)
}

function serialize (data) {
  return JSON.stringify(data, stringifier)
}

function stringifier (key, value) {
  if (typeof value === 'bigint') {
    return value.toString()
  }
  if (value instanceof Uint8Array) {
    return Core.base64.encode(value)
  }
  return value
}
