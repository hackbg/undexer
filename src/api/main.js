#!/usr/bin/env -S node --import @ganesha/esbuild

import app from './app.js';
import sequelize from '../db/index.js';

console.log('⏳ Syncing DB schema...')
await sequelize.sync();

const { SERVER_PORT = 8888 } = process.env
console.log(`⏳ Launching server on port ${SERVER_PORT}...`)
app.listen({ port: SERVER_PORT }, () => {
  console.log(`🚀 Server ready at http://0.0.0.0:${SERVER_PORT}`);
});
