import db from './db.js'
import * as DB from './db.js'
import { Op } from "sequelize"

export const totalTransactions = () =>
  DB.Transaction.count()

export const totalVotes = () =>
  DB.Vote.count()

export const totalProposals = () =>
  DB.Proposal.count()

export const totalBlocks = () =>
  DB.Block.count()

export const totalValidators = () =>
  DB.Validator.count()

export const overview = async (n = 10) => {
  return {
    totalBlocks:        await totalBlocks(),
    oldestBlock:        await oldestBlock(),
    latestBlock:        await latestBlock(),
    latestBlocks:       await blocksLatest(n).then(x=>x.rows),
    totalTransactions:  await totalTransactions(),
    latestTransactions: await transactionsLatest(n),
    totalValidators:    await totalValidators(),
    topValidators:      await validatorsTop(n),
    totalProposals:     await totalProposals(),
    totalVotes:         await totalVotes(),
  }
}

export const status = async () => {
  return {
    totalBlocks:       await totalBlocks(),
    oldestBlock:       await oldestBlock(),
    latestBlock:       await latestBlock(),
    totalTransactions: await totalTransactions(),
    totalValidators:   await totalValidators(),
    totalProposals:    await totalProposals(),
    totalVotes:        await totalVotes(),
  }
}

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

export const blocks = async (before, after, limit = 15) => {
  const { rows, count } = await (
    before ? blocksBefore(before, limit) :
    after  ? blocksAfter(after, limit) :
             blocksLatest(limit)
  )
  return {
    totalBlocks: await totalBlocks(),
    latestBlock: await latestBlock(),
    oldestBlock: await oldestBlock(),
    count,
    blocks: await Promise.all(rows.map(block=>DB.Transaction
      .count({ where: { blockHeight: block.blockHeight } })
      .then(transactionCount=>({ ...block.get(), transactionCount }))
    ))
  }
}

export const block = async ({ height, hash } = {}) => {
  const attrs = defaultAttributes(['blockHeight', 'blockHash', 'blockHeader'])
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
  const attrs = defaultAttributes()
  const where = { blockHeight }
  return Promise.all([
    DB.Block.findOne({ where, attributes: attrs }),
    DB.Transaction.findAndCountAll({ where, attributes: defaultAttributes() }),
  ])
}

export const transactionByHash = hash => {
  const where = { txHash: req.params.txHash };
  const attrs = Query.defaultAttributes({ exclude: ['id'] })
  return DB.Transaction.findOne({ where, attrs });
}

export const transactionList = ({ limit, offset } = {}) =>
  DB.Transaction.findAndCountAll({
    attributes: defaultAttributes({ exclude: ['id'] }),
    order: [['txTime', 'DESC']],
    limit,
    offset,
  })

export const transactionsLatest = limit => DB.Transaction.findAll({
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
  DB.Transaction.findAndCountAll({ where: { blockHeight } })

const BLOCK_LIST_ATTRIBUTES = [ 'blockHeight', 'blockHash', 'blockTime' ]

export const blocksLatest = limit => DB.Block.findAndCountAll({
  attributes: BLOCK_LIST_ATTRIBUTES,
  order: [['blockHeight', 'DESC']],
  limit,
})

export const blocksBefore = (before, limit = 15) => DB.Block.findAndCountAll({
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

export const latestBlock = () => DB.Block.max('blockHeight')

export const oldestBlock = () => DB.Block.min('blockHeight')

export const validatorsTop = limit => DB.Validator.findAll({
  attributes: defaultAttributes(),
  order: [['stake', 'DESC']],
  limit,
  offset: 0,
})

export const defaultAttributes = (args = {}) => {
  const attrs = { exclude: ['createdAt', 'updatedAt'] }
  if (args instanceof Array) {
    attrs.include = args
  } else if (args instanceof Object) {
    if (args.include) attrs.include = [...new Set([...attrs.include||[], ...args.include])]
    if (args.exclude) attrs.exclude = [...new Set([...attrs.exclude||[], ...args.exclude])]
  } else {
    throw new Error('defaultAttributes takes Array or Object')
  }
  return attrs
}
