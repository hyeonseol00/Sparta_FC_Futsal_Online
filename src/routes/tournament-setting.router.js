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

      const isExistList = await prisma.tournamentMatch.findFirst({
        where: { tournamentId: +tournamentId },
      });

      if (isExistList)
        return res.status(401).json({ message: '이미 대진표가 존재합니다!' });

      const tnmt = await prisma.tournament.findFirst({
        where: { tournamentId: +tournamentId },
      });

      const entryDatas = Array.from(
        await prisma.tournamentEntry.findMany({
          where: { tournamentId: +tournamentId },
        }),
      );

      if (tnmt.winnerTeamId)
        return res.status(401).json({ message: '이미 끝난 토너먼트입니다!' });

      /* if (Math.floor((new Date() - tnmt.scheduledTime) / 1000 / 60) < 60) {
        return res
          .status(404)
          .json({ message: '아직 시작되지 않은 토너먼트입니다!' });
      } */

      if (entryDatas.length !== 8) {
        return res
          .status(404)
          .json({ message: '현재 토너먼트 유저가 모집되지 않았습니다!' });
      }

      let teamIds = entryDatas.map((tn) => tn.teamId);
      await prisma.$transaction(async (tx) => {
        for (let i = 1; i <= 4; i++) {
          const indexA = Math.floor(Math.random() * teamIds.length);
          const randomTeam_A = teamIds[indexA];
          teamIds.splice(indexA, 1);
          const indexB = Math.floor(Math.random() * teamIds.length);
          const randomTeam_B = teamIds[indexB];
          teamIds.splice(indexB, 1);

          await tx.tournamentMatch.create({
            data: {
              tournamentId: +tournamentId,
              teamAId: randomTeam_A,
              teamBId: randomTeam_B,
              roundName: `quater-${i}`,
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
