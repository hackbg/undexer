import express from 'express';
import cors from 'cors';
import router from './routes.js';
const app = express();
app.use(cors()); // CORS enabled for all origins
app.use('/v2', router);
export default app
