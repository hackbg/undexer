import { readFile, writeFile } from "node:fs/promises";
//import initShared from "@namada/shared";
import { initDecoder } from "@fadroma/namada";
import { base64 } from "@hackbg/fadroma";
import { GOVERNANCE_TRANSACTIONS } from "./config/constants.js";

export function cleanup (data) {
  return JSON.parse(serialize(data))
}

export function serialize (data) {
  return JSON.stringify(data, stringifier);
}

export function stringifier (key, value) {
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (value instanceof Uint8Array) {
    return base64.encode(value);
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
      console.error(`Failed to ${operation}, waiting ${interval}ms and retrying:`, e)
      await waitFor(interval)
    }
  }
}

export async function initialize () {
  await Promise.all([
    // this should also not be required when calling Namada.testnet()
    readFile("./node_modules/@fadroma/namada/pkg/fadroma_namada_bg.wasm")
      .then(wasm=>initDecoder(wasm)),

    // not required when wasm-pack is run with `--target nodejs`:
    // it does its own `readFileSync(resolve(__dirname, '...wasm'))`.
    //readFile("rust/pkg/shared_bg.wasm")
      //.then(wasm=>initShared(wasm)),
  ])
}

export function format (txContent) {
  const result = { ...txContent }
  if (GOVERNANCE_TRANSACTIONS.includes(result.type)) {
    result.data.proposalId = Number(result.data.id);
    delete result.data.id;
  }
  return result;
}

export async function save (path, data) {
  console.log("Writing", path);
  return await writeFile(path, serialize(data));
}
