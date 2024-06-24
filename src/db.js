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

export const totalValidators = () => Validator.count()

export const validatorsTop = limit => Validator.findAll({
  order: [['stake', 'DESC']],
  limit,
  offset: 0,
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

export const searchBlocks = async blockHeight => {
  blockHeight = Number(blockHeight)
  if (isNaN(blockHeight)) return []
  return [
    await Block.findOne({
      where:      { blockHeight },
      attributes: { exclude: [ 'createdAt', 'updatedAt' ] },
    })
  ]
}

export const totalBlocks = () => Block.count()

export const latestBlock = () => Block.max('blockHeight')

export const oldestBlock = () => Block.min('blockHeight')

const BLOCK_LIST_ATTRIBUTES = [ 'blockHeight', 'blockHash', 'blockTime' ]

export const blocksLatest = limit => Block.findAndCountAll({
  attributes: BLOCK_LIST_ATTRIBUTES,
  order: [['blockHeight', 'DESC']],
  limit,
})

export const blocksBefore = (before, limit = 15) => Block.findAndCountAll({
  attributes: BLOCK_LIST_ATTRIBUTES,
  order: [['blockHeight', 'DESC']],
  limit,
  where: { blockHeight: { [Op.lte]: before } }
})

export const blocksAfter = (after, limit = 15) => DB.Block.findAndCountAll({
  attributes: BLOCK_LIST_ATTRIBUTES,
  order: [['blockHeight', 'ASC']],
  limit,
  where: { blockHeight: { [Op.gte]: after } }
})

export const Transaction = db.define('transaction', {
  ...blockMeta,
  txHash: StringPrimaryKey(),
  txTime: { type: DATE },
  txData: JSONField('txData'),
})

export const searchTransactions = async txHash => {
  if (!txHash) return []
  return [
    await Transaction.findOne({
      where:      { txHash },
      attributes: { exclude: [ 'createdAt', 'updatedAt' ] },
    })
  ]
}

export const totalTransactions = () => Transaction.count()

export const transactionsLatest = limit => Transaction.findAll({
  order: [['blockHeight', 'DESC']],
  limit,
  offset: 0,
  attributes: [
    'blockHeight',
    'blockHash',
    'blockTime',
    'txHash',
    'txTime',
    [db.json('txData.data.content.type'), 'txContentType']
  ],
})

export const transactionsAtHeight = blockHeight =>
  Transaction.findAndCountAll({ where: { blockHeight } })

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

export const totalProposals = () => Proposal.count()

export const searchProposals = async id => {
  id = Number(id)
  if (isNaN(id)) return []
  return [
    await Proposal.findOne({
      where:      { id },
      attributes: { exclude: [ 'createdAt', 'updatedAt' ] },
    })
  ]
}

export const Vote = db.define("vote", {
  id:         IntegerPrimaryKey(true),
  proposal:   { type: INTEGER },
  data:       JSONField('data'),
})

export const totalVotes = () => Vote.count()
