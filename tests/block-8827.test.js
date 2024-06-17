#!/usr/bin/env -S node --import=@ganesha/esbuild

import Namada from "@fadroma/namada";
import { readFile } from 'node:fs/promises';

import { initialize } from '../utils.js';

await initialize();

const connection = await Namada.connect({
  url: "https://rpc.luminara.icu",
  decoder: await readFile(
    "node_modules/@fadroma/namada/pkg/fadroma_namada_bg.wasm"
  )
})

const block = await connection.fetchBlock({ height: 8827, raw: true })

console.log(block)

