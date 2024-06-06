import express from 'express';
import * as Queries from './queries.js';

const router = express.Router();

router.get('/block/latest',               Queries.getLatestBlock);
router.get('/blocks',                     Queries.getBlocks);
router.get('/block/:height',              Queries.getBlockByHeight);
router.get('/block/hash/:hash',           Queries.getBlockByHash);
router.get('/txs',                        Queries.getTransactions);
router.get('/tx/:txHash',                 Queries.getTransactionByHash);
router.get('/validators',                 Queries.getValidators);
router.get('/validators/:state',          Queries.getValidatorsByState);
router.get('/validator/:hash',            Queries.getValidatorByHash);
router.get('/validator/uptime/:address',  Queries.getValidatorUptime);
router.get('/proposals',                  Queries.getProposals);
router.get('/proposals/stats',            Queries.getProposalStats);
router.get('/proposal/:id',               Queries.getProposal);
router.get('/proposal/votes/:proposalId', Queries.getProposalVotes);
router.get('/transfers/from/:address',    Queries.getTransfersFrom);
router.get('/transfers/to/:address',      Queries.getTransfersTo);
router.get('/transfers/by/:address',      Queries.getTransfersBy);

export default router
