import { Core } from "@fadroma/agent";
import { writeFile } from "node:fs/promises";

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

export async function save(path, data) {
    console.log("Writing", path);
    return await writeFile(path, serialize(data));
}

export function makeDirIfItDoesntExist(path) {
    try {
        mkdirSync(path);
    }
    catch (ex) {
        console.log("Directory already exists");
    }
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
