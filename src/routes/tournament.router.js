import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import { resultMatch, loopFind } from '../logics/tournament-logic.js';
import { playGame } from '../logics/game-play.logic.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

// 토너먼트 매치 플레이 API
router.post(
  '/tournament/match/:teamId',
  authMiddleware,
  async (req, res, next) => {
    try {
      const { teamId } = req.params;
      const { tournamentId, roundName } = req.body;

      if (!tournamentId || !roundName) {
        return res
          .status(400)
          .json({ message: '데이터를 올바르게 입력해주세요.' });
      }

      if (
        !roundName.equals('quater') ||
        !roundName.equals('semi') ||
        !roundName.equals('final')
      ) {
        return res
          .status(400)
          .json({ message: 'Round Name을 올바르게 입력해주세요.' });
      }

      const tournament = await prisma.tournament.findFirst({
        where: {
          tournamentId,
          currentRound: roundName,
        },
      });
      if (!tournament) {
        return res.status(401).json({
          message:
            '현재 진행 중인 토너먼트가 아니거나, 해당 라운드가 진행 중이지 않습니다.',
        });
      }

      const entry = await prisma.tournamentEntry.findFirst({
        where: {
          tournamentId,
          teamId: +teamId,
        },
      });
      if (!entry) {
        return res.status(401).json({ message: '토너먼트 참여자가 아닙니다.' });
      }

      // 현재 API를 요청한 팀 id로
      const match = await prisma.tournamentMatch.findFirst({
        where: {
          tournamentId,
          roundName: {
            contains: roundName,
          },
          OR: [
            {
              teamAId: +teamId,
            },
            {
              teamBId: +teamId,
            },
          ],
        },
      });
      if (!match) {
        return res
          .status(401)
          .json({ message: '해당 라운드 토너먼트 참여자가 아닙니다.' });
      }

      await prisma.tournamentEntry.update({
        data: {
          ready: 1,
        },
        where: {
          tournamentId,
          teamId: +teamId,
        },
      });

      let otherTeamId;
      if (match.teamAId === +teamId) {
        otherTeamId = match.teamBId;
      } else {
        otherTeamId = match.teamAId;
      }

      setTimeout(async () => {
        const otherTeam = await prisma.tournamentEntry.findFirst({
          where: {
            tournamentId,
            otherTeamId,
          },
        });

        let message;

        if (otherTeam.ready) {
          // 상대 팀 ready가 되었을 때 그대로 게임 진행
          if (match.teamAId === +teamId) {
            // team A 인 유저 요청일 때는 playGame() -> match history() 결과 받기
            const playResult = await playGame(match.teamAId, match.teamBId);
            const splitResult = playResult.split('승리');
            splitResult = splitResult.map((element) => element.trim()).join('');
            message = resultMatch(tournamentId, roundName, splitResult[0]);
          } else {
            // team B 인 유저 요청일 때는 findFirst() -> 딜레이 -> 못찾으면 다시 findFirst() 찾으면 match history() 결과 받기
            const matchHistory = loopFind(+teamId, otherTeamId, new Date());
            if (matchHistory.resultA.equals('win')) {
              message = resultMatch(
                tournamentId,
                roundName,
                matchHistory.teamAId,
              );
            } else {
              message = resultMatch(
                tournamentId,
                roundName,
                matchHistory.teamBId,
              );
            }
          }
        } else {
          // 상대 팀 ready가 안되었을 때는 부전승처리
          message = resultMatch(tournamentId, roundName, +teamId);
        }

        // 해당 매치가 종료가 됐으니 ready는 다시 false로
        await prisma.tournamentEntry.update({
          data: {
            ready: 0,
          },
          where: {
            tournamentId,
            teamId: +teamId,
          },
        });

        return res.status(200).json({ message });
      }, 10000);
    } catch (error) {
      next();
    }
  },
);

export default router;
