import { Console, bold, colors } from '@hackbg/logs';
import { DEFAULT_PAGE_SIZE } from './config.js';

export const send200 = (res, data)  => res.status(200).send(data)
export const send400 = (res, error) => res.status(400).send({ error })
export const send404 = (res, error) => res.status(404).send({ error })
export const send500 = (res, error) => res.status(500).send({ error })

export function waitFor (msec) {
  return new Promise(resolve=>setTimeout(resolve, msec))
}

export function waitForever () {
  return new Promise(_=>console.warn('Debug mode. Pausing until manual intervention.'))
}

export async function runForever (interval, callback) {
  while (true) {
    try {
      await Promise.resolve(callback())
    } catch (e) {
      console.error(e)
    }
    await waitFor(interval)
  }
}

export async function retryForever (interval, callback) {
  while (true) {
    try {
      const result = await Promise.resolve(callback())
      return result
    } catch (e) {
      console.error(e)
      console.info('Retrying in', interval, 'msec')
      await waitFor(interval)
    }
  }
}

/** Run up to `max` tasks in parallel. */
export async function runParallel ({ max, process, inputs }) {
  inputs = [...inputs]
  let nextIndex = 0
  const results = []
  const pile = new Set()
  while ((inputs.length > 0) || (pile.size > 0)) {
    while ((pile.size < max) && (inputs.length > 0)) {
      const index = nextIndex
      nextIndex++
      const task = process(inputs.shift()).then(result=>results[index]=result)
      pile.add(task)
      task.finally(()=>pile.delete(task))
    }
    await Promise.race([...pile])
  }
  return results
}

export function maxBigInt (x, y) {
  x = BigInt(x)
  y = BigInt(y)
  return (x > y) ? x : y
}

export function pad (x) {
  return String(x).padEnd(10)
}

export const filterBigInts = obj => JSON.parse(
  JSON.stringify(obj, (k, v) => (typeof v === 'bigint') ? String(v) : v)
)

export function withConsole (handler) {
  return async function withConsoleHandler (req, res) {
    const t0 = performance.now();
    const console = new Console(`${(t0/1000).toFixed(3)}: ${req.path}`)
    try {
      console.info(bold(req.method), req.query)
      await handler(req, res)
      const t1 = performance.now();
      console.log(colors.green(bold(`Done in ${((t1-t0)/1000).toFixed(3)}s`)))
    } catch (e) {
      const t1 = performance.now();
      console.error(
        bold(req.method), req.query,
        colors.red(bold(`Failed in ${((t1-t0)/1000).toFixed(3)}s:`)),
        e.message, '\n'+e.stack.split('\n').slice(1).join('\n')
      )
      res.status(500).send('Error')
    }
  }
}

// Read limit/offset from query parameters and apply defaults
export function pagination (req) {
  return {
    offset: Math.max(0,   req.query.offset ? Number(req.query.offset) : 0),
    limit:  Math.min(100, req.query.limit  ? Number(req.query.limit)  : DEFAULT_PAGE_SIZE),
  }
}

// Read limit/before/after from query parameters and apply defaults
export function relativePagination (req) {
  return {
    before: Math.max(0,   req.query.before || 0),
    after:  Math.max(0,   req.query.after  || 0),
    limit:  Math.min(100, req.query.limit ? Number(req.query.limit) : DEFAULT_PAGE_SIZE),
  }
}

export const callRoute = (route, req = {}) =>
  new Promise(async resolve=>
    await route(req, {
      status () { return this },
      send (data) { resolve(data) }
    }))

export function addRoutes (router) {
  for (const [route, handler] of routes) {
    router.get(route, withConsole(handler))
  }
  return router
}

export class Logged {
  constructor ({ log }) {
    this.log = log
  }

  /** Log with epoch prefix. */
  logE (epoch, ...args) {
    this.log.log(`Epoch ${String(epoch)}:`, ...args)
  }

  /** Log with height prefix. */
  logH (height, ...args) {
    this.log.log(`Block ${String(height)}:`, ...args)
  }

  /** Log with epoch and height prefix. */
  logEH (epoch, height, ...args) {
    this.log.log(`Block ${String(height)}:`, `Epoch ${String(epoch)}:`, ...args)
  }

  /** Warn with epoch and height prefix. */
  warnEH (epoch, height, ...args) {
    this.log.warn(`Block ${String(height)}:`, `Epoch ${String(epoch)}:`, ...args)
  }
}
