require('dotenv').config();
const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
app.use(express.json());

const scoreRouter = require('./src/routes/scoreRouter');
const rankingRouter = require('./src/routes/rankingRouter');

app.use('/api/score', scoreRouter);
app.use('/api/rankings', rankingRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸어요!');
});

module.exports = prisma;
