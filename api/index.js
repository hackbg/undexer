import express from 'express';
import sequelizer from '../db/index.js';
import Block from '../models/Block.js';
import Transaction from '../models/Transaction.js';
import Validator from '../models/Validator.js';

const app = express();

app.get('/block/:height', async (req, res) => {
  const block = await Block.findOne(
    {
      where: {
        height: req.params.height,
      },
      include: Transaction,
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
      include: Transaction,
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
  res.status(501).send({ error: 'Not implemented' });
  /*
  const tx = await Transaction.findOne({ id: req.params.txHash, raw: true });
  res.status(200).send(tx);
  */
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
  sequelizer.sync();
  console.log(`🚀 Server ready at http://0.0.0.0:${port}`);
});
