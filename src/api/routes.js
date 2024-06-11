import express from 'express';
import { Console, bold, colors } from '@hackbg/logs';
import { Op } from 'sequelize';
import { Block, Transaction, Validator, Proposal, Voter, } from '../db.js'
import { getRPC } from '../rpc.js';

const DEFAULT_PAGE_LIMIT = 25
const DEFAULT_PAGE_OFFSET = 0

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

const pagination = req => {
  const limit = req.query.limit ? Number(req.query.limit) : DEFAULT_PAGE_LIMIT
  const offset = req.query.offset ? Number(req.query.offset) : DEFAULT_PAGE_OFFSET
  return { limit, offset }
}

export const getLatestBlock = async (req, res) => {
  const latestBlock = await Block.max('height');
  if (latestBlock === null) {
    return res.status(404).send({ error: 'Block not found' });
  }
  return res.status(200).send(latestBlock.toString());
}

export const getBlocks = async (req, res) => {
  const { limit, offset } = pagination(req)
  if (await Block.count() === 0) {
    return res.status(404).send({ error: 'No blocks found' });
  }
  const { rows, count } = await Block.findAndCountAll({
    order: [['height', 'DESC']],
    limit,
    offset,
    attributes: ['height', 'id', 'header'],
  });
  const blocks = await Promise.all(
    rows.map(async (block) => {
      const txs = await Transaction.findAll({
        where: { blockHeight: block.height },
        attributes: ['txId'],
      });
      return { ...block.get(), txs };
    }),
  );
  res.status(200).send({ count, blocks });
}

export const getBlockByHeight = async (req, res) => {
  const block = await Block.findOne({
    where: { height: req.params.height, },
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

export const getBlockByHash = async (req, res) => {
  const block = await Block.findOne({
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

export const getTransactions = async (req, res) => {
  const { limit, offset } = pagination(req)
  if (await Transaction.count() === 0) {
    return res.status(404).send({ error: 'No transactions found' });
  }
  const { rows, count } = await Transaction.findAndCountAll({
    order: [['timestamp', 'DESC']],
    limit,
    offset,
    attributes: { exclude: ['id', 'createdAt', 'updatedAt'], },
  })
  res.status(200).send({ count, txs: rows })
}

export const getTransactionByHash = async (req, res) => {
  const tx = await Transaction.findOne({
    where: { txId: req.params.txHash },
    attributes: { exclude: ['id', 'createdAt', 'updatedAt'], },
  });
  if (tx === null) {
    return res.status(404).send({ error: 'Transaction not found' });
  }
  res.status(200).send(tx);
}

export const getValidators = async (req, res) => {
  const { limit, offset } = pagination(req)
  if (await Validator.count() === 0) {
    return res.status(404).send({ error: 'Validator not found' });
  }
  const { rows, count } = await Validator.findAndCountAll({
    order: [['stake', 'DESC']],
    limit,
    offset,
    attributes: { exclude: ['id', 'createdAt', 'updatedAt'], },
  });
  res.status(200).send({ count, validators: rows })
}

export const getValidatorsByState = async (req, res) => {
  if(await Validator.count() === 0){
    return res.status(404).send({ error: 'Validator not found' });
  }
  const { limit, offset } = pagination(req)
  const state = req.params.state
  const { rows, count } = await Validator.findAndCountAll({
    where: { state },
    order: [['stake', 'DESC']],
    limit,
    offset,
    attributes: { exclude: ['id', 'createdAt', 'updatedAt'], },
  });
  res.status(200).send({ count, validators: rows })
}

export const getValidatorByHash = async (req, res) => {
  const hash = req.params.hash
  const validator = await Validator.findOne({
    where: { validator: hash },
    attributes: { exclude: ['id', 'createdAt', 'updatedAt'], },
  });
  if (validator === null) {
    return res.status(404).send({ error: 'Validator not found' });
  }
  res.status(200).send(validator);
}

export const getValidatorUptime = async (req, res) => {
  if (await Validator.count() === 0) {
    return res.status(404).send({ error: 'Validator not found' });
  }
  const address = req.params.address;
  const blocks = await Block.findAll({
    order: [['height', 'DESC']],
    limit: 100,
    attributes: ['rpcResponse', 'height'],
  });
  const currentHeight = blocks[0].height;
  const countedBlocks = blocks.length;
  const uptime = blocks
    .map((b) => {
      return JSON.parse(b.rpcResponse).result.block.last_commit.signatures.map(
        (x) => x.validator_address,
      );
    })
    .flat(1)
    .filter((x) => x == address).length;
  res.status(200).send({ uptime, currentHeight, countedBlocks });
}

export const getProposals = async (req, res) => {
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
  const { rows, count } = await Proposal.findAndCountAll({
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

export const getProposalStats = async (req, res) => {
  const all      = (await Proposal.findAll()).length
  const ongoing  = (await Proposal.findAll({ where: { status: 'ongoing' } })).length
  const upcoming = (await Proposal.findAll({ where: { status: 'upcoming' } })).length
  const finished = (await Proposal.findAll({ where: { status: 'finished' } })).length
  const passed   = (await Proposal.findAll({ where: { result: 'passed' } })).length
  const rejected = (await Proposal.findAll({ where: { result: 'rejected' } })).length
  res.status(200).send({ all, ongoing, upcoming, finished, passed, rejected })
}

export const getProposal = async (req, res) => {
  const id = req.params.id
  const result = await Proposal.findOne({
    where: { id },
    attributes: { exclude: ['createdAt', 'updatedAt'], },
  });
  if(result === null){
    return res.status(404).send({ error: 'Proposal not found' });
  }
  const { contentJSON, ...proposal } = result.get();
  res.status(200).send({ ...proposal, ...JSON.parse(contentJSON) });
}

export const getProposalVotes = async (req, res) => {
  const { limit, offset } = pagination(req)
  const { count, rows } = await Voter.findAndCountAll({
    limit,
    offset,
    where: { proposalId: req.params.proposalId, },
    attributes: { exclude: ['createdAt', 'updatedAt'], },
  });
  res.status(200).send({ count, votes: rows });
}

export const getTransfersFrom = async (req, res) => {
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

export const getTransfersTo = async (req, res) => {
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

export const getTransfersBy = async (req, res) => {
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

export const routes = [
  ['/block/latest',               getLatestBlock],
  ['/blocks',                     getBlocks],
  ['/block/:height',              getBlockByHeight],
  ['/block/hash/:hash',           getBlockByHash],
  ['/txs',                        getTransactions],
  ['/tx/:txHash',                 getTransactionByHash],
  ['/validators',                 getValidators],
  ['/validators/:state',          getValidatorsByState],
  ['/validator/:hash',            getValidatorByHash],
  ['/validator/uptime/:address',  getValidatorUptime],
  ['/proposals',                  getProposals],
  ['/proposals/stats',            getProposalStats],
  ['/proposal/:id',               getProposal],
  ['/proposal/votes/:proposalId', getProposalVotes],
  ['/transfers/from/:address',    getTransfersFrom],
  ['/transfers/to/:address',      getTransfersTo],
  ['/transfers/by/:address',      getTransfersBy],

  ['/epoch', async (req, res) => {
    const {chain} = await getRPC()
    const timestamp = new Date().toISOString()
    const [epoch, firstBlock] = await Promise.all([
      chain.fetchEpoch(),
      chain.fetchEpochFirstBlock(),
    ])
    res.status(200).send({
      timestamp,
      epoch:      String(epoch),
      firstBlock: String(firstBlock),
    })
  }],
  ['/epoch/firstBlock',     (req, res) => { throw new Error('not implemented') }],
  ['/block',                (req, res) => { throw new Error('not implemented') }],
  ['/validators/addresses', (req, res) => { throw new Error('not implemented') }],
  ['/validators/stake',     (req, res) => { throw new Error('not implemented') }],
]

export default addRoutes(express.Router());

export function addRoutes (router) {
  for (const [route, handler] of routes) {
    router.get(route, withConsole(handler))
  }
  return router
}
