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
  ['/blocks',                     dbBlocks],
  ['/block',                      dbBlock],
  ['/txs',                        dbTransactions],
  ['/tx/:txHash',                 dbTransaction],
  ['/validator-addresses',        dbValidatorAddresses],
  ['/validator-states',           dbValidatorStates],
  ['/validators',                 dbValidators],
  ['/validators/:state',          dbValidatorsByState],
  ['/validator/:hash',            dbValidatorByHash],
  ['/validator/uptime/:address',  dbValidatorUptime],
  ['/proposals',                  dbProposals],
  ['/proposals/stats',            dbProposalStats],
  ['/proposal/:id',               dbProposal],
  ['/proposal/votes/:proposalId', dbProposalVotes],
  ['/transfers/from/:address',    dbTransfersFrom],
  ['/transfers/to/:address',      dbTransfersTo],
  ['/transfers/by/:address',      dbTransfersBy],

  //['/height',                     RPC.rpcHeight],
  ['/epoch',                      RPC.rpcEpochAndFirstBlock],
  ['/total-staked',               RPC.rpcTotalStaked],
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

export async function dbBlocks (req, res) {
  const { limit, before, after } = relativePagination(req)
  if (before && after) {
    res.status(400).send({ error: "Don't use before and after together" })
    return
  }
  const [ totalBlocks, latestBlock, oldestBlock, { rows, count } ] = await Promise.all([
    await DB.totalBlocks(),
    DB.latestBlock(),
    DB.oldestBlock(),
    before ? DB.blocksBefore(before, limit) :
    after  ? DB.blocksAfter(after, limit) :
             DB.blocksLatest(limit)
  ])
  const blocks = await Promise.all(rows.map(block=>
    DB.Transaction
      .count({ where: { blockHeight: block.blockHeight } })
      .then(transactionCount=>({ ...block.get(), transactionCount }))))
  res.status(200).send({
    totalBlocks,
    latestBlock,
    oldestBlock,
    count,
    blocks,
  });
}

export async function dbBlock (req, res) {
  const attributes = {
    include: ['blockHeight', 'blockHash', 'blockHeader'],
    exclude: ['createdAt', 'updatedAt']
  }
  const { height, hash } = req.query
  let block, transactionCount, transactions
  if (height || hash) {
    const where = {}
    if (height) {
      where['blockHeight'] = height
    }
    if (hash) {
      where['blockHash'] = hash
    }
    block = await DB.Block.findOne({attributes, where})
  } else {
    block = await DB.Block.findOne({attributes, order: [['blockHeight', 'DESC']]})
  }
  if (!block) {
    return res.status(404).send({ error: 'Block not found' });
  }
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
  const [block, { count, rows }] = await Promise.all([
    DB.Block.findOne({
      where: { blockHeight, },
      attributes: { exclude: ['createdAt', 'updatedAt'] },
    }),
    DB.Transaction.findAndCountAll({
      where: { blockHeight }
    }),
  ])
  if (block === null) {
    res.status(404).send({ error: 'Block not found' });
    return;
  }
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
  const block = await DB.Block.findOne({
    where: { id: req.params.hash, },
    attributes: { exclude: ['transactionId', 'createdAt', 'updatedAt'] },
    //include: [{
      //model: Transaction,
      //attributes: { exclude: ['id', 'createdAt', 'updatedAt', 'chainId'] },
    //}],
  });
  if (block === null) {
    res.status(404).send({ error: 'Block not found' });
    return;
  }
  res.status(200).send(block);
}

export async function dbTransactions (req, res) {
  const { limit, offset } = pagination(req)
  const { rows, count } = await DB.Transaction.findAndCountAll({
    order: [['txTime', 'DESC']],
    limit,
    offset,
    attributes: { exclude: ['id', 'createdAt', 'updatedAt'], },
  })
  res.status(200).send({ count, txs: rows })
}

export async function dbTransaction (req, res) {
  const tx = await DB.Transaction.findOne({
    where: { txHash: req.params.txHash },
    attributes: { exclude: ['id', 'createdAt', 'updatedAt'], },
  });
  if (tx === null) {
    return res.status(404).send({ error: 'Transaction not found' });
  }
  res.status(200).send(tx);
}

export async function dbValidatorAddresses (req, res) {
  const { rows } = await DB.Validator.findAndCountAll({
    order: [['stake', 'DESC']],
    attributes: [ 'address', 'namadaAddress' ],
  });
  res.status(200).send(rows)
}

export async function dbValidators (req, res) {
  const { limit, offset } = pagination(req)
  const { state } = req.query
  if (await DB.Validator.count() === 0) {
    return res.status(404).send({ error: 'Validator not found' });
  }
  const where = {}
  if (state) where['state.state'] = state
  const { rows: validators, count } = await DB.Validator.findAndCountAll({
    order: [['stake', 'DESC']], limit, offset,
    attributes: { exclude: ['id', 'createdAt', 'updatedAt'], },
  });
  const result = { count, validators: validators.map(v=>v.toJSON()) };
  console.log({where}, result);
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

export async function dbValidatorsByState (req, res) {
  if (await DB.Validator.count() === 0) {
    return res.status(404).send({ error: 'No validators' });
  }
  const { limit, offset } = pagination(req)
  const { rows, count } = await DB.Validator.findAndCountAll({
    where: { state: DB.VALIDATOR_STATES[req.params.state] },
    order: [['stake', 'DESC']],
    limit,
    offset,
    attributes: { exclude: ['id', 'createdAt', 'updatedAt'], },
  });
  res.status(200).send({ count, validators: rows })
}

export async function dbValidatorByHash (req, res) {
  const validator = await DB.Validator.findOne({
    where: { address: req.params.hash },
    attributes: { exclude: ['id', 'createdAt', 'updatedAt'], },
  });
  if (validator === null) {
    return res.status(404).send({ error: 'Validator not found' });
  }
  validator.metadata ??= {}
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
  if (proposalType) {
    where.proposalType = proposalType
  }
  if (status) {
    where.status = status
  }
  if (result) {
    where.result = result
  }
  const { rows, count } = await DB.Proposal.findAndCountAll({
    order: [[orderBy, orderDirection]],
    limit,
    offset,
    where,
    attributes: {
      exclude: ['createdAt', 'updatedAt'],
    },
  });
  res.status(200).send({ count, proposals: rows })
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
  const result = await DB.Proposal.findOne({
    where: { id },
    attributes: { exclude: ['createdAt', 'updatedAt'], },
  });
  return result
    ? res.status(200).send(result.get())
    : res.status(404).send({ error: 'Proposal not found' });
}

export async function dbProposalVotes (req, res) {
  const { limit, offset } = pagination(req)
  const { count, rows } = await DB.Voter.findAndCountAll({
    limit,
    offset,
    where: { proposalId: req.params.proposalId, },
    attributes: { exclude: ['createdAt', 'updatedAt'], },
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
