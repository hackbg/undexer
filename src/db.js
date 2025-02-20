import process from 'node:process'
import { Console } from "@hackbg/logs"
import { Sequelize, DataTypes, Op } from "sequelize"
import PG from "pg"
import { CHAIN_ID, DATABASE_URL } from "./config.js"
import { IntegerPrimaryKey, StringPrimaryKey, CompoundPrimaryKey } from './dbKeys.js'
import { JSONField, NullableJSONField } from './dbJson.js'

export { Sequelize, DataTypes, Op }

const console = new Console("DB");
const { DATE, TEXT, BLOB, JSONB, INTEGER, BOOLEAN, BIGINT } = DataTypes

const db = new Sequelize(DATABASE_URL, {
  dialect: "postgres",
  logging: () => console.log,
  logQueryParameters: true,
  supportBigNumbers: true,
  dialectOptions: {
    application_name: 'undexer',
    keepAlive: true,
    statement_timeout: 60000,
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

const blockMeta = () => ({
  chainId:     { type: TEXT,    allowNull: false },
  blockHash:   { type: TEXT,    allowNull: false },
  blockHeight: { type: INTEGER, allowNull: false },
  blockTime:   { type: DATE },
})

export const

  /** Stored raw responses. */
  RPCResponse = db.define('rpc_response', {
    id:          IntegerPrimaryKey(true),
    timestamp:   { type: DATE,    allowNull: false, },
    url:         { type: TEXT,    allowNull: false, },
    data:        { type: TEXT,    allowNull: false, },
  }),

  /** Epochs with global per-epoch state. */
  Epoch = db.define('epoch', {
    id:         IntegerPrimaryKey(true),
    totalStake: { type: BIGINT },
    parameters: JSONField('parameters')
  }),

  /** Validators with per-epoch state. */
  Validator = db.define('validator', {
    ...CompoundPrimaryKey({
      epoch:          { type: INTEGER, },
      namadaAddress:  { type: TEXT, },
    }),
    publicKey:        { type: TEXT, allowNull: true },
    consensusAddress: { type: TEXT, allowNull: true },
    votingPower:      { type: TEXT, allowNull: true },
    proposerPriority: { type: TEXT, allowNull: true },
    metadata:         NullableJSONField('metadata'),
    commission:       NullableJSONField('commission'),
    stake:            { type: TEXT, allowNull: true },
    state:            NullableJSONField('state')
  }),

  /** Blocks by hash, with decoded per-block data from RPC. */
  Block = db.define('block', {
    ...blockMeta(),
    epoch:        { type: INTEGER },
    blockHash:    StringPrimaryKey(), // primary key; overrides blockMeta().blockHash
    blockHeader:  JSONField('blockHeader'),
    blockData:    NullableJSONField('blockData'),
    blockResults: NullableJSONField('blockResults'),
  }),

  /** Transactions by hash, decoded from block data. */
  Transaction = db.define('transaction', {
    ...blockMeta(),
    txHash: StringPrimaryKey(),
    txTime: { type: DATE },
    txData: JSONField('txData'),
  }),

  /** Governance proposals by ID with per-proposal data. */
  Proposal = db.define('proposal', {
    id:       IntegerPrimaryKey(),
    content:  NullableJSONField('content'),
    metadata: NullableJSONField('metadata'),
    result:   NullableJSONField('result'),
    initTx:   { type: TEXT, allowNull: true }
  }),

  /** WASM blobs attached to governance proposals of certain types. */
  ProposalWASM = db.define('proposal_wasm', {
    id:       IntegerPrimaryKey(),
    codeKey:  { type: TEXT },
    wasm:     { type: BLOB },
  }),

  /** Governance votes per proposal/validator/delegator, with vote data. */
  Vote = db.define("vote", {
    ...CompoundPrimaryKey({
      proposal:    { type: INTEGER, },
      validator:   { type: TEXT,    allowNull: true },
      delegator:   { type: TEXT,    allowNull: true },
      isValidator: { type: BOOLEAN, allowNull: true },
    }),
    data:   { type: TEXT, },
    voteTx: { type: TEXT, allowNull: true },
    power:  { type: TEXT, allowNull: true },
    height: { type: INTEGER, allowNull: true },
    epoch:  { type: INTEGER, allowNull: true },
  });

export function atomic (transaction, operation) {
  if (transaction) {
    return operation(transaction)
  } else {
    return db.transaction(transaction=>callback(transaction))
  }
}
