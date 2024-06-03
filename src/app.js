import 'dotenv/config';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import scoreRouter from './routes/scoreRouter.js';
import rankingRouter from './routes/rankingRouter.js';

const prisma = new PrismaClient();
const app = express();
app.use(express.json());

app.use('/api/score', scoreRouter);
app.use('/api/rankings', rankingRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`${PORT} 포트로 서버가 열렸어요!`);
});

export default prisma;
