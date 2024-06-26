import db from './db.js'
import * as DB from './db.js'
import { Op } from "sequelize"
import { intoRecord } from '@hackbg/into'

export const totalTransactions = () =>
  DB.Transaction.count()

export const totalVotes = () =>
  DB.Vote.count()

export const totalProposals = () =>
  DB.Proposal.count()

export const totalBlocks = () =>
  DB.Block.count()

export const latestBlock = () =>
  DB.Block.max('blockHeight')

export const oldestBlock = () =>
  DB.Block.min('blockHeight')

export const totalValidators = () =>
  DB.Validator.count()

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

const BLOCK_LIST_ATTRIBUTES = [ 'blockHeight', 'blockHash', 'blockTime' ]

export const blocks = async ({
  before,
  after,
  limit = 15,
  publicKey
}) => {
  const [total, latest, oldest] =
    await Promise.all([totalBlocks(), latestBlock(), oldestBlock()])
  const address =
    publicKey ? await validatorPublicKeyToConsensusAddress(publicKey) : undefined
  if (publicKey && !address) {
    return {
      address: null,
      publicKey,
      ...await intoRecord({ totalBlocks, latestBlock, oldestBlock }),
      count: 0,
      blocks: []
    }
  }
  const { rows, count } =
    await (before ? blocksBefore({ before, limit, address }) :
           after  ? blocksAfter({ after, limit, address }) :
                   blocksLatest({ limit, address }))
  return {
    address,
    publicKey,
    ...await intoRecord({ totalBlocks, latestBlock, oldestBlock }),
    count,
    blocks: await Promise.all(rows.map(block=>DB.Transaction
      .count({ where: { blockHeight: block.blockHeight } })
      .then(transactionCount=>({ ...block.get(), transactionCount }))
    ))
  }
}

//
// select
//   ("rpcResponses"->'block'->'response'#>>'{}')::jsonb->'result'->'block'->'proposer_address'
// from blocks ...
//
// select
//   ("rpcResponses"->'block'->'response'#>>'{}')::jsonb->'result'->'block'->'last_commit'->'signatures'
// from blocks ...
//
  //console.log(req.query)
  //if (req.query.blocks) validator.latestBlocks = await DB.Block.findAll({
    //order: [['blockHeight', 'DESC']],
    //limit: 15,
    //where: { 'blockHeader.proposerAddress': validator.address },
    //attributes: Query.defaultAttributes({ include: ['blockHash', 'blockHeight', 'blockTime'] }),
  //})

export const blocksBefore = ({ before, limit = 15, address }) =>
  DB.Block.findAndCountAll({
    attributes: BLOCK_LIST_ATTRIBUTES,
    order: [['blockHeight', 'DESC']],
    limit,
    where: Object.assign({ blockHeight: { [Op.lte]: before } },
      address ? { 'blockHeader.proposerAddress': address } : {})
  })

export const blocksAfter = ({ after, limit = 15, address }) =>
  DB.Block.findAndCountAll({
    attributes: BLOCK_LIST_ATTRIBUTES,
    order: [['blockHeight', 'ASC']],
    limit,
    where: Object.assign({ blockHeight: { [Op.gte]: after } },
      address ? { 'blockHeader.proposerAddress': address } : {})
  })

export const blocksLatest = ({ limit, address }) =>
  DB.Block.findAndCountAll({
    attributes: BLOCK_LIST_ATTRIBUTES,
    order: [['blockHeight', 'DESC']],
    limit,
    where: Object.assign({},
      address ? { 'blockHeader.proposerAddress': address } : {})
  })

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

export const transactionByHash = txHash => {
  const where = { txHash };
  const attrs = defaultAttributes({ exclude: ['id'] })
  return DB.Transaction.findOne({ where, attrs });
}

export const transactionList = ({ limit, offset } = {}) =>
  DB.Transaction.findAndCountAll({
    attributes: defaultAttributes({ exclude: ['id'] }),
    order: [['txTime', 'DESC']],
    limit,
    offset,
  })

export const transactionsLatest = ({ limit = 15 } = {}) =>
  DB.Transaction.findAll({
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

export const validatorsTop = ({ limit = 15 } = {}) =>
  DB.Validator.findAll({
    attributes: defaultAttributes(),
    order: [['stake', 'DESC']],
    limit,
    offset: 0,
  })

export const validatorPublicKeyToConsensusAddress = (publicKey = '') => DB.Validator.findOne({
  attributes: { include: [ 'address' ] },
  where: { publicKey }
}).then(validator=>validator.address)

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
