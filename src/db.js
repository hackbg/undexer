import { CHAIN_ID, DATABASE_URL } from "./config.js"
import { IntegerPrimaryKey, StringPrimaryKey, CompoundPrimaryKey } from './dbKeys.js'
import { JSONField, NullableJSONField } from './dbJson.js'
import process from 'node:process'
import { Console } from "@hackbg/logs"
import { Sequelize } from "sequelize"
import PG from "pg"
export const console = new Console("DB", { json: true, color: false });
const db = new Sequelize(DATABASE_URL, {
  dialect: "postgres",
  logging: () => console.log,
  logQueryParameters: true,
  supportBigNumbers: true,
  dialectOptions: {
    application_name: 'undexer',
    keepAlive: true,
    statement_timeout: 24 * 60 * 60000,
    idle_in_transaction_session_timeout: 120000,
  }
})
export default db
export async function initDb () {
  let dbName
  let host
  try {
    const url = new URL(DATABASE_URL)
    const { username, password, hostname, port, pathname } = url
    host = url.host
    dbName = pathname.slice(1) || CHAIN_ID
    console.debug(`Connecting to ${host}...`)
    const pg = new PG.Client({ user: username, password, host: hostname, port })
    console.debug(`Connected to ${host}`)
    await pg.connect()
    console.debug(`Ensuring database "${dbName}" at ${host}...`)
    await pg.query(`CREATE DATABASE "${dbName}";`)
    console.debug(`Created database "${dbName}" at ${host}`)
  } catch (e) {
    if (e.code === '42P04') {
      console.debug(`Database "${dbName}" already exists.`)
    } else {
      if (e.code === 'ECONNREFUSED') {
        console.error(`Connection refused. Make sure Postgres is running at ${e.address}:${e.port}`)
      } else {
        console.error(e)
      }
      console.error(`Failed to create database "${dbName}". See above for details.`)
      process.exit(1)
    }
  }
  // Allow sorting strings as numbers.
  // See https://github.com/sequelize/sequelize/discussions/15529#discussioncomment-4601186
  try {
    console.debug(`Ensuring numeric collation in "${dbName}" at ${host}...`)
    await db.query(`CREATE COLLATION IF NOT EXISTS numeric (provider = icu, locale = 'en-u-kn-true')`)
  } catch (e) {
    console.error(e)
    console.warn('FIXME: CREATE COLLATION threw. This is normal only after first run.')
  }
}
export function atomic (transaction, operation) {
  if (transaction) {
    return operation(transaction)
  } else {
    return db.transaction(transaction=>callback(transaction))
  }
}
