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