import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import { Prisma } from '@prisma/client';
import { playGame } from '../logics/game-play.logic.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/tournament/end', async (req, res, next) => {
  try {
    const { userBId } = req.params;
    const { userATeamId, userBTeamId } = req.body;

    const userA = await prisma.user.findFirst({ where: { userId: userId } });
    const userB = await prisma.user.findFirst({ where: { userId: userBId } });
    const userATeam = await prisma.team.findFirst({ where: { teamId: userATeamId } });
    const userBTeam = await prisma.team.findFirst({ where: { teamId: userBTeamId } });

    if (!userA) return res.status(404).json({ errorMessage: '유저 정보를 불러올 수 없습니다.' });
    else if (!userB)
      return res.status(404).json({ errorMessage: '상대방 정보를 찾을 수 없습니다.' });
    else if (!userATeam)
      return res.status(404).json({ errorMessage: '유저의 팀을 찾을 수 없습니다.' });
    else if (!userBTeam)
      return res.status(404).json({ errorMessage: '상대방 팀을 찾을 수 없습니다.' });
    else if (userA.userId != userATeam.userId)
      return res.status(403).json({ errorMessage: `${userA.userName}님이 소유한 팀이 아닙니다!` });
    else if (userB.userId != userBTeam.userId)
      return res.status(403).json({ errorMessage: `${userB.userName}님이 소유한 팀이 아닙니다!` });

    return res.status(201).json({ message: await playGame(userATeamId, userBTeamId) });
  } catch (error) {
    next(error);
  }
});

export default router;
