import express from 'express';
import cors from 'cors';
import sequelize from '../db/index.js';
import * as Queries from './queries.js';

const DEFAULT_PAGE_LIMIT = 25
const DEFAULT_PAGE_OFFSET = 0
const { SERVER_PORT = 8888 } = process.env;

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

const app = express();
app.use(cors()); // CORS enabled for all origins
app.use('/v2', router);
app.listen({
  port: SERVER_PORT
}, () => {
  sequelize.sync();
  console.log(`🚀 Server ready at http://0.0.0.0:${SERVER_PORT}`);
});
