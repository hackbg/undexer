#!/usr/bin/env -S node --import @ganesha/esbuild

import express from 'express';
const app = express();

import cors from 'cors';
app.use(cors()); // CORS enabled for all origins

import router from '../src/routes.js';
app.use('/v2', router);
import sequelize from '../src/db.js';

console.log('⏳ Syncing DB schema...')
await sequelize.sync();

const { SERVER_PORT = 8888 } = process.env
console.log(`⏳ Launching server on port ${SERVER_PORT}...`)
app.listen({ port: SERVER_PORT }, () => {
  console.log(`🚀 Server ready at http://0.0.0.0:${SERVER_PORT}`);
});
