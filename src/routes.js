import express from 'express';
import { Console, bold, colors } from '@hackbg/logs';
import { Op } from 'sequelize';
import * as DB from './db.js';
import * as RPC from './rpc.js';
import { CHAIN_ID, DEFAULT_PAGE_LIMIT, DEFAULT_PAGE_OFFSET } from './config.js';

const NOT_IMPLEMENTED = (req, res) => { throw new Error('not implemented') }

export const routes = [
  ['/',                           dbOverview],
  ['/status',                     dbStatus],
  ['/search',                     dbSearch],

  ['/blocks',                     dbBlocks],
  ['/block',                      dbBlock],

  ['/txs',                        dbTransactions],
  ['/tx/:txHash',                 dbTransaction],

  ['/validators',                 dbValidators],
  ['/validator/:hash',            dbValidatorByHash],
  ['/validator-states',           dbValidatorStates],
  ['/validator/uptime/:address',  dbValidatorUptime],

  ['/proposals',                  dbProposals],
  ['/proposals/stats',            dbProposalStats],
  ['/proposal/:id',               dbProposal],
  ['/proposal/votes/:proposalId', dbProposalVotes],

  ['/transfers/from/:address',    dbTransfersFrom],
  ['/transfers/to/:address',      dbTransfersTo],
  ['/transfers/by/:address',      dbTransfersBy],

  //['/height',                     RPC.rpcHeight],
  ['/epoch',                      RPC.rpcEpoch],
  ['/total-staked',               RPC.rpcTotalStaked],
  [`/parameters`,                 RPC.rpcProtocolParameters],
  [`/parameters/staking`,         RPC.rpcStakingParameters],
  [`/parameters/governance`,      RPC.rpcGovernanceParameters],
  [`/parameters/pgf`,             RPC.rpcPGFParameters],
]

export default addRoutes(express.Router());

export function addRoutes (router) {
  for (const [route, handler] of routes) {
    router.get(route, withConsole(handler))
  }
  return router
}

export function withConsole (handler) {
  return async function withConsoleHandler (req, res) {
    const t0 = performance.now();
    const console = new Console(`${(t0/1000).toFixed(3)}: ${req.path}`)
    try {
      console.info(bold('GET'), req.query)
      await handler(req, res)
      const t1 = performance.now();
      console.log(colors.green(bold(`Done in ${((t1-t0)/1000).toFixed(3)}s`)))
    } catch (e) {
      const t1 = performance.now();
      console.error(
        colors.red(bold(`Failed in ${((t1-t0)/1000).toFixed(3)}s:`)),
        e.message, '\n'+e.stack.split('\n').slice(1).join('\n')
      )
      res.status(500).send('Error')
    }
  }
}

// Read limit/offset from query parameters and apply defaults
function pagination (req) {
  return {
    offset: Math.max(0,   req.query.offset ? Number(req.query.offset) : DEFAULT_PAGE_OFFSET),
    limit:  Math.min(100, req.query.limit  ? Number(req.query.limit)  : DEFAULT_PAGE_LIMIT),
  }
}

// Read limit/before/after from query parameters and apply defaults
function relativePagination (req) {
  return {
    before: Math.max(0,   req.query.before || 0),
    after:  Math.max(0,   req.query.after  || 0),
    limit:  Math.min(100, req.query.limit ? Number(req.query.limit) : DEFAULT_PAGE_LIMIT),
  }
}

export async function dbOverview (req, res) {
  const timestamp = new Date().toISOString()
  const [
    latestBlock,
    oldestBlock,
    { count: totalBlocks, rows: latestBlocks },
    totalTransactions,
    latestTransactions,
    totalValidators,
    topValidators,
    totalProposals,
    totalVotes
  ] = await Promise.all([
    DB.latestBlock(),
    DB.oldestBlock(),
    DB.blocksLatest(10),
    DB.totalTransactions(),
    DB.transactionsLatest(10),
    DB.totalValidators(),
    DB.validatorsTop(10),
    DB.totalProposals(),
    DB.totalVotes()
  ])
  res.status(200).send({
    timestamp,
    chainId: CHAIN_ID,

    totalBlocks,
    oldestBlock,
    latestBlock,
    latestBlocks,

    totalTransactions,
    latestTransactions,

    totalValidators,
    topValidators,

    totalProposals,
    totalVotes,
  })
}

export async function dbStatus (req, res) {
  const timestamp = new Date().toISOString()
  const [
    totalBlocks,
    latestBlock,
    oldestBlock,
    totalTransactions,
    totalValidators,
    totalProposals,
    totalVotes
  ] = await Promise.all([
    DB.totalBlocks(),
    DB.latestBlock(),
    DB.oldestBlock(),
    DB.totalTransactions(),
    DB.totalValidators(),
    DB.totalProposals(),
    DB.totalVotes()
  ])
  res.status(200).send({
    timestamp,
    chainId: CHAIN_ID,
    totalBlocks,
    oldestBlock,
    latestBlock,
    totalTransactions,
    totalValidators,
    totalProposals,
    totalVotes,
  })
}

export async function dbSearch (req, res) {
  const q = String(req.query.q||'').trim()
  const [ blocks, transactions, proposals ] = await Promise.all([
    DB.searchBlocks(req.query.q),
    DB.searchTransactions(req.query.q),
    DB.searchProposals(req.query.q),
  ])
  res.status(200).send({
    blocks,
    transactions,
    proposals,
  })
}

export async function dbBlocks (req, res) {
  const { limit, before, after } = relativePagination(req)
  if (before && after) {
    res.status(400).send({ error: "Don't use before and after together" })
    return
  }
  const [ totalBlocks, latestBlock, oldestBlock, { rows, count } ] = await Promise.all([
    DB.totalBlocks(),
    DB.latestBlock(),
    DB.oldestBlock(),
    before ? DB.blocksBefore(before, limit) :
    after  ? DB.blocksAfter(after, limit) :
             DB.blocksLatest(limit)
  ])
  const blocks = await Promise.all(rows.map(block=>DB.Transaction
    .count({ where: { blockHeight: block.blockHeight } })
    .then(transactionCount=>({ ...block.get(), transactionCount }))
  ))
  res.status(200).send({
    totalBlocks,
    latestBlock,
    oldestBlock,
    count,
    blocks,
  });
}

const defaultAttributes = (args = {}) => {
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

export async function dbBlock (req, res) {
  const attrs = defaultAttributes(['blockHeight', 'blockHash', 'blockHeader'])
  const { height, hash } = req.query
  let block, transactionCount, transactions
  if (height || hash) {
    const where = {}
    if (height) where['blockHeight'] = height
    if (hash) where['blockHash'] = hash
    block = await DB.Block.findOne({attributes: attrs, where})
  } else {
    const order = [['blockHeight', 'DESC']]
    block = await DB.Block.findOne({attributes: attrs, order})
  }
  if (!block) return res.status(404).send({ error: 'Block not found' });
  const { count, rows } = await DB.transactionsAtHeight(block.blockHeight)
  return res.status(200).send({
    blockHeight:      block.blockHeight,
    blockHash:        block.blockHash,
    blockHeader:      block.blockHeader,
    blockTime:        block.blockTime,
    transactionCount: count,
    transactions:     rows.map(row=>row.toJSON()),
  })
}

export async function dbBlockByHeight (req, res) {
  const blockHeight = req.params.height
  const where = { blockHeight }
  const [block, { count, rows }] = await Promise.all([
    DB.Block.findOne({
      where, attributes: defaultAttributes()
    }),
    DB.Transaction.findAndCountAll({
      where, attributes: defaultAttributes()
    }),
  ])
  if (block === null) return res.status(404).send({ error: 'Block not found' });
  res.status(200).send({
    blockHash:        block.blockHash,
    blockHeader:      block.blockHeader,
    blockHeight:      block.blockHeight,
    blockTime:        block.blockTime,
    transactionCount: count,
    transactions:     rows,
  });
}

export async function dbBlockByHash (req, res) {
  const where = { id: req.params.hash }
  const block = await DB.Block.findOne({ where, attributes: defaultAttributes() })
  if (block === null) return res.status(404).send({ error: 'Block not found' });
  res.status(200).send(block);
}

export async function dbBlocksByValidator (req, res) {
  const where = { id: req.params.hash }
  const attributes = defaultAttributes({ exclude: ['transactionId'] })
  const block = await DB.Block.findOne({ where, attributes })
  if (block === null) return res.status(404).send({ error: 'Block not found' });
  res.status(200).send(block);
}

export async function dbTransactions (req, res) {
  const { limit, offset } = pagination(req)
  const order = [['txTime', 'DESC']]
  const attrs = defaultAttributes({ exclude: ['id'] })
  const { rows, count } = await DB.Transaction.findAndCountAll({
    order, limit, offset, attributes: attrs
  })
  res.status(200).send({ count, txs: rows })
}

export async function dbTransaction (req, res) {
  const where = { txHash: req.params.txHash };
  const attrs = defaultAttributes({ exclude: ['id'] })
  const tx = await DB.Transaction.findOne({ where, attrs });
  if (tx === null) return res.status(404).send({ error: 'Transaction not found' });
  res.status(200).send(tx);
}

export async function dbValidators (req, res) {
  if (await DB.Validator.count() === 0) {
    return res.status(404).send({ error: 'Validator not found' });
  }
  const { limit, offset } = pagination(req)
  const { state } = req.query
  const where = {}
  if (state) where['state.state'] = state
  const order = [['stake', 'DESC']]
  const attrs = defaultAttributes({ exclude: ['id'] })
  const { count, rows: validators } = await DB.Validator.findAndCountAll({
    where, order, limit, offset, attributes: attrs
  });
  const result = { count, validators: validators.map(v=>v.toJSON()) };
  res.status(200).send(result);
}

export async function dbValidatorStates (req, res) {
  const states = {}
  for (const validator of await DB.Validator.findAll({
    attributes: { include: [ 'state' ] }
  })) {
    states[validator?.state?.state] ??= 0
    states[validator?.state?.state] ++
  }
  res.status(200).send(states)
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

export async function dbValidatorByHash (req, res) {
  const where = { address: req.params.hash }
  const attrs = defaultAttributes({ exclude: ['id'] })
  let validator = await DB.Validator.findOne({ where, attributes: attrs });
  if (validator === null) return res.status(404).send({ error: 'Validator not found' });
  validator = { ...validator.get() }
  validator.metadata ??= {}
  console.log(req.query)
  if (req.query.blocks) validator.latestBlocks = await DB.Block.findAll({
    order: [['blockHeight', 'DESC']],
    limit: 15,
    where: { 'blockHeader.proposerAddress': validator.address },
    attributes: defaultAttributes({ include: ['blockHash', 'blockHeight', 'blockTime'] }),
  })
  res.status(200).send(validator);
}

export async function dbValidatorUptime (req, res) {
  if (await DB.Validator.count() === 0) {
    return res.status(404).send({ error: 'Validator not found' });
  }
  const address = req.params.address;
  const blocks = await DB.Block.findAll({
    order: [['blockHeight', 'DESC']],
    limit: 100,
    attributes: ['responses', 'blockHeight'],
  });
  const currentHeight = blocks[0].height;
  const countedBlocks = blocks.length;
  const uptime = blocks
    .map((b) => {
      const blockResponse = JSON.parse(b.responses.block.response)
      return blockResponse.result.block.last_commit.signatures.map(
        (x) => x.validator_address,
      );
    })
    .flat(1)
    .filter((x) => x == address).length;
  res.status(200).send({ uptime, currentHeight, countedBlocks });
}

export async function dbProposals (req, res) {
  const { limit, offset } = pagination(req)
  const orderBy = req.query.orderBy ?? 'id';
  const orderDirection = req.query.orderDirection ?? 'DESC'
  let where = {}
  const { proposalType, status, result } = req.query
  if (proposalType) where.proposalType = proposalType
  if (status) where.status = status
  if (result) where.result = result
  const order = [[orderBy, orderDirection]]
  const attrs = defaultAttributes()
  const { rows, count } = await DB.Proposal.findAndCountAll({
    order, limit, offset, where, attributes: attrs
  });
  res.status(200).send({
    count, proposals: rows
  })
}

export async function dbProposalStats (req, res) {
  const all      = (await DB.Proposal.findAll()).length
  const ongoing  = (await DB.Proposal.findAll({ where: { status: 'ongoing' } })).length
  const upcoming = (await DB.Proposal.findAll({ where: { status: 'upcoming' } })).length
  const finished = (await DB.Proposal.findAll({ where: { status: 'finished' } })).length
  const passed   = (await DB.Proposal.findAll({ where: { result: 'passed' } })).length
  const rejected = (await DB.Proposal.findAll({ where: { result: 'rejected' } })).length
  res.status(200).send({ all, ongoing, upcoming, finished, passed, rejected })
}

export async function dbProposal (req, res) {
  const id = req.params.id
  const result = await DB.Proposal.findOne({ where: { id }, attributes: defaultAttributes(), });
  return result
    ? res.status(200).send(result.get())
    : res.status(404).send({ error: 'Proposal not found' });
}

export async function dbProposalVotes (req, res) {
  const { limit, offset } = pagination(req);
  const where = { proposalId: req.params.proposalId };
  const attrs = defaultAttributes();
  const { count, rows } = await DB.Vote.findAndCountAll({
    limit, offset, where, attributes: attrs,
  });
  res.status(200).send({ count, votes: rows });
}

export async function dbTransfersFrom (req, res) {
  const { limit, offset } = pagination(req)
  throw new Error('not implemented')
  //const { count, rows } = await Content.Transfer.findAndCountAll({
    //limit,
    //offset,
    //where: { source: req.params.address, },
    //attributes: { exclude: ['createdAt', 'updatedAt'], },
  //});
  res.status(200).send({ count, transfers: rows });
}

export async function dbTransfersTo (req, res) {
  const { limit, offset } = pagination(req)
  throw new Error('not implemented')
  //const { count, rows } = await Content.Transfer.findAndCountAll({
    //limit,
    //offset,
    //where: { target: req.params.address, },
    //attributes: { exclude: ['createdAt', 'updatedAt'], },
  //});
  res.status(200).send({ count, transfers: rows });
}

export async function dbTransfersBy (req, res) {
  const { limit, offset } = pagination(req)
  throw new Error('not implemented')
  //const { count, rows } = await Content.Transfer.findAndCountAll({
    //limit,
    //offset,
    //where: {
      //[Op.or]: [
        //{ source: req.params.address, },
        //{ target: req.params.address, },
      //]
    //},
    //attributes: { exclude: ['createdAt', 'updatedAt'], },
  //});
  res.status(200).send({ count, transfers: rows });
}

export const callRoute = (route, req = {}) =>
  new Promise(async resolve=>
    await route(req, {
      status () { return this },
      send (data) { resolve(data) }
    }))
