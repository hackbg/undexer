import { readFile } from "node:fs/promises";
import initShared from "./shared/pkg/shared.js";
import { Core, initDecoder } from "@fadroma/namada";

export function serialize(data) {
    return JSON.stringify(data, stringifier);
}

export function stringifier(key, value) {
    if (typeof value === "bigint") {
        return value.toString();
    }
    if (value instanceof Uint8Array) {
        return Core.base64.encode(value);
    }
    return value;
}

export function waitFor (msec) {
    return new Promise(resolve=>setTimeout(resolve, msec))
}

export async function retryForever (operation, interval, callback, ...args) {
  while (true) {
    try {
      return await callback(...args)
    } catch (e) {
      console.error(`Failed to ${operation}, waiting ${interval}ms and retrying`)
      await waitFor(interval)
    }
  }
}

export async function getBlockHeight () {
  return retryForever(
    'get block height', 5000, async () => {
      const height = Number(await connection.height)
      if (isNaN(height)) {
        throw new Error(`returned height ${height}`)
      }
      return height
    }
  )
}

export async function initialize() {
  await Promise.all([
    readFile("shared/pkg/shared_bg.wasm")
      .then(wasm=>initShared(wasm)),
    readFile("./node_modules/@fadroma/namada/pkg/fadroma_namada_bg.wasm")
      .then(wasm=>initShared(wasm)),
  ])
}

export function format(txContent){
  const result = Object.assign(txContent);

  if(result.type==="tx_vote_proposal.wasm" || result.type==="tx_init_proposal.wasm"){
    result.data.proposalId = result.data.id;
    delete result.data.id;
  }

  return result;
}
