//deno-lint-ignore-file no-async-promise-executor
import { Console } from '@fadroma/namada'
import * as Config from './config.js'
import { Logged } from './utils.js'
const console = new Console('', { color: false, json: true })

/** Remote control for node and node-out proxy. */
export class RemoteControl extends Logged {
  constructor ({
    chain,
    proxyApi = Config.PROXY_CONTROL_URL,
    nodeApi  = Config.NODE_CONTROL_URL,
    log      = console
  } = {}) {
    super({ log })

    this.proxyApi = proxyApi
    const proxyWs = Object.assign(new URL(proxyApi), { protocol: 'ws:' }).href
    this.proxyWs  = new ReconnectingWebSocket(proxyWs)

    this.nodeApi = nodeApi
    const nodeWs = Object.assign(new URL(nodeApi), { protocol: 'ws:' }).href
    this.nodeWs  = new ReconnectingWebSocket(nodeWs)

    this.chain = chain

    // Mute debug logging from Fadroma.
    this.chain.log.debug = () => {}
    this.chain.connections[0].log.debug = () => {}
  }

  async connect () {
    await Promise.all([this.proxyWs.connect(), this.nodeWs.connect(),])
    this.log('Connected to remote control sockets.')
  }

  async isPaused () {
    const response = await fetch(this.proxyApi)
    const json = await response.json()
    this.log('isPaused response:', json)
    const status = json.canConnect
    return !status
  }

  async resume () {
    this.log('🟢 Sending resume sync command', this.proxyApi)
    ;(await this.proxyWs.socket).send(JSON.stringify({resume:{}}))
  }

  async restart () {
    this.log('🟠 Sending restart sync to', this.nodeApi)
    ;(await this.nodeWs.socket).send(JSON.stringify({restart:{}}))
    await this.resume()
  }
}

export class ReconnectingWebSocket {
  constructor (url) {
    this.url = url
  }

  connect (backoff = 0) {
    return this.socket = new Promise(async (resolve, reject) => {
      if (backoff > 0) {
        console.log('Waiting for', backoff, 'msec before connecting to socket...')
        await new Promise(resolve=>setTimeout(resolve, backoff))
      }
      try {
        console.log('Connecting to', this.url)
        const socket = new WebSocket(this.url)

        const onConnectError = (error) => {
          console.error(`🔴 Error connecting to ${this.url}:`, error)
          reject(error)
        }
        socket.addEventListener('error', onConnectError)

        socket.addEventListener('open', () => {
          socket.removeEventListener('error', onConnectError)
          console.log('Connected to', this.url)
          backoff = 0
          resolve(socket)
        })

        socket.addEventListener('close', () => {
          console.log('Disconnected from', this.url, 'reconnecting...')
          this.socket = this.connect(backoff + 250)
        })

        //socket.addEventListener('message', message => {})

      } catch (e) {
        console.error(e)
        console.error('Failed to connect to', this.url, 'retrying in 1s')
        this.socket = this.connect(backoff + 250)
      }
    })
  }
}

