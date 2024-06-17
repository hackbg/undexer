// This patches the global `fetch` to prevent `UND_ERR_CONNECT_TIMEOUT`.
//
// For more info, see:
// - https://github.com/nodejs/undici/issues/1531
// - https://github.com/nodejs/node/issues/43187#issuecomment-2089813900
//
import { fetch, setGlobalDispatcher, Agent } from 'undici'
setGlobalDispatcher(new Agent({ connect: { timeout: 300_000 } }) )
globalThis.fetch = fetch
