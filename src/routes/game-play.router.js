import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import { Prisma } from '@prisma/client';
import { playGame } from '../logics/game-play.logic.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/play', authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { userATeamId, userBTeamId } = req.body;

    const userA = await prisma.user.findFirst({ where: { userId: userId } });
    const userATeam = await prisma.team.findFirst({ where: { teamId: userATeamId } });
    const userBTeam = await prisma.team.findFirst({ where: { teamId: userBTeamId } });

    if (!userA) return res.status(404).json({ errorMessage: '유저 정보를 불러올 수 없습니다.' });
    else if (!userATeam)
      return res.status(404).json({ errorMessage: '유저의 팀을 찾을 수 없습니다.' });
    else if (!userBTeam)
      return res.status(404).json({ errorMessage: '상대방 팀을 찾을 수 없습니다.' });
    else if (userA.userId != userATeam.userId)
      return res.status(403).json({ errorMessage: `${userA.userName}님이 소유한 팀이 아닙니다!` });

    return res.status(201).json({ message: await playGame(userATeamId, userBTeamId) });
  } catch (error) {
    next(error);
  }
});

router.post('/match-making/play', authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { userATeamId } = req.body;

    const userA = await prisma.user.findFirst({ where: { userId } });
    const userARecord = await prisma.record.findFirst({ where: { userId } });
    const userAScore = userARecord ? userARecord.score : 1000;
    const matchedOpponents = await prisma.record.findMany({
      where: {
        NOT: {
          userId,
        },
        score: {
          gte: userAScore - 100,
          lte: userAScore + 100,
        },
      },
    });
    if (!matchedOpponents[0])
      return res.status(404).json({ errorMessage: '매치 조건에 맞는 유저를 찾을 수 없습니다.' });
    const userBRecord = matchedOpponents[Math.floor(Math.random() * matchedOpponents.length)];
    const userB = await prisma.user.findFirst({ where: { userId: userBRecord.userId } });

    const userATeam = await prisma.team.findFirst({ where: { teamId: userATeamId } });
    const userBTeams = await prisma.team.findMany({ where: { userId: userBRecord.userId } });
    if (!userBTeams) return res.status(404).json({ errorMessage: '상대방 팀을 찾을 수 없습니다.' });
    const userBTeam = userBTeams[Math.floor(Math.random() * userBTeams.length)];

    if (!userA) return res.status(404).json({ errorMessage: '유저 정보를 불러올 수 없습니다.' });
    else if (!userATeam)
      return res.status(404).json({ errorMessage: '유저의 팀을 찾을 수 없습니다.' });
    else if (userA.userId != userATeam.userId)
      return res.status(403).json({ errorMessage: `${userA.userName}님이 소유한 팀이 아닙니다!` });

    return res.status(201).json({
      message: `${userBRecord.score}점 ${userB.userName}님과 매치가 성사되었습니다!`,
      result: `${await playGame(userATeamId, userBTeam.teamId)}`,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
