import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post(
  '/tournament/:tournamentId',
  authMiddleware,
  async (req, res, next) => {
    try {
      const { tournamentId } = req.params;

      const tnmt = await prisma.tournament.findFirst({
        where: { tournamentId: +tournamentId },
      });

      const entryDatas = Array.from(
        await prisma.tournamentEntry.findMany({
          where: { tournamentId: +tournamentId },
        }),
      );

      if (tnmt.winnerTeamId) {
        return res.status(401).json({ message: '이미 끝난 토너먼트입니다!' });
      }

      if (Math.floor((new Date() - tnmt.scheduledTime) / 1000 / 60) < 60) {
        return res
          .status(404)
          .json({ message: '아직 시작되지 않은 토너먼트입니다!' });
      }

      if (entryDatas.length !== 2) {
        return res
          .status(404)
          .json({ message: '현재 토너먼트 유저가 모집되지 않았습니다!' });
      }

      let teamIds = entryDatas.map((tn) => tn.teamId);

      await prisma.$transaction(async (tx) => {
        for (let i = 1; i <= 4; i++) {
          const randomTeam_A = Math.floor(Math.random() * teamIds.length);
          teamIds.splice(randomTeam_A, 1);

          const randomTeam_B = Math.floor(Math.random() * teamIds.length);
          teamIds.splice(randomTeam_B, 1);

          await prisma.tournamentMatch.create({
            data: {
              tournamentId: +tournamentId,
              teamAId: randomTeam_A,
              teamBId: randomTeam_B,
              roundName: `quater${i}`,
            },
          });
        }

        return res.status(201).json({ message: '대진표가 완성되었습니다!' });
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
