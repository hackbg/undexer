import express from 'express';
import cors from 'cors';
import sequelize from '../db/index.js';
import Block from '../models/Block.js';
import Transaction from '../models/Transaction.js';
import Validator from '../models/Validator.js';
// import Section from '../models/Section.js';
// import Content from '../models/Content.js';
import Proposal from '../models/Proposal.js';
import Voter from '../models/Voter.js';

const DEFAULT_PAGE_LIMIT = 25
const DEFAULT_PAGE_OFFSET = 0

const app = express();
const router = express.Router();

// CORS-enabled for all origins
app.use(cors());
app.use('/v2', router);

router.get('/block/latest', async (req, res) => {
  const latestBlock = await Block.max('height');
  res.status(200).send(latestBlock.toString());
});

router.get('/blocks', async (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : DEFAULT_PAGE_LIMIT
  const offset = req.query.offset ? Number(req.query.offset) : DEFAULT_PAGE_OFFSET
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
});

router.get('/block/:height', async (req, res) => {
  const block = await Block.findOne(
    {
      where: {
        height: req.params.height,
      },
      attributes: { exclude: ['transactionId', 'createdAt', 'updatedAt'] },
      include: [
        {
          model: Transaction,
          attributes: { exclude: ['id', 'createdAt', 'updatedAt', 'chainId'] },
        },
      ],
    }
  );
  if (block === null) {
    res.status(404).send({ error: 'Block not found' });
    return;
  }
  res.status(200).send(block);
});

router.get('/block/hash/:hash', async (req, res) => {
  const block = await Block.findOne(
    {
      where: {
        id: req.params.hash,
      },
      attributes: { exclude: ['transactionId', 'createdAt', 'updatedAt'] },
      include: [
        {
          model: Transaction,
          attributes: { exclude: ['id', 'createdAt', 'updatedAt', 'chainId'] },
        },
      ],
    },
  );
  if (block === null) {
    res.status(404).send({ error: 'Block not found' });
    return;
  }

  res.status(200).send(block);
});

router.get('/txs', async (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : DEFAULT_PAGE_LIMIT
  const offset = req.query.offset ? Number(req.query.offset) : DEFAULT_PAGE_OFFSET
  const { rows, count } = await Transaction.findAndCountAll({
    order: [['timestamp', 'DESC']],
    limit,
    offset,
    attributes: {
      exclude: ['id', 'createdAt', 'updatedAt'],
    },
  })

  res.status(200).send({ count, txs: rows })
})

router.get('/tx/:txHash', async (req, res) => {
  const tx = await Transaction.findOne(
    {
      where: { txId: req.params.txHash },
      attributes: {
        exclude: ['id', 'createdAt', 'updatedAt'],
      },
    }
  );
  res.status(200).send(tx);
});

router.get('/validators', async (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : DEFAULT_PAGE_LIMIT
  const offset = req.query.offset ? Number(req.query.offset) : DEFAULT_PAGE_OFFSET
  const { rows, count } = await Validator.findAndCountAll({
    order: [['stake', 'DESC']],
    limit,
    offset,
    attributes: {
      exclude: ['id', 'createdAt', 'updatedAt'],
    },
  });

  res.status(200).send({ count, validators: rows })
});

router.get('/validators/:state', async (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : DEFAULT_PAGE_LIMIT
  const offset = req.query.offset ? Number(req.query.offset) : DEFAULT_PAGE_OFFSET
  const state = req.params.state

  const { rows, count } = await Validator.findAndCountAll(
    {
      where: {
        state
      },
      order: [['stake', 'DESC']],
      limit,
      offset,
      attributes: {
        exclude: ['id', 'createdAt', 'updatedAt'],
      },
    },
  );

  res.status(200).send({ count, validators: rows })
});

router.get('/validator/:hash', async (req, res) => {
  const hash = req.params.hash

  const validator = await Validator.findOne(
    {
      where: { validator: hash },
      attributes: {
        exclude: ['id', 'createdAt', 'updatedAt'],
      },
    }
  );

  res.status(200).send(validator);
});

router.get('/validator/uptime/:address', async (req, res) => {
  const address = req.params.address;
  const blocks = await Block.findAll(
    {
      order: [['height', 'DESC']],
      limit: 100,
      attributes: ['rpcResponse', 'height'],
    }
  );

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
});

router.get('/proposals', async (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : DEFAULT_PAGE_LIMIT
  const offset = req.query.offset ? Number(req.query.offset) : DEFAULT_PAGE_OFFSET
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
})

router.get('/proposals/stats', async (req, res) => {
  const all = (await Proposal.findAll()).length
  const ongoing = (await Proposal.findAll({ where: { status: 'ongoing' } })).length
  const upcoming = (await Proposal.findAll({ where: { status: 'upcoming' } })).length
  const finished = (await Proposal.findAll({ where: { status: 'finished' } })).length
  const passed = (await Proposal.findAll({ where: { result: 'passed' } })).length
  const rejected = (await Proposal.findAll({ where: { result: 'rejected' } })).length
  res.status(200).send({ all, ongoing, upcoming, finished, passed, rejected })
})

router.get('/proposal/:id', async (req, res) => {
  const id = req.params.id

  const result = await Proposal.findOne(
    {
      where: {
        id
      },
      attributes: {
        exclude: ['createdAt', 'updatedAt'],
      },
    },
  );
  const { contentJSON, ...proposal } = result.get()

  res.status(200).send({ ...proposal, ...JSON.parse(contentJSON) });
});

router.get('/proposal/votes/:proposalId', async (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : DEFAULT_PAGE_LIMIT
  const offset = req.query.offset ? Number(req.query.offset) : DEFAULT_PAGE_OFFSET

  const { count, rows } = await Voter.findAndCountAll(
    {
      limit,
      offset,
      where: {
        proposalId: req.params.proposalId,
      },
      attributes: {
        exclude: ['createdAt', 'updatedAt'],
      },
    }
  );
  res.status(200).send({ count, votes: rows });
});

const { SERVER_PORT: port = 8888 } = process.env;

app.listen({ port }, () => {
  sequelize.sync();
  console.log(`🚀 Server ready at http://0.0.0.0:${port}`);
});
