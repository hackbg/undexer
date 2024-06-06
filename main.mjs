#!/usr/bin/env node
import { Console, bold, colors } from '@hackbg/logs'
import { fileURLToPath } from 'node:url'
import { resolve, dirname } from 'node:path'
import { readFileSync } from 'node:fs'
const packageJsonPath = resolve(dirname(fileURLToPath(import.meta.url)), 'package.json')
const { name, version } = JSON.parse(readFileSync(packageJsonPath))
console.log(`⏳ Starting ${bold(name)} ${version}...`)
import * as Dotenv from 'dotenv'
Dotenv.config()
const CLI = await import("./main.dist.js").catch(async e=>{
  console.debug('⏳ Compiling TypeScript...')
  await import("@ganesha/esbuild")
  const t0 = performance.now()
  const module = await import("./main.ts")
  console.debug('⌛ Compiled TypeScript in', ((performance.now() - t0)/1000).toFixed(3)+'s')
  return module
}).then(module=>module.default)
new CLI().run(process.argv.slice(2))
