import db from './db.js'
import { Proposal, Vote, Validator, Epoch, Block, Transaction } from './dbModel.js'
import {
  sql, count,
  slonikCount, slonikSelect,
  fromTxsByContent, paginateByContent,
  matchContentAddress, matchContentType, matchContentSourceOrValidator,
  ASC, DESC, OR, AND,
  defaultAttributes,
} from './dbUtil.js'
import { intoRecord } from '@hackbg/into'
import { Sequelize, Op, QueryTypes } from "sequelize"
const { SELECT, COUNT } = QueryTypes
const BLOCK_LIST_ATTRIBUTES = [ 'blockHeight', 'blockHash', 'blockTime', 'epoch' ]

/// GLOBAL ////////////////////////////////////////////////////////////////////////////////////////

/** Display an overview. */
export const overview = ({ limit = 10 } = {}) => intoRecord({
  totalBlocks,
  oldestBlock,
  latestBlock,
  latestBlocks: blocksLatest({ limit }).then(x=>x.rows.map(row=>row.get())),
  totalTransactions,
  latestTransactions: transactionsLatest({ limit }).then(x=>x.map(row=>row.get())),
  totalValidators,
  topValidators: validatorsTop({ limit }).then(x=>x.map(row=>row.get())),
  totalProposals,
  totalVotes, })

/** Display status. */
export const status = () => intoRecord({
  totalBlocks,
  oldestBlock,
  latestBlock,
  totalTransactions,
  totalValidators,
  totalProposals,
  totalVotes, })

/** Query all available searches. */
export const search = async (q = '') => {
  q = String(q||'').trim()
  const [ blocks, transactions, proposals ] = await Promise.all([
    searchBlocks,
    searchTransactions,
    searchProposals
  ].map(f=>f(q).then(rows=>rows.map(row=>row?.get()))))
  return { blocks, transactions, proposals }}

/// GOVERNANCE ////////////////////////////////////////////////////////////////////////////////////

/** Count proposals. */
export const totalProposals = () =>
  Proposal.count()

/** Retrieve ids of all proposals without stored results. */
export const proposalsWithoutResults = () =>
  slonikSelect(sql.unsafe`SELECT id FROM proposals WHERE result is null`)
    .then(rows=>rows.map(row=>row.id))

/** Find proposal by id. */
export const searchProposals = async id => {
  id = Number(id)
  return isNaN(id) ? [] : [await Proposal.findOne({
    where:      { id },
    attributes: { exclude: [ 'createdAt', 'updatedAt' ] }, })]}

/** Count votes. */
export const totalVotes = () =>
  Vote.count()

/// VALIDATORS ////////////////////////////////////////////////////////////////////////////////////

/** Count all validators. */
export const totalValidators = async (epoch) => {
  epoch = await latestEpochFromValidators(epoch)
  const where = {}
  if (!isNaN(epoch)) where.epoch = epoch
  return Validator.count({ where })
}

/** Find a validator by consensus hash. */
export const validatorByConsensusAddress = consensusAddress => Validator.findOne({
  attributes: [ 'namadaAddress', 'publicKey', 'consensusAddress', 'metadata' ],
  where: { consensusAddress }
})

/** Return top N validators. */
export const validatorsTop = ({ limit = 15 } = {}) => Validator.findAll({
  attributes: defaultAttributes(), order: [['stake', 'DESC']], limit, offset: 0,
})

/** Return all consensus addresses for a validator identified by public key. */
export const validatorPublicKeyToConsensusAddresses = async (publicKey) => {
  const addresses = new Set()
  if (publicKey) {
    const attributes = { include: [ 'consensusAddress' ] }
    const where = { publicKey }
    const records = await Validator.findAll({ attributes, where })
    for (const record of records) {
      if ((record.consensusAddress||"").trim().length > 0) {
        addresses.add(record.consensusAddress)
      }
    }
  }
  return addresses
}

/** Return all consensus addresses for a validator identified by Namada address. */
export const validatorNamadaAddressToConsensusAddresses = async (namadaAddress) => {
  const addresses = new Set()
  if (namadaAddress) {
    const attributes = { include: [ 'consensusAddress' ] }
    const where = { namadaAddress }
    const records = await Validator.findAll({ attributes, where })
    for (const record of records) {
      if ((record.consensusAddress||"").trim().length > 0) {
        addresses.add(record.consensusAddress)
      }
    }
  }
  return addresses
}

/// EPOCHS ////////////////////////////////////////////////////////////////////////////////////////

export const latestEpoch = () =>
  Epoch.max('id')
export const latestEpochFromBlock = () =>
  Block.max('epoch')
export const latestEpochFromValidators = async (epoch) => {
  epoch = Number(epoch)
  if (isNaN(epoch)) {
    const attributes = { include: [ 'epoch' ] }
    const order      = [['epoch','DESC']]
    const epochRow   = await Validator.findOne({ attributes, order })
    epoch = epochRow?.get().epoch
  }
  return epoch
}
export const epochs = ({ limit = 10, before, after }) =>
  before ? epochsBefore({ before, limit }) :
   after ? epochsAfter({ after, limit })   :
           epochsLatest({ limit })
export const epochsLatest = ({ limit = 10 }) => Block.findAll({
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
export const epochsBefore = ({ limit = 10, before }) => Block.findAll({
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
export const epochsAfter = ({ limit = 10, after }) => Block.findAll({
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

/// BLOCKS ////////////////////////////////////////////////////////////////////////////////////////

export const totalBlocks = () =>
  Block.count()
export const latestBlock = () =>
  Block.max('blockHeight')
export const oldestBlock = () =>
  Block.min('blockHeight')
export const searchBlocks = async blockHeight => {
  blockHeight = Number(blockHeight)
  return (isNaN(blockHeight)) ? [] : [
    await Block.findOne({
      where:      { blockHeight },
      attributes: { exclude: [ 'createdAt', 'updatedAt' ] }, })]}
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
    blocks: await Promise.all(rows.map(block=>Transaction
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
  return Block.findAndCountAll({
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
  return Block.findAndCountAll({
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
  return Block.findAndCountAll({
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
    block = await Block.findOne({attributes: attrs, where})
  } else {
    const order = [['blockHeight', 'DESC']]
    block = await Block.findOne({attributes: attrs, order})
  }
  return block
}
export const blockData = async ({ height, hash } = {}) => {
  const attrs = defaultAttributes(['blockHeight', 'blockHash', 'blockData'])
  let block
  if (height || hash) {
    const where = {}
    if (height) where['blockHeight'] = height
    if (hash) where['blockHash'] = hash
    block = await BlockDataResponse.findOne({attributes: attrs, where})
  } else {
    const order = [['blockHeight', 'DESC']]
    block = await BlockDataResponse.findOne({attributes: attrs, order})
  }
  return block
}
export const blockByHeightWithTransactions = (blockHeight = 0) => {
  const where = { blockHeight }
  return Promise.all([
    Block.findOne({ where, attributes: defaultAttributes() }),
    Transaction.findAndCountAll({ where, attributes: defaultAttributes() }),
  ])
}

/// TRANSACTIONS //////////////////////////////////////////////////////////////////////////////////

export const totalTransactions = () =>
  Transaction.count()
export const searchTransactions = async txHash => txHash ? [
  await Transaction.findOne({
    where:      { txHash },
    attributes: { exclude: [ 'createdAt', 'updatedAt' ] },
  })
] : []
export const transactionByHash = txHash => Transaction.findOne({
  where: { txHash }, attrs: defaultAttributes({ exclude: ['id'] })
});
export const transactionList = ({ limit, offset } = {}) => Transaction.findAndCountAll({
  attributes: defaultAttributes({ exclude: ['id'] }),
  order: [['blockTime', 'DESC']],
  limit,
  offset,
})
export const transactionsLatest = ({ limit = 15 } = {}) =>
  Transaction.findAll({
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
export const transactionsAtHeight = (blockHeight = 0) =>
  Transaction.findAndCountAll({ where: { blockHeight } })
export const txByAddressCount = ({ address = "" }) =>
  slonikCount(sql.unsafe`SELECT COUNT(*) ${fromTxsByContent}
    WHERE ${txByAddressFilter(address)}`)
export const txByAddressList = ({ address = "", limit = 100, offset = 0 }) =>
  slonikSelect(sql.unsafe`SELECT * ${fromTxsByContent}
    WHERE ${txByAddressFilter(address)}
    ORDER BY "blockHeight" DESC LIMIT ${limit} OFFSET ${offset}`)
export const becomeValidatorCount = async ({ address = "" }) => await count(`
  SELECT COUNT(*) FROM "transactions"
  WHERE "txData"->'data'->'content'->'type' = '"tx_become_validator.wasm"'
  AND "txData"->'data'->'content'->'data'->'address' = :address
`, { replacements: { address: JSON.stringify(address), } })
export const becomeValidatorList = async ({
  address = "",
  limit   = 100,
  offset  = 0
}) => await db.query(`
  SELECT "blockHeight", "txHash", "txTime", "txData"->'data'->'content'->'data' as data
  FROM   "transactions"
  WHERE  "txData"->'data'->'content'->'type' = '"tx_become_validator.wasm"'
  AND    "txData"->'data'->'content'->'data'->'address' = :address
  ORDER BY "blockHeight" DESC LIMIT :limit OFFSET :offset
`, { type: SELECT, replacements: { address: JSON.stringify(address), limit, offset, } })
export const changeValidatorMetadataCount = async ({ validator = "" }) => await count(`
  SELECT COUNT(*) FROM "transactions"
  WHERE "txData"->'data'->'content'->'type' = '"tx_change_validator_metadata.wasm"'
  AND "txData"->'data'->'content'->'data'->'validator' = :validator
`, { replacements: { validator: JSON.stringify(validator), } })
export const changeValidatorMetadataList = async ({
  validator = "",
  limit   = 100,
  offset  = 0
}) => await db.query(`
  SELECT "blockHeight", "txHash", "txTime", "txData"->'data'->'content'->'data' as data
  FROM   "transactions"
  WHERE  "txData"->'data'->'content'->'type' = '"tx_change_validator_metadata.wasm"'
  AND    "txData"->'data'->'content'->'data'->'validator' = :validator
  ORDER BY "blockHeight" DESC LIMIT :limit OFFSET :offset
`, { type: SELECT, replacements: { validator: JSON.stringify(validator), limit, offset, } })
export const deactivateValidatorCount = async ({ address = "" }) => await count(`
  SELECT COUNT(*) FROM "transactions"
  WHERE "txData"->'data'->'content'->'type' = '"tx_deactivate_validator.wasm"'
  AND "txData"->'data'->'content'->'data'->'address' = :address
`, { replacements: { address: JSON.stringify(address), } })
export const deactivateValidatorList = async ({
  address = "",
  limit   = 100,
  offset  = 0
}) => await db.query(`
  SELECT "blockHeight", "txHash", "txTime", "txData"->'data'->'content'->'data' as data
  FROM   "transactions"
  WHERE  "txData"->'data'->'content'->'type' = '"tx_deactivate_validator.wasm"'
  AND    "txData"->'data'->'content'->'data'->'address' = :address
  ORDER BY "blockHeight" DESC LIMIT :limit OFFSET :offset
`, { type: SELECT, replacements: { address: JSON.stringify(address), limit, offset, } })

const bondUnbondPagination = ({ limit, offset }) => paginateByContent(
  "content", sql.fragment`'data'->>'amount'`, sql.fragment`bigint`, DESC, limit, offset)
export const bondAndUnboundCount = ({ source = "", validator = "" }) =>
  slonikCount(sql.unsafe`SELECT COUNT(*)
    ${fromTxsByContent} WHERE ${bondOrUnbondFilter({ source, validator })}`)
export const bondAndUnboundList = ({ source, validator, limit = 100, offset = 0 }) =>
  slonikSelect(sql.unsafe`SELECT *
    ${fromTxsByContent} WHERE ${bondOrUnbondFilter({ source, validator })}
    ${bondUnbondPagination({ limit, offset })}`)
export const bondCount = ({ source = "", validator = "" }) =>
  slonikCount(sql.unsafe`SELECT COUNT(*)
    ${fromTxsByContent} WHERE ${bondFilter({ source, validator })}`)
export const bondList = ({ source, validator, limit = 100, offset = 0 }) =>
  slonikSelect(sql.unsafe`SELECT *
    ${fromTxsByContent} WHERE ${bondFilter({ source, validator })}
    ${bondUnbondPagination({ limit, offset })}`)
export const unbondCount = ({ source = "", validator = "" }) =>
  slonikCount(sql.unsafe`SELECT COUNT(*)
    ${fromTxsByContent} WHERE ${unbondFilter({ source, validator })}`)
export const unbondList = ({ source, validator, limit = 100, offset = 0 }) =>
  slonikSelect(sql.unsafe`SELECT *
    ${fromTxsByContent} WHERE ${unbondFilter({ source, validator })}
    ${bondUnbondPagination({ limit, offset })}`)
const bondOrUnbondFilter = ({ source, validator }) => AND(
  OR(matchContentType("tx_bond.wasm"), matchContentType("tx_unbond.wasm")),
  matchContentSourceOrValidator({ source, validator }))
const bondFilter = ({ source, validator }) => AND(
  matchContentType("tx_bond.wasm"),
  matchContentSourceOrValidator({ source, validator }))
const unbondFilter = ({ source, validator }) => AND(
  matchContentType("tx_unbond.wasm"),
  matchContentSourceOrValidator({ source, validator }))
const txByAddressFilter = address => OR(
  bondOrUnbondFilter({ source: address, validator: address }),
  validatorTxFilter(address))
const becomeValidatorFilter = address => AND(
  matchContentType("tx_become_validator.wasm"),
  matchContentAddress(address))
const deactivateValidatorFilter = address => AND(
  matchContentType("tx_deactivate_validator.wasm"),
  matchContentAddress(address))
const changeValidatorMetadataFilter = address => AND(
  matchContentType("tx_change_validator_metadata.wasm"),
  matchContentSourceOrValidator({ validator: address }))
export const validatorTxFilter = address => sql.fragment`(
  ${becomeValidatorFilter(address)}
  OR ${deactivateValidatorFilter(address)}
  OR ${changeValidatorMetadataFilter(address)})`
export const transferredTokens = () => db.query(`
  WITH "transactionData" AS (
    SELECT jsonb_path_query("txData", '$.data.content.data[*]') as "txData"
    FROM  "transactions"
    WHERE "txData"->'data'->'content'->'type' = '"tx_transfer.wasm"'
  )
  SELECT
    jsonb_path_query("txData", '$.source[*].token') AS source_token,
    jsonb_path_query("txData", '$.target[*].token') AS target_token
  FROM "transactionData"
`)
export const transferCount = ({ address = "", source = address, target = address, }) => db.query(`
  WITH
    "transactionData" AS (
      SELECT
        jsonb_path_query("txData", '$.data.content.data[*]') as "txData",
        jsonb_path_query("txData", '$.data.content.type') as "txType"
      FROM "transactions"
    ),
    "transfers" AS (
      SELECT
        "txType",
        jsonb_path_query("txData", '$.sources[*].owner') AS source,
        jsonb_path_query("txData", '$.targets[*].owner') AS target
      FROM "transactionData"
      WHERE "txType" = '"tx_transfer.wasm"'
    )
  SELECT COUNT(*) FROM "transfers"
  WHERE "source" = :source OR "target" = :target
`, {
  type: COUNT,
  replacements: {
    source: JSON.stringify(source),
    target: JSON.stringify(target),
  }
}).then(query=>Number(query[0][0].count))
export const transferList = async ({
  address = "",
  source  = address,
  target  = address,
  limit   = 100,
  offset  = 0
}) => {
  return await db.query(`
    WITH
      "transactionData" AS (
        SELECT
          "blockHeight",
          "txHash",
          "txTime",
          jsonb_path_query("txData", '$.data.content.data[*]') as "txData",
          jsonb_path_query("txData", '$.data.content.type') as "txType"
        FROM "transactions"
        ),
        "transfers" AS (
          SELECT
          "blockHeight",
          "txHash",
          "txTime",
          "txType",
          jsonb_path_query("txData", '$.sources[*].owner') AS source,
          jsonb_path_query("txData", '$.sources[*].token') AS sourceToken,
          jsonb_path_query("txData", '$.sources[*][1]')    AS sourceAmount,
          jsonb_path_query("txData", '$.targets[*].owner') AS target,
          jsonb_path_query("txData", '$.targets[*].token') AS targetToken,
          jsonb_path_query("txData", '$.targets[*][1]')    AS targetAmount
          FROM "transactionData"
          WHERE "txType" = '"tx_transfer.wasm"'
      )
    SELECT * FROM "transfers"
    WHERE "source" = :source OR "target" = :target
    ORDER BY "blockHeight" DESC LIMIT :limit OFFSET :offset
  `, {
    type: SELECT,
    replacements: {
      source: JSON.stringify(source),
      target: JSON.stringify(target),
      limit,
      offset
    }
  })
}
