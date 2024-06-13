import { Console } from "@hackbg/logs"
const console = new Console("DB");

import { Sequelize, DataTypes } from "sequelize"
export { DataTypes }
const { DATE, TEXT, JSONB, INTEGER, ENUM } = DataTypes

import { DATABASE_URL } from "./config.js"
const db = new Sequelize(DATABASE_URL, {
  dialect: "postgres",
  logging: () => console.log,
  logQueryParameters: true,
  supportBigNumbers: true,
})

export default db

export const IntegerPrimaryKey = () => ({
  type:       INTEGER,
  allowNull:  false,
  unique:     true,
  primaryKey: true,
})

export const ErrorLog = db.define('error_log', {
  id:        { ...IntegerPrimaryKey(), autoIncrement: true },
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
  get() {
    return JSON.parse(this.getDataValue(name));
  },
  set(value) {
    return this.setDataValue(name, serialize(value));
  },
})

export const NullableJSONField = name => ({
  type: JSONB,
  allowNull: true,
  get() {
    return JSON.parse(this.getDataValue(name));
  },
  set(value) {
    return this.setDataValue(name, serialize(value));
  },
})

export const VALIDATOR_STATES = {
  "below-threshold": "BelowThreshold",
  "below-capacity":  "BelowCapacity",
  "jailed":          "Jailed",
  "consensus":       "Consensus",
  "inactive":        "Inactive"
}

export const Validator = db.define('validator', {
  address:          StringPrimaryKey(),
  publicKey:        { type: TEXT, },
  votingPower:      { type: TEXT, },
  proposerPriority: { type: TEXT, },
  namadaAddress:    { type: TEXT, },
  metadata:         JSONField('metadata'),
  commission:       JSONField('commission'),
  stake:            { type: TEXT, },
  state:            JSONField('state')
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
  id:                IntegerPrimaryKey(),
  proposalType:      { type: TEXT, },
  author:            { type: TEXT, },
  startEpoch:        { type: INTEGER, },
  endEpoch:          { type: INTEGER, },
  graceEpoch:        { type: INTEGER, },
  contentJSON:       JSONField('contentJSON'),
  status:            { type: ENUM(...PROPOSAL_STATUS), },
  result:            { type: ENUM(...PROPOSAL_RESULT), },
  totalVotingPower:  { type: TEXT, },
  totalYayPower:     { type: TEXT, },
  totalNayPower:     { type: TEXT, },
  totalAbstainPower: { type: TEXT, },
  tallyType:         { type: ENUM(...PROPOSAL_TALLY_TYPE) }
})

export const Voter = db.define("voter", {
  id:         IntegerPrimaryKey(),
  vote:       { type: ENUM("yay", "nay", "abstain"), },
  power:      { type: TEXT, },
  voter:      { type: TEXT, },
  proposalId: { type: INTEGER, },
})

export const totalBlocks = () => Block.count()

export const latestBlock = () => Block.max('blockHeight')

export const oldestBlock = () => Block.min('blockHeight')

export const latestBlocks = limit => Block.findAll({
  order: [['blockHeight', 'DESC']],
  limit,
  offset: 0,
  attributes: [
    'blockHeight',
    'blockHash',
    'blockTime'
  ],
}).then(blocks=>Promise.all(blocks.map(block=>
  Transaction
    .count({ where: { blockHeight: block.blockHeight }, })
    .then(transactionCount=>({ ...block.dataValues, transactionCount }))
)))

export const totalTransactions = () => Transaction.count()

export const latestTransactions = limit => Transaction.findAll({
  order: [['blockHeight', 'DESC']],
  limit,
  offset: 0,
  attributes: [
    'blockHeight',
    'blockHash',
    'blockTime',
    'txHash',
    'txTime',
  ],
})

export const totalValidators = () => Validator.count()

export const topValidators = limit => Validator.findAll({
  order: [['stake', 'DESC']],
  limit,
  offset: 0,
})

export const totalProposals = () => Proposal.count()

export const totalVotes = () => Voter.count()
