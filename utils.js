import { Core } from "@fadroma/agent";
import { writeFile } from "node:fs/promises";

export async function serialize(data) {
    return JSON.stringify(data, stringifier);
}

export async function stringifier(key, value) {
    if (typeof value === "bigint") {
        return value.toString();
    }
    if (value instanceof Uint8Array) {
        return Core.base64.encode(value);
    }
    return value;
}

export function save(path, data) {
    console.log("Writing", path);
    return writeFile(path, serialize(data));
}