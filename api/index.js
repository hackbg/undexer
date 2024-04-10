import express from 'express';
import sequelize from '../db/index.js';
import Block from '../models/Block.js';
import Transaction from '../models/Transaction.js';
import Validator from '../models/Validator.js';
import Section from '../models/Section.js';
import Content from '../models/Content.js';
import Proposal from '../models/Proposal.js';
import Voter from '../models/Voter.js';

const app = express();

app.get('/block/:height', async (req, res) => {
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
        { model: Section },
      ],
    },
    {
      raw: true,
    },
  );
  if (block === null) {
    res.status(404).send({ error: 'Block not found' });
    return;
  }
  res.status(200).send(block);
});

app.get('/block/hash/:hash', async (req, res) => {
  const block = await Block.findOne(
    {
      where: {
        id: req.params.hash,
      },
      attributes: { exclude: ['transactionId'] },
      include: [
        {
          model: Transaction,
          attributes: { exclude: ['id', 'createdAt', 'updatedAt', 'chainId'] },
        },
      ],
    },
    {
      raw: true,
    },
  );
  if (block === null) {
    res.status(404).send({ error: 'Block not found' });
    return;
  }

  res.status(200).send(block);
});

app.get('/tx/:txHash', async (req, res) => {
  const tx = await Transaction.findOne(
    {
      where: { txId: req.params.txHash },
      include: [
        {
          model: Block,
          attributes: { include: ['height'] },
        },
        {
          model: Section,
        },
        { model: Content },
      ],
    },
    {
      raw: true,
    },
  );
  res.status(200).send(tx);
});

app.get('/validators', (req, res) => {
  const validators = Validator.findAll({ raw: true });
  res.status(200).send(validators);
});

app.get('/validator/:type', (req, res) => {
  const validator = Validator.findAll(
    {
      where: {
        type: req.params.type,
      },
    },
    { raw: true },
  );
  if (validator === null) {
    res.status(404).send({ error: 'Validator not found' });
    return;
  }

  res.status(200).send(validator);
});

const { SERVER_PORT: port = 8888 } = process.env;

app.listen({ port }, () => {
  sequelize.sync();
  console.log(`🚀 Server ready at http://0.0.0.0:${port}`);
});
