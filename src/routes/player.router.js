import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import { Prisma } from '@prisma/client';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/player/:playerId', async (req, res, next) => {
  try {
    const { playerId } = req.params;

    const player = await prisma.player.findFirst({
      where: { playerId: +playerId },
    });

    if (!player)
      return res
        .status(404)
        .json({ errorMessage: '선수 정보를 불러올 수 없습니다.' });

    return res.status(201).json(player);
  } catch (error) {
    next(error);
  }
});

export default router;
