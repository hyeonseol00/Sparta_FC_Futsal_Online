import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import { Prisma } from '@prisma/client';
import { playGame } from '../logics/game-play.logic.js';

const router = express.Router();

router.post('/games/play/:user_id', async (req, res, next) => {
  try {
    playGame();
  } catch (error) {
    next(error);
  }
});

export default router;
