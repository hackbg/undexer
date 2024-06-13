import express from 'express';
import { Console, bold, colors } from '@hackbg/logs';
import { Op } from 'sequelize';
import * as DB from './db.js';
import * as RPC from './rpc.js';
import { CHAIN_ID, DEFAULT_PAGE_LIMIT, DEFAULT_PAGE_OFFSET } from './config.js';

const NOT_IMPLEMENTED = (req, res) => { throw new Error('not implemented') }

export const routes = [
  ['/',                           dbOverview],
  ['/blocks',                     dbBlocks],
  ['/block/latest',               dbLatestBlock],
  ['/block/:height',              dbBlockByHeight],
  ['/block/hash/:hash',           dbBlockByHash],
  ['/block',                      NOT_IMPLEMENTED],
  ['/txs',                        dbTransactions],
  ['/tx/:txHash',                 dbTransactionByHash],
  ['/validator-addresses',        dbValidatorAddresses],
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
    offset: Math.max(
      0, req.query.offset ? Number(req.query.offset) : DEFAULT_PAGE_OFFSET
    ),
    limit: Math.min(
      100, req.query.limit ? Number(req.query.limit) : DEFAULT_PAGE_LIMIT
    ),
  }
}

export async function dbOverview (req, res) {
  const timestamp = new Date().toISOString()
  const [
    totalBlocks,
    latestBlock,
    oldestBlock,
    latestBlocks,
    totalTransactions,
    latestTransactions,
    totalValidators,
    topValidators,
    totalProposals,
    totalVotes
  ] = await Promise.all([
    DB.totalBlocks(),
    DB.latestBlock(),
    DB.oldestBlock(),
    DB.latestBlocks(10),
    DB.totalTransactions(),
    DB.latestTransactions(10),
    DB.totalValidators(),
    DB.topValidators(10),
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

export async function dbBlocks (req, res) {
  const { limit, offset } = pagination(req)
  const [
    totalBlocks,
    latestBlock,
    oldestBlock,
    { rows, count }
  ] = await Promise.all([
    await DB.totalBlocks(),
    DB.latestBlock(),
    DB.oldestBlock(),
    DB.Block.findAndCountAll({
      order: [['blockHeight', 'DESC']],
      limit,
      offset,
      attributes: [
        'blockHeight',
        'blockHash',
        'blockTime'
      ],
    })
  ])
  const blocks = await Promise.all(rows.map(block=>
    DB.Transaction
      .count({ where: { blockHeight: block.blockHeight } })
      .then(transactionCount=>({ ...block.dataValues, transactionCount }))))
  res.status(200).send({
    totalBlocks,
    latestBlock,
    oldestBlock,
    count,
    blocks,
  });
}

export async function dbLatestBlock (req, res) {
  //const latestBlock = await Block.max('height');
  const latestBlock = await Block.findAll({
    order: [['blockHeight', 'DESC']],
    limit: 1,
    attributes: ['blockHeight', 'blockHash', 'blockHeader'],
  })
  if (latestBlock.length === 0) {
    return res.status(404).send({ error: 'Block not found' });
  }
  const { height, hash, header } = latestBlock[0];
  return res.status(200).send({ height, hash, header });
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
    order: [['timestamp', 'DESC']],
    limit,
    offset,
    attributes: { exclude: ['id', 'createdAt', 'updatedAt'], },
  })
  res.status(200).send({ count, txs: rows })
}

export async function dbTransactionByHash (req, res) {
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
  if (await DB.Validator.count() === 0) {
    return res.status(404).send({ error: 'Validator not found' });
  }
  const { rows, count } = await DB.Validator.findAndCountAll({
    order: [['stake', 'DESC']],
    limit,
    offset,
    attributes: { exclude: ['id', 'createdAt', 'updatedAt'], },
  });
  res.status(200).send({ count, validators: rows })
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
  const proposals = rows.map((r) => {
    const { contentJSON, ...proposal } = r.get()
    return { ...proposal, ...JSON.parse(contentJSON) }
  })
  res.status(200).send({ count, proposals })
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
  if(result === null){
    return res.status(404).send({ error: 'Proposal not found' });
  }
  const { contentJSON, ...proposal } = result.get();
  res.status(200).send({ ...proposal, ...JSON.parse(contentJSON) });
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
