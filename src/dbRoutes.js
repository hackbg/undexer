import { CHAIN_ID } from './config.js';
import { Block, Validator, Proposal, Vote } from './dbModel.js';
import * as Query from './dbQuery.js';
import { sql, slonikSelect, defaultAttributes } from './dbUtil.js';
import { pagination, relativePagination } from './dbPage.js';
import { withConsole, send200, send400, send404, send500 } from './utils.js';
import express from 'express'
import { literal, fn, cast, col } from 'sequelize';

const chainId = CHAIN_ID

// Routes that respond with indexed data from the database.
export const dbRoutes = {}

dbRoutes['/'] = async function dbOverview (_req, res) {
  const timestamp = new Date().toISOString()
  const overview = await Query.overview()
  return send200(res, { timestamp, chainId, ...overview })
}

dbRoutes['/epochs'] = async function dbEpochs (req, res) {
  const timestamp = new Date().toISOString()
  const { limit, before, after } = relativePagination(req)
  if (before && after) {
    return send400(res, "Mutually exclusive query parameters: before, after")
  }
  const epochs = await Query.epochs({ limit, before, after })
  return send200(res, { timestamp, epochs })
}

dbRoutes['/status'] = async function dbStatus (_req, res) {
  const timestamp = new Date().toISOString()
  const status = await Query.status()
  return send200(res, { timestamp, chainId, ...status })
}

dbRoutes['/search'] = async function dbStatus (req, res) {
  const timestamp = new Date().toISOString()
  const { blocks, transactions, proposals } = await Query.search(req.query.q)
  return send200(res, { timestamp, chainId, blocks, transactions, proposals })
}

dbRoutes['/blocks'] = async function dbBlocks (req, res) {
  const timestamp = new Date().toISOString()
  const { limit, before, after } = relativePagination(req)
  if (before && after) {
    return send400(res, "Mutually exclusive query parameters: before, after")
  }
  const query = { before, after, limit, publicKey: req?.query?.publicKey }
  if (req?.query?.publicKey) {
    query.publicKey = req.query.publicKey
  }
  const results = await Query.blocks(query)
  return send200(res, { timestamp, chainId, ...results })
}

dbRoutes['/block'] = async function dbBlock (req, res) {
  const timestamp = new Date().toISOString()
  const { height, hash } = req.query
  const selection = sql.fragment`SELECT
    "blocks"."chainId",
    "blocks"."blockHeight",
    "blocks"."blockHash",
    "blocks"."blockHeader",
    "blocks"."blockTime",
    "block_data_responses"."blockData"`
  const joinedTables = sql.fragment`
    "blocks" LEFT OUTER JOIN "block_data_responses"
    ON "blocks"."blockHeight" = "block_data_responses"."blockHeight"`
  const block = (await slonikSelect(
    hash ? sql.unsafe`${selection} FROM ${joinedTables}
      WHERE "blocks"."blockHash" = ${hash} LIMIT 1;`
    : height ? sql.unsafe`${selection} FROM ${joinedTables}
      WHERE "blocks"."blockHeight" = ${height} LIMIT 1;`
    : sql.unsafe`${selection} FROM ${joinedTables}
      ORDER BY "blocks"."blockHeight" DESC LIMIT 1;`))[0][0]
  if (!block) return send404(res, 'Block not found')
  const signers = block?.blockData?.result?.block?.last_commit?.signatures?.map(s=>s.validator_address)
  const [transactions, proposerInfo, signersInfo] = await Promise.all([
    Query.transactionsAtHeight(block.blockHeight),
    Query.validatorByConsensusAddress(block.blockHeader.proposerAddress),
    Promise.all(signers.filter(Boolean).map(signer=>Query.validatorByConsensusAddress(signer)))
  ])
  return send200(res, {
    timestamp,
    chainId,
    blockHeight:      block.blockHeight,
    blockHash:        block.blockHash,
    blockTime:        block.blockTime,
    epoch:            block.epoch,
    transactionCount: transactions.count,
    transactions:     transactions.rows.map(row => row.toJSON()),
    proposer:         proposerInfo?.get(),
    signers:          signersInfo.map(x=>x?.get()),
  })
}

dbRoutes['/txs'] = async function dbTransactions (req, res) {
  const timestamp = new Date().toISOString()
  const { rows, count } = await Query.transactionList(pagination(req))
  return send200(res, { timestamp, chainId, count, txs: rows.map(x=>x.get()) })
} 

dbRoutes['/transactions/:address'] = async function dbTransactionsForAddress (req, res) {
  if (!req?.params?.address) {
    return send400(res, 'Missing URL parameter: address')
  }
  const { address } = req.params;
  const { limit, offset } = pagination(req)
  try {
    const [count, transactions] = await Promise.all([
      Query.txByAddressCount({ address }),
      Query.txByAddressList({ address, limit, offset }),
    ])
    return send200(res, { count, transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return send500(res, 'Failed to fetch transactions');
  }
}

dbRoutes['/tx/:txHash'] = async function dbTransaction (req, res) {
  const txHash = req?.params?.txHash
  if (!txHash) {
    return send400(res, 'Missing URL parameter: txHash')
  }
  const tx = await Query.transactionByHash(req.params.txHash);
  if (tx === null) {
    return send404(res, 'Transaction not found');
  }
  return send200(res, tx.get())
}

dbRoutes['/validators'] = async function dbValidators (req, res) {
  const { limit, offset } = pagination(req)
  const epoch = await Query.latestEpochFromValidators(req?.query?.epoch)
  const { state } = req.query
  const where = {}
  if (!isNaN(epoch)) where['epoch'] = epoch
  if (state) where['state.state'] = state
  const order = [literal('"stake" collate "numeric" DESC')]
  const attrs = defaultAttributes({ exclude: ['id'] })
  const { count, rows: validators } = await Validator.findAndCountAll({
    where, order, limit, offset, attributes: attrs
  });
  const result = { count, validators: validators.map(v=>v.toJSON()) };
  return send200(res, result);
}

dbRoutes['/validators/states'] = async function dbValidatorStates (req, res) {
  const epoch = await Query.latestEpochFromValidators(req?.query?.epoch)
  const states = {}
  const where = {}
  if (!isNaN(epoch)) where['epoch'] = epoch
  for (const validator of await Validator.findAll({
    where, attributes: { include: [ 'state' ] }
  })) {
    states[validator?.state?.state] ??= 0
    states[validator?.state?.state] ++
  }
  return send200(res, states)
}

dbRoutes['/validator'] = async function dbValidatorByHash (req, res) {
  const epoch = await Query.latestEpochFromValidators(req?.query?.epoch)
  const publicKey = req?.query?.publicKey
  const namadaAddress = req?.query?.address
  if (publicKey && namadaAddress) {
    return send400(res, "Mutually exclusive query parameters: address, publicKey")
  }
  if (!(publicKey || namadaAddress)) {
    return send400(res, "Missing query parameter: address or publicKey")
  }
  const where = {}
  if (namadaAddress) where.namadaAddress = namadaAddress
  if (publicKey) where.publicKey = publicKey
  if (!isNaN(epoch)) where['epoch'] = epoch
  const attrs = defaultAttributes({ exclude: ['id'] })
  let validator = await Validator.findOne({ where, attributes: attrs });
  if (validator === null) {
    return send404(res, 'Validator not found')
  }
  validator = { ...validator.get() }
  validator.metadata ??= {}
  return send200(res, {
    ...validator,
    ...await Query.validatorUptime(
      req.query['uptime'],
      namadaAddress
        ? await Query.validatorNamadaAddressToConsensusAddresses(namadaAddress)
        : await Query.validatorPublicKeyToConsensusAddresses(publicKey)
    )
  })
}

dbRoutes['/validator/votes/:address'] = async function dbValidatorVotes(req, res) {
  const { limit, offset } = pagination(req);
  const includeDelegated = req.query.delegated && req.query.delegated === 'true'
  if (!req?.params?.address) {
    return send400(res, 'Missing URL parameter: address')
  }
  const where = { validator: req.params.address }
  if (!includeDelegated) where.isValidator = true
  const order = [['proposal', 'DESC']]
  const attrs = defaultAttributes();
  const { count, rows } = await Vote.findAndCountAll({
    limit, offset, where, attributes: attrs, order
  });
  return send200(res, { count, votes: rows.map(row=>row.get()) });
}

dbRoutes['/bonds-and-unbonds'] = async function dbBonds (req, res) {
  const { limit, offset } = pagination(req)
  const { validator, delegator, source = delegator } = req?.query ?? {}
  if (delegator && (source != delegator)) {
    return send400(res, "Use source OR delegator (they are equivalent)")
  }
  const [count, bonds] = await Promise.all([
    Query.bondAndUnboundCount({ source, validator }),
    Query.bondAndUnboundList({ source, validator, limit, offset })
  ])
  return send200(res, { count, bonds })
}

dbRoutes['/bonds'] = async function dbBonds (req, res) {
  const { limit, offset } = pagination(req)
  const { validator, delegator, source = delegator } = req?.query ?? {}
  if (delegator && (source != delegator)) {
    return send400(res, "Use source OR delegator (they are equivalent)")
  }
  const [count, bonds] = await Promise.all([
    Query.bondCount({ source, validator }),
    Query.bondList({ source, validator, limit, offset })
  ])
  return send200(res, { count, bonds })
}

dbRoutes['/unbonds'] = async function dbBonds (req, res) {
  const { limit, offset } = pagination(req)
  const { validator, delegator, source = delegator } = req?.query ?? {}
  if (delegator && (source != delegator)) {
    return send400(res, "Use source OR delegator (they are equivalent)")
  }
  const [count, unbonds] = await Promise.all([
    Query.unbondCount({ source, validator }),
    Query.unbondList({ source, validator, limit, offset })
  ])
  return send200(res, { count, unbonds })
}

dbRoutes['/proposals'] = async function dbProposals (req, res) {
  const { limit, offset } = pagination(req)
  const orderBy = req.query.orderBy ?? 'id';
  const orderDirection = req.query.orderDirection ?? 'DESC'
  const where = {}
  const { proposalType, status, result } = req.query
  if (proposalType) where.proposalType = proposalType
  if (status) where.status = status
  if (result) where.result = result
  const order = [[orderBy, orderDirection]]
  const attrs = defaultAttributes()
  const { rows, count } = await Proposal.findAndCountAll({
    order, limit, offset, where, attributes: attrs
  });
  return send200(res, { count, proposals: rows.map(row=>row.get()) })
}

dbRoutes['/proposals/stats'] = async function dbProposalStats (_req, res) {
  const [all, ongoing, upcoming, finished, passed, rejected] = await Promise.all([
    Proposal.count(),
    Proposal.count({ where: { 'metadata.status': 'ongoing'  } }),
    Proposal.count({ where: { 'metadata.status': 'upcoming' } }),
    Proposal.count({ where: { 'metadata.status': 'finished' } }),
    Proposal.count({ where: { 'result.result':   'Passed'   } }),
    Proposal.count({ where: { 'result.result':   'Rejected' } }),
  ])
  return send200(res, { all, ongoing, upcoming, finished, passed, rejected })
}

dbRoutes['/proposal/:id'] = async function dbProposal(req, res) {
  if (!('id' in req?.params||{})) {
    return send400(res, 'Missing URL parameter: id')
  }
  const id = req.params.id

  const [{ totalYayPower }] = await Vote.findAll({
    raw: true,
    attributes: [[fn('SUM', cast(col('power'), 'bigint')), 'totalYayPower']],
    where: { proposal: id, data: 'Yay' }
  })
  const [{ totalNayPower }] = await Vote.findAll({
    raw: true,
    attributes: [[fn('SUM', cast(col('power'), 'bigint')), 'totalNayPower']],
    where: { proposal: id, data: 'Nay' }
  })
  const [{ totalAbstainPower }] = await Vote.findAll({
    raw: true,
    attributes: [[fn('SUM', cast(col('power'), 'bigint')), 'totalAbstainPower']],
    where: { proposal: id, data: 'Abstain' }
  })
  const [{ totalVotingPower }] = await Vote.findAll({
    raw: true,
    attributes: [[fn('SUM', cast(col('power'), 'bigint')), 'totalVotingPower']],
    where: { proposal: id }
  })
  const votingResults = { totalYayPower, totalNayPower, totalAbstainPower, totalVotingPower }

  let result = await Proposal.findOne({ where: { id }, attributes: defaultAttributes(), });
  if (result) {
    result = result.get()
    result.votes = result.votes?.map(vote=>vote.get())
    return send200(res, { ...result, votingResults })
  } else {
    return send404(res, 'Proposal not found')
  }
}

dbRoutes['/proposal/votes/:id'] = async function dbProposalVotes (req, res) {
  if (!req?.params?.id) {
    return send400(res, 'Missing URL parameter: id')
  }
  const { limit, offset } = pagination(req);
  const where = { proposal: req.params.id };
  const attrs = defaultAttributes();
  const { count, rows } = await Vote.findAndCountAll({
    limit, offset, where, attributes: attrs,
  });
  return send200(res, { count, votes: rows });
}

dbRoutes['/proposal/votes/:id/validators'] = async function dbProposalVotes(req, res) {
  if (!req?.params?.id) {
    return send400(res, 'Missing URL parameter: id')
  }
  const proposal = req.params.id

  const validators = await Vote.findAll({
    raw: true,
    attributes: [[fn('DISTINCT', col('validator')), 'validator']],
    where: { proposal }
  })
  const validatorVotes = await Vote.findAll({
    attributes: defaultAttributes(), where: { isValidator: true, proposal }
  })

  const result = validators.map(({ validator }) => ({
    validator, vote: validatorVotes.find(vote => vote.validator == validator)
  })).sort((a, b) => {
    const powerA = BigInt(a.vote?.power ? a.vote.power : 0)
    const powerB = BigInt(b.vote?.power ? b.vote.power : 0)
    if (powerA > powerB) {
      return -1;
    } else if (powerA < powerB) {
      return 1;
    } else {
      return 0;
    }
  })

  return send200(res, result);
}

dbRoutes['/proposal/votes/:id/validator/:address'] = async function dbProposalVotes(req, res) {
  if (!req?.params?.id) {
    return send400(res, 'Missing URL parameter: id')
  }

  if (!req?.params?.address) {
    return send400(res, 'Missing URL parameter: address')
  }

  const where = { proposal: req.params.id, validator: req.params.address };
  const attributes = defaultAttributes();
  const order = [literal('"power" collate "numeric" DESC')]

  const votes = await Vote.findAll({
    attributes,
    where,
    order
  })

  return send200(res, votes);
}

dbRoutes['/transfers'] = async function dbTransfers (req, res) {
  const { limit, offset } = pagination(req)
  const { address, source, target } = req.query
  const [count, transfers] = await Promise.all([
    Query.transferCount({ address, source, target }),
    Query.transferList({ address, source, target, limit, offset }),
  ])
  return send200(res, { count, transfers })
}

export default function getDbRouter () {
  return addDbRoutes(express.Router())
}

export function addDbRoutes (router) {
  for (const [route, handler] of Object.entries(dbRoutes)) {
    router.get(route, withConsole(handler))
  }
  return router
}
