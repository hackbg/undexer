#!/usr/bin/env -S npx tsx
import { describe, it } from "node:test";
import { readFile, readdir } from "fs/promises";
import Namada from "@fadroma/namada";

describe("block", async () => {

  const namada = await Namada.connect({
    decoder: await readFile(
      'node_modules/@fadroma/namada/pkg/fadroma_namada_bg.wasm'
    )
  });

  console.log(namada)

  it("should decode all blocks", async () => {
    const blocks = await readdir("tests/seed/data/block");
    await Promise.all(blocks.map(async height=>{
      console.log('Decoding', height)
      const [block, result] = await Promise.all([
        readFile(`tests/seed/data/block/${height}`, 'utf8'),
        readFile(`tests/seed/data/block_response/${height}`, 'utf8'),
      ]);
      const decodedResult = namada.decode.block(block, result);
    }))
  });

});
