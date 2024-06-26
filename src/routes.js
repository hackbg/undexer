import express from 'express';
import { Console, bold, colors } from '@hackbg/logs';
import { Op } from 'sequelize';
import * as DB from './db.js';
import * as RPC from './rpc.js';
import * as Query from './query.js';
import { CHAIN_ID, DEFAULT_PAGE_LIMIT, DEFAULT_PAGE_OFFSET } from './config.js';

const NOT_IMPLEMENTED = (req, res) => { throw new Error('not implemented') }

const chainId = CHAIN_ID

export const routes = [

  ['/', async function dbOverview (req, res) {
    const timestamp = new Date().toISOString()
    const overview = await Query.overview()
    res.status(200).send({ timestamp, chainId, ...overview })
  }],

  ['/epoch',                 RPC.rpcEpoch],
  ['/total-staked',          RPC.rpcTotalStaked],
  [`/parameters`,            RPC.rpcProtocolParameters],
  [`/parameters/staking`,    RPC.rpcStakingParameters],
  [`/parameters/governance`, RPC.rpcGovernanceParameters],
  [`/parameters/pgf`,        RPC.rpcPGFParameters],

  ['/status', async function dbStatus (req, res) {
    const timestamp = new Date().toISOString()
    const status = await Query.status()
    res.status(200).send({ timestamp, chainId, ...status })
  }],

  ['/search', async function dbSearch (req, res) {
    const timestamp = new Date().toISOString()
    const { blocks, transactions, proposals } = await Query.search(req.query.q)
    res.status(200).send({ timestamp, chainId, blocks, transactions, proposals, })
  }],

  ['/blocks', async function dbBlocks (req, res) {
    const timestamp = new Date().toISOString()
    const { limit, before, after } = relativePagination(req)
    if (before && after) {
      return res.status(400).send({ error: "Don't use before and after together" })
    }
    const results = await Query.blocks({
      before,
      after,
      limit,
      publicKey: req?.query?.publicKey
    })
    res.status(200).send({ timestamp, chainId, ...results })
  }],

  ['/block', async function dbBlock (req, res) {
    const timestamp = new Date().toISOString()
    const attrs = Query.defaultAttributes(['blockHeight', 'blockHash', 'blockHeader'])
    const { height, hash } = req.query
    const block = await Query.block({ height, hash })
    if (!block) {
      return res.status(404).send({ error: 'Block not found' })
    }
    const transactions = await Query.transactionsAtHeight(block.blockHeight)
    return res.status(200).send({
      timestamp,
      chainId,
      blockHeight:      block.blockHeight,
      blockHash:        block.blockHash,
      blockHeader:      block.blockHeader,
      blockTime:        block.blockTime,
      transactionCount: transactions.scount,
      transactions:     transactions.rows.map(row=>row.toJSON()),
    })
  }],

  ['/txs', async function dbTransactions (req, res) {
    const timestamp = new Date().toISOString()
    const { rows, count } = await Query.transactionList(pagination(req))
    res.status(200).send({ timestamp, chainId, count, txs: rows })
  }],

  ['/tx/:txHash', async function dbTransaction (req, res) {
    const tx = await Query.transactionByHash(req.params.txHash);
    if (tx === null) return res.status(404).send({ error: 'Transaction not found' });
    res.status(200).send(tx);
  }],

  ['/validators', async function dbValidators (req, res) {
    const { limit, offset } = pagination(req)
    const { state } = req.query
    const where = {}
    if (state) where['state.state'] = state
    const order = [['stake', 'DESC']]
    const attrs = Query.defaultAttributes({ exclude: ['id'] })
    const { count, rows: validators } = await DB.Validator.findAndCountAll({
      where, order, limit, offset, attributes: attrs
    });
    const result = { count, validators: validators.map(v=>v.toJSON()) };
    res.status(200).send(result);
  }],

  ['/validators/states', async function dbValidatorStates (req, res) {
    const states = {}
    for (const validator of await DB.Validator.findAll({
      attributes: { include: [ 'state' ] }
    })) {
      states[validator?.state?.state] ??= 0
      states[validator?.state?.state] ++
    }
    res.status(200).send(states)
  }],

  ['/validator', async function dbValidatorByHash (req, res) {
    const where = { publicKey: req.query.publicKey }
    const attrs = Query.defaultAttributes({ exclude: ['id'] })
    let validator = await DB.Validator.findOne({ where, attributes: attrs });
    if (validator === null) return res.status(404).send({ error: 'Validator not found' });
    validator = { ...validator.get() }
    validator.metadata ??= {}
    res.status(200).send(validator);
  }],

  //['/validator/:hash/blocks',     dbBlocksByProposer],

  ['/validator/uptime', async function dbValidatorUptime (req, res) {
    const address = req.query.address;
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
  }],

  ['/proposals', async function dbProposals (req, res) {
    const { limit, offset } = pagination(req)
    const orderBy = req.query.orderBy ?? 'id';
    const orderDirection = req.query.orderDirection ?? 'DESC'
    let where = {}
    const { proposalType, status, result } = req.query
    if (proposalType) where.proposalType = proposalType
    if (status) where.status = status
    if (result) where.result = result
    const order = [[orderBy, orderDirection]]
    const attrs = Query.defaultAttributes()
    const { rows, count } = await DB.Proposal.findAndCountAll({
      order, limit, offset, where, attributes: attrs
    });
    res.status(200).send({
      count, proposals: rows
    })
  }],

  ['/proposals/stats', async function dbProposalStats (req, res) {
    const [all, ongoing, upcoming, finished, passed, rejected] = await Promise.all([
      DB.Proposal.count(),
      DB.Proposal.count({ where: { 'metadata.status': 'ongoing' } }),
      DB.Proposal.count({ where: { 'metadata.status': 'upcoming' } }),
      DB.Proposal.count({ where: { 'metadata.status': 'finished' } }),
      DB.Proposal.count({ where: { 'result.result': 'Passed' } }),
      DB.Proposal.count({ where: { 'result.result': 'Rejected' } }),
    ])
    res.status(200).send({ all, ongoing, upcoming, finished, passed, rejected })
  }],

  ['/proposal/:id', async function dbProposal (req, res) {
    const id = req.params.id
    const result = await DB.Proposal.findOne({ where: { id }, attributes: Query.defaultAttributes(), });
    return result
      ? res.status(200).send(result.get())
      : res.status(404).send({ error: 'Proposal not found' });
  }],

  ['/proposal/votes/:proposalId', async function dbProposalVotes (req, res) {
    const { limit, offset } = pagination(req);
    const where = { proposalId: req.params.proposalId };
    const attrs = Query.defaultAttributes();
    const { count, rows } = await DB.Vote.findAndCountAll({
      limit, offset, where, attributes: attrs,
    });
    res.status(200).send({ count, votes: rows });
  }],

  ['/transfers/from/:address', async function dbTransfersFrom (req, res) {
    const { limit, offset } = pagination(req)
    throw new Error('not implemented')
    //const { count, rows } = await Content.Transfer.findAndCountAll({
      //limit,
      //offset,
      //where: { source: req.params.address, },
      //attributes: { exclude: ['createdAt', 'updatedAt'], },
    //});
    res.status(200).send({ count, transfers: rows });
  }],
  ['/transfers/to/:address', async function dbTransfersTo (req, res) {
    const { limit, offset } = pagination(req)
    throw new Error('not implemented')
    //const { count, rows } = await Content.Transfer.findAndCountAll({
      //limit,
      //offset,
      //where: { target: req.params.address, },
      //attributes: { exclude: ['createdAt', 'updatedAt'], },
    //});
    res.status(200).send({ count, transfers: rows });
  }],
  ['/transfers/by/:address', async function dbTransfersBy (req, res) {
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
  }],

  //['/height',                     RPC.rpcHeight],
]

export default addRoutes(express.Router());

export function addRoutes (router) {
  for (const [route, handler] of routes) {
    router.get(route, withConsole(handler))
  }
  return router
}

export const callRoute = (route, req = {}) =>
  new Promise(async resolve=>
    await route(req, {
      status () { return this },
      send (data) { resolve(data) }
    }))

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
