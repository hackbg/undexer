import { Console } from "@hackbg/logs"
const console = new Console("DB");

import { Sequelize, DataTypes, Op } from "sequelize"
export { Sequelize, DataTypes, Op }
const { DATE, TEXT, JSONB, INTEGER, ENUM } = DataTypes

import { DATABASE_URL } from "./config.js"
const db = new Sequelize(DATABASE_URL, {
  dialect: "postgres",
  logging: () => console.log,
  logQueryParameters: true,
  supportBigNumbers: true,
})

export default db

export const IntegerPrimaryKey = (autoIncrement = false) => ({
  type:       INTEGER,
  allowNull:  false,
  unique:     true,
  primaryKey: true,
  autoIncrement
})

export const ErrorLog = db.define('error_log', {
  id:        IntegerPrimaryKey(true),
  timestamp: { type: DATE },
  message:   { type: TEXT },
  stack:     { type: JSONB },
  info:      { type: JSONB, allowNull: true },
})

export function logErrorToDB (error, info) {
  return ErrorLog.create({
    timestamp: new Date(),
    message:   error?.message,
    stack:     error?.stack,
    info
  })
}

export async function withErrorLog (callback, info) {
  try {
    return Promise.resolve(callback())
  } catch (error) {
    console.error('Logging error to database:', error)
    await logErrorToDB(error, info)
    throw error
  }
}

export const StringPrimaryKey = () => ({
  type:       TEXT,
  allowNull:  false,
  unique:     true,
  primaryKey: true,
})

import { serialize } from './utils.js'

export const JSONField = name => ({
  type: JSONB,
  allowNull: false,
  set (value) {
    return this.setDataValue(name, JSON.parse(serialize(value)));
  },
})

export const NullableJSONField = name => ({
  type: JSONB,
  allowNull: true,
  set (value) {
    return this.setDataValue(name, JSON.parse(serialize(value)));
  },
})

export const VALIDATOR_STATES = [
  "BelowThreshold",
  "BelowCapacity",
  "Jailed",
  "Consensus",
  "Inactive"
]

export const Validator = db.define('validator', {
  publicKey:        StringPrimaryKey(),
  address:          { type: TEXT, allowNull: true },
  namadaAddress:    { type: TEXT, allowNull: true },
  votingPower:      { type: TEXT, allowNull: true },
  proposerPriority: { type: TEXT, allowNull: true },
  metadata:         NullableJSONField('metadata'),
  commission:       NullableJSONField('commission'),
  stake:            { type: TEXT, allowNull: true },
  state:            NullableJSONField('state')
})

const blockMeta = {
  chainId:      { type: TEXT,    allowNull: false },
  blockHash:    { type: TEXT,    allowNull: false },
  blockHeight:  { type: INTEGER, allowNull: false },
  blockTime:    { type: DATE },
}

export const Block = db.define('block', {
  ...blockMeta,
  blockHash:    StringPrimaryKey(),
  blockHeader:  JSONField('blockHeader'),
  rpcResponses: JSONField('rpcResponses'),
})

export const Transaction = db.define('transaction', {
  ...blockMeta,
  txHash: StringPrimaryKey(),
  txTime: { type: DATE },
  txData: JSONField('txData'),
})

export const PROPOSAL_STATUS = [
  "ongoing",
  "finished",
  "upcoming",
]

export const PROPOSAL_RESULT = [
  "passed",
  "rejected",
]

export const PROPOSAL_TALLY_TYPE = [
  "OneHalfOverOneThird",
  "TwoThirds",
  "LessOneHalfOverOneThirdNay"
]

export const Proposal = db.define('proposal', {
  id:       IntegerPrimaryKey(),
  content:  JSONField('content'),
  metadata: JSONField('metadata'),
  result:   NullableJSONField('result'),
})

export const Vote = db.define("vote", {
  id:         IntegerPrimaryKey(true),
  proposal:   { type: INTEGER },
  data:       JSONField('data'),
})
