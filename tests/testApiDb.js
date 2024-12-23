#!/usr/bin/env -S node --import @ganesha/esbuild
import process from 'node:process'
import { Console } from "@hackbg/logs"
import { hideProperties } from "@hackbg/hide"
const console = new Console("Test: API (DB routes)")

if (process.env.UNDEXER_TEST_WITH_REAL_DB) {
  console.info('Testing with real DB from environment')
} else {
  console.info('Testing with PGMock (setup may be slow)')
  await import('./testDb.js')
}

const { dbRoutes } = await import('../src/dbRoutes.js')

const testDbRoute = async (path, query) => {
  console.br().log('Testing', path, query||'')
  const { code, ...rest } = await testRoute(dbRoutes[path], query)
  console.log(code, rest)
}
const testRoute = (route, query = {}) =>
  new Promise(resolve=>route({ query }, new MockResponse(resolve)))
class MockResponse {
  status (code) { this.code = code; return this }
  send (data) { this.data = data; this.resolve(this) }
  constructor (resolve) {
    this.resolve = resolve
    hideProperties(this, ['resolve'])
  }
}

const t1 = performance.now()
try {
  await testDbRoute('/')
  await testDbRoute('/status')
  await testDbRoute('/search')
  await testDbRoute('/block')
  await testDbRoute('/txs')
  await testDbRoute('/tx/:txHash')
  //await testDbRoute('/validators')
  await testDbRoute('/validators/states')
  await testDbRoute('/validator')
  await testDbRoute('/validator/votes/:address')
  await testDbRoute('/proposals')
  await testDbRoute('/proposals/stats')
  await testDbRoute('/proposal/:id')
  await testDbRoute('/proposal/votes/:id')
  await testDbRoute('/transfers')
  await testDbRoute('/transactions/:address')
  await testDbRoute('/balances/:address')
  console.log('Tests done in', performance.now() - t1)
  process.exit(0)
} catch (e) {
  console.error(e)
  console.log('Tests failed in', performance.now() - t1)
  process.exit(1)
}

//mock.destroy()
