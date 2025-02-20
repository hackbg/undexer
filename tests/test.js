#!/usr/bin/env -S node --import @ganesha/esbuild
await Promise.all([
  import('./testApiDb.js'),
  import('./testApiRpc.js'),
  import('./testIndexing.js'),
]).catch(e=>{
  console.error('Tests failed.')
  process.exit(1)
}).then(()=>{
  console.error('Tests passed.')
  process.exit(0)
})
