import db from './db.js'
import * as DB from './db.js'
import { Sequelize, Op } from "sequelize"
import { intoRecord } from '@hackbg/into'
import {
  sql, defaultAttributes,
  slonikCount, slonikSelect, selectTxs, countTxs,
  matchContentType, matchContentData, matchSourceOrValidator, OR,
  paginateByContent, DESC,
  jsonbFields,
} from './dbUtil.js'

export const totalTransactions = () =>
  DB.Transaction.count()

export const totalVotes = () =>
  DB.Vote.count()

export const totalProposals = () =>
  DB.Proposal.count()

export const totalBlocks = () =>
  DB.Block.count()

export const latestEpoch = () =>
  DB.Epoch.max('id')

export const latestEpochFromBlock = () =>
  DB.Block.max('epoch')

export const latestEpochFromValidators = async (epoch) => {
  epoch = Number(epoch)
  if (isNaN(epoch)) {
    const attributes = { include: [ 'epoch' ] }
    const order      = [['epoch','DESC']]
    const epochRow   = await DB.Validator.findOne({ attributes, order })
    epoch = epochRow?.get().epoch
  }
  return epoch
}

export const latestBlock = () =>
  DB.Block.max('blockHeight')

export const oldestBlock = () =>
  DB.Block.min('blockHeight')

export const totalValidators = async (epoch) => {
  epoch = await latestEpochFromValidators(epoch)
  const where = {}
  if (!isNaN(epoch)) where.epoch = epoch
  return DB.Validator.count({ where })
}

export const overview = ({ limit = 10 } = {}) => intoRecord({
  totalBlocks,
  oldestBlock,
  latestBlock,
  latestBlocks: blocksLatest({ limit }).then(x=>x.rows),
  totalTransactions,
  latestTransactions: transactionsLatest({ limit }),
  totalValidators,
  topValidators: validatorsTop({ limit }),
  totalProposals,
  totalVotes,
})

export const status = () => intoRecord({
  totalBlocks,
  oldestBlock,
  latestBlock,
  totalTransactions,
  totalValidators,
  totalProposals,
  totalVotes,
})

export const search = async (q = '') => {
  q = String(q||'').trim()
  const [ blocks, transactions, proposals ] = await Promise.all([
    searchBlocks(q),
    searchTransactions(q),
    searchProposals(q),
  ])
  return { blocks, transactions, proposals }
}

export const searchBlocks = async blockHeight => {
  blockHeight = Number(blockHeight)
  if (isNaN(blockHeight)) return []
  return [
    await DB.Block.findOne({
      where:      { blockHeight },
      attributes: { exclude: [ 'createdAt', 'updatedAt' ] },
    })
  ]
}

export const searchProposals = async id => {
  id = Number(id)
  if (isNaN(id)) return []
  return [
    await DB.Proposal.findOne({
      where:      { id },
      attributes: { exclude: [ 'createdAt', 'updatedAt' ] },
    })
  ]
}

export const searchTransactions = async txHash => {
  if (!txHash) return []
  return [
    await DB.Transaction.findOne({
      where:      { txHash },
      attributes: { exclude: [ 'createdAt', 'updatedAt' ] },
    })
  ]
}

const BLOCK_LIST_ATTRIBUTES = [ 'blockHeight', 'blockHash', 'blockTime', 'epoch' ]

export const blocks = async ({
  before,
  after,
  limit = 15,
  publicKey
}) => {
  let addresses = []
  if (publicKey) {
    addresses = [...await validatorPublicKeyToConsensusAddresses(publicKey)]
    if (addresses.length === 0) return {
      address: null,
      publicKey,
      ...await intoRecord({ totalBlocks, latestBlock, oldestBlock }),
      count: 0,
      blocks: []
    }
  }
  let rows, count
  if (before) {
    ;({ rows, count } = await blocksBefore({ before, limit, addresses }))
  } else if (after) {
    ;({ rows, count } = await blocksAfter({ after, limit, addresses }))
  } else {
    ;({ rows, count } = await blocksLatest({ limit, addresses }))
  }
  return {
    publicKey,
    addresses,
    ...await intoRecord({ totalBlocks, latestBlock, oldestBlock }),
    count,
    blocks: await Promise.all(rows.map(block=>DB.Transaction
      .count({ where: { blockHeight: block.blockHeight } })
      .then(transactionCount=>({ ...block.get(), transactionCount }))
    ))
  }
}

export const blocksLatest = ({ limit, addresses = [] }) => {
  const where = {}
  if (addresses && addresses.length > 0) {
    where['blockHeader.proposerAddress'] = { [Op.in]: addresses }
  }
  return DB.Block.findAndCountAll({
    attributes: BLOCK_LIST_ATTRIBUTES,
    order: [['blockHeight', 'DESC']],
    limit,
    where,
  })
}

export const blocksBefore = ({ before, limit = 15, addresses = [] }) => {
  const where = { blockHeight: { [Op.lte]: before } }
  if (addresses && addresses.length > 0) {
    where['blockHeader.proposerAddress'] = { [Op.in]: addresses }
  }
  return DB.Block.findAndCountAll({
    attributes: BLOCK_LIST_ATTRIBUTES,
    order: [['blockHeight', 'DESC']],
    limit,
    where,
  })
}

export const blocksAfter = ({ after, limit = 15, addresses = [] }) => {
  const where = { blockHeight: { [Op.gte]: after } }
  if (addresses && addresses.length > 0) {
    where['blockHeader.proposerAddress'] = { [Op.in]: addresses }
  }
  return DB.Block.findAndCountAll({
    attributes: BLOCK_LIST_ATTRIBUTES,
    order: [['blockHeight', 'ASC']],
    limit,
    where,
  })
}

export const block = async ({ height, hash } = {}) => {
  const attrs = defaultAttributes(['blockHeight', 'blockHash', 'blockHeader', 'epoch'])
  let block
  if (height || hash) {
    const where = {}
    if (height) where['blockHeight'] = height
    if (hash) where['blockHash'] = hash
    block = await DB.Block.findOne({attributes: attrs, where})
  } else {
    const order = [['blockHeight', 'DESC']]
    block = await DB.Block.findOne({attributes: attrs, order})
  }
  return block
}

export const blockByHeightWithTransactions = (blockHeight = 0) => {
  const where = { blockHeight }
  return Promise.all([
    DB.Block.findOne({ where, attributes: defaultAttributes() }),
    DB.Transaction.findAndCountAll({ where, attributes: defaultAttributes() }),
  ])
}

export const epochs = ({ limit = 10, before, after }) =>
  before ? epochsBefore({ before, limit }) :
   after ? epochsAfter({ after, limit })   :
           epochsLatest({ limit })

export const epochsLatest = ({ limit = 10 }) => DB.Block.findAll({
  where: { "epoch": { [Op.not]: null } },
  attributes: [
    "epoch",
    [Sequelize.fn("MAX", Sequelize.col("blockHeight")), "maxBlockHeight"],
    [Sequelize.fn("MIN", Sequelize.col("blockHeight")), "minBlockHeight"],
  ],
  order: [['epoch', 'DESC']],
  group: "epoch",
  limit,
})

export const epochsBefore = ({ limit = 10, before }) => DB.Block.findAll({
  where: { "epoch": { [Op.not]: null, [Op.lte]: before } },
  attributes: [
    "epoch",
    [Sequelize.fn("MAX", Sequelize.col("blockHeight")), "maxBlockHeight"],
    [Sequelize.fn("MIN", Sequelize.col("blockHeight")), "minBlockHeight"],
  ],
  order: [['epoch', 'DESC']],
  group: "epoch",
  limit,
})

export const epochsAfter = ({ limit = 10, after }) => DB.Block.findAll({
  where: { "epoch": { [Op.not]: null, [Op.gte]: after } },
  attributes: [
    "epoch",
    [Sequelize.fn("MAX", Sequelize.col("blockHeight")), "maxBlockHeight"],
    [Sequelize.fn("MIN", Sequelize.col("blockHeight")), "minBlockHeight"],
  ],
  order: [['epoch', 'ASC']],
  group: "epoch",
  limit,
})

export const transactionByHash = txHash => {
  const where = { txHash };
  const attrs = defaultAttributes({ exclude: ['id'] })
  return DB.Transaction.findOne({ where, attrs });
}

export const transactionList = ({ limit, offset } = {}) =>
  DB.Transaction.findAndCountAll({
    attributes: defaultAttributes({ exclude: ['id'] }),
    order: [['blockTime', 'DESC']],
    limit,
    offset,
  })

export const transactionsLatest = ({ limit = 15 } = {}) =>
  DB.Transaction.findAll({
    order: [['blockHeight', 'DESC']],
    limit,
    offset: 0,
    attributes: [
      'blockHeight', 'blockHash', 'blockTime', 'txHash', 'txTime',
      [db.json('txData.data.content.type'), 'txContentType']
    ],
  })

export const transactionsAtHeight = (blockHeight = 0) =>
  DB.Transaction.findAndCountAll({ where: { blockHeight } })

export const validatorByConsensusAddress = consensusAddress =>
  DB.Validator.findOne({
    attributes: [ 'namadaAddress', 'publicKey', 'consensusAddress', 'metadata' ],
    where: { consensusAddress }
  })

export const validatorsTop = ({ limit = 15 } = {}) =>
  DB.Validator.findAll({
    attributes: defaultAttributes(),
    order: [['stake', 'DESC']],
    limit,
    offset: 0,
  })

export const validatorPublicKeyToConsensusAddresses = async (publicKey) => {
  const addresses = new Set()
  if (publicKey) {
    const attributes = { include: [ 'consensusAddress' ] }
    const where = { publicKey }
    const records = await DB.Validator.findAll({ attributes, where })
    for (const record of records) {
      if ((record.consensusAddress||"").trim().length > 0) {
        addresses.add(record.consensusAddress)
      }
    }
  }
  return addresses
}

export const validatorNamadaAddressToConsensusAddresses = async (namadaAddress) => {
  const addresses = new Set()
  if (namadaAddress) {
    const attributes = { include: [ 'consensusAddress' ] }
    const where = { namadaAddress }
    const records = await DB.Validator.findAll({ attributes, where })
    for (const record of records) {
      if ((record.consensusAddress||"").trim().length > 0) {
        addresses.add(record.consensusAddress)
      }
    }
  }
  return addresses
}

// PROPOSALS //////////////////////////////////////////////////////////////////////////////////////

export const proposalsWithoutResults = () =>
  slonikSelect(sql.unsafe`SELECT id FROM proposals WHERE result is null`)
    .then(rows=>rows.map(row=>row.id))

/// COUNT/LIST TXS: GENERIC IMPLEMENTATION ////////////////////////////////////////////////////////

export class TxQuerier {
  count = ({ ...args }) => countTxs(sql.fragment`
    WHERE ${this.matcher} AND ${this.filter(...args)}`)
  list = ({ limit = 100, offset = 0, ...args }) => selectTxs(sql.fragment`
    WHERE ${this.matcher} AND ${this.filter(...args)} ${this.pagination(limit, offset)}`)
  constructor (matcher, filter, pagination) {
    matcher ??= sql.fragment`TRUE`
    if (typeof matcher === 'string') matcher = matchContentType(matcher)
    this.matcher    = matcher
    this.filter     = filter
    this.pagination = pagination ?? ((limit, offset)=>paginate("blockHeight", DESC, limit, offset))
  }
}

// COUNT/LIST TXS: BECOME/CHANGE/DEACTIVATE VALIDATOR /////////////////////////////////////////////

const addressFilter = ({ address = "" }) =>
  matchContentData(sql.literalValue('address'), address)
const validatorFilter = ({ validator = "" }) =>
  matchContentData(sql.literalValue('validator'), validator)

export const becomeValidator         = 
  new TxQuerier("tx_become_validator.wasm", addressFilter)
export const changeValidatorMetadata =
  new TxQuerier("tx_change_validator_metadata.wasm", validatorFilter)
export const deactivateValidator     =
  new TxQuerier("tx_deactivate_validator.wasm", addressFilter)

// COUNT/LIST TXS: BOND/UNBOND ////////////////////////////////////////////////////////////////////

const bondUnbondFilter = ({ source = "", validator = "" }) =>
  matchSourceOrValidator({ source, validator })
const bondUnbondPaginate = (limit, offset) => paginateByContent(
  "content", sql.fragment`'data'->>'amount'`, sql.fragment`bigint`, DESC, limit, offset)
const matchBondOrUnbond = OR(
  matchContentType("tx_bond.wasm"),
  matchContentType("tx_unbond.wasm"))

export const bondUnbond = new TxQuerier(matchBondOrUnbond, bondUnbondFilter,  bondUnbondPaginate)
export const bond       = new TxQuerier("tx_bond.wasm",    bondUnbond.filter, bondUnbondPaginate)
export const unbond     = new TxQuerier("tx_unbond.wasm",  bondUnbond.filter, bondUnbondPaginate)

// COUNT/LIST TXS: TRANSFER ///////////////////////////////////////////////////////////////////////

export const transfer = {
  filter: (source, target) =>
    sql.fragment`WHERE "source" = ${source} OR "target" = ${target}`,
  pagination: (limit, offset) =>
    sql.fragment`ORDER BY "blockHeight" DESC LIMIT ${limit} OFFSET ${offset}`,
  count: ({ address = "", source = address, target = address, }) =>
    slonikCount(sql.unsafe`
      WITH owners as (${transfer.owners})
      SELECT COUNT(*) FROM owners
      ${transfer.filter(source, target)}`),
  list: ({ address = "", source = address, target = address, limit = 100, offset = 0 }) =>
    slonikSelect(sql.unsafe`
      WITH transfers as (${transfer.full})
      SELECT * FROM transfers
      ${transfer.filter(source, target)}
      ${transfer.pagination(limit, offset)}`),
  listTokens: () =>
    slonikQuery(sql.unsafe`SELECT
      jsonb_path_query("txData", '$.source[*].token') AS source_token,
      jsonb_path_query("txData", '$.target[*].token') AS target_token
      FROM (${transfer.txData})`),
}
transfer.txData =
  sql.fragment`SELECT "blockHeight, "blockHash", "txHash",
  ${jsonbFields("txData", { txData: '$.data.content.data[*]' })}
  FROM "transactions" WHERE ${matchContentType("tx_bond.wasm")}`
transfer.owners =
  sql.fragment`WITH txs AS (${transfer.txData}) SELECT ${jsonbFields("txData", {
    source: '$.sources[*].owner',
    target: '$.targets[*].owner',
  })} FROM txs`
transfer.full = sql.fragment`
  WITH txs AS (${transfer.txData}) SELECT
  "blockHeight", "blockTime, "blockHash", "blockTime", "txHash", "txTime", ${jsonbFields("txData", {
    source:       '$.sources[*].owner',
    sourceToken:  '$.sources[*].token',
    sourceAmount: '$.sources[*][1]',
    target:       '$.targets[*].owner',
    targetToken:  '$.targets[*].token',
    targetAmount: '$.targets[*][1]',
  })} FROM txs`

// COUNT/LIST ALL TXS BY ADDRESS /////////////////////////////////////////////////////////////////////

export const txWithAddress = new TxQuerier(null,
  ({ address = '' }) => sql.fragment`(
    (content->'type' = '"tx_bond.wasm"' OR content->'type' = '"tx_unbond.wasm"')
    AND (content->'data'->'source' = ${address} OR content->'data'->'validator' = ${address})
  ) OR (
    (content->'type' = '"tx_become_validator.wasm"' OR content->'type' = '"tx_deactivate_validator.wasm"')
    AND content->'data'->'address' = ${address}
  ) OR (
    content->'type' = '"tx_change_validator_metadata.wasm"'
    AND content->'data'->'validator' = ${address}
  )`
)
