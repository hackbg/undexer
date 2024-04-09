import express from 'express';

const app = express();

app.use('/', (req, res) => res.status(200).send('HEALTHY'));

const { SERVER_PORT: port = 8888 } = process.env;

app.listen({ port }, () => {
  console.log(`🚀 Server ready at http://0.0.0.0:${port}`);
});