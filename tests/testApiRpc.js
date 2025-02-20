#!/usr/bin/env -S node --import @ganesha/esbuild
import process from 'node:process'

import { Console } from "@hackbg/logs"
const console = new Console("Test: API (RPC routes)")

util.inspect.defaultOptions.depth = 4
import util from 'node:util'

const { rpcRoutes } = await import('../src/rpcRoutes.js')
const testRoute = (route, params = {}, query = {}) =>
  new Promise(resolve=>route({ params, query }, {
    code: null,
    data: null,
    status (code) { this.code = code; return this },
    send (data) { this.data = data; resolve(this) },
  }))
const testRpcRoute = async (path, params = {}, query = {}) => {
  const console = new Console(path)
  console.br()
  console.log('/', params, '?', query)
  const route = rpcRoutes[path]
  const { code, data } = await testRoute(route, params, query)
  if (code == 200) {
    console.log(code, data)
  } else {
    console.error(code, data)
  }
}

const t1 = performance.now()
try {
  await testRpcRoute('/height')
  await testRpcRoute('/total-staked')
  await testRpcRoute('/epoch')
  await testRpcRoute('/parameters')
  await testRpcRoute('/parameters/staking')
  await testRpcRoute('/parameters/governance')
  await testRpcRoute('/parameters/pgf')
  await testRpcRoute('/denomination/:token')
  await testRpcRoute('/total-supply/:token')
  await testRpcRoute('/effective-native-supply')
  await testRpcRoute('/staking-rewards-rate')
  await testRpcRoute('/balances/:address', { address: 'invalid' })
  //await testDbRoute('/balances/:address')
  console.log('RPC API tests done in', performance.now() - t1)
  //process.exit(0)
} catch (e) {
  console.error(e)
  console.log('RPC API tests failed in', performance.now() - t1)
  throw e
  //process.exit(1)
}

//mock.destroy()
