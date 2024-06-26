import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import { resultMatch, transactionFind } from '../logics/tournament-logic.js';
import { playGame } from '../logics/game-play.logic.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

// 토너먼트 매치 플레이 API
router.post('/tournament/match', authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { tournamentId, roundName } = req.body;

    if (!tournamentId || !roundName) {
      return res
        .status(400)
        .json({ message: '데이터를 올바르게 입력해주세요.' });
    }

    if (
      roundName !== 'quater' &&
      roundName !== 'semi' &&
      roundName !== 'final'
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

    const userTeams = await prisma.team.findMany({
      where: {
        userId,
      },
    });
    const teamIds = userTeams.map((team) => team.teamId);
    const entry = await prisma.tournamentEntry.findFirst({
      where: {
        tournamentId,
        teamId: { in: teamIds },
      },
    });
    if (!entry) {
      return res.status(401).json({ message: '토너먼트 참여자가 아닙니다.' });
    }
    const teamId = entry.teamId;

    let nextRoundName;
    if (roundName === 'quater') {
      nextRoundName = 'semi';
    } else if (roundName === 'semi') {
      nextRoundName = 'final';
    } else if (roundName === 'final') {
      nextRoundName = 'finish';
    }
    const already = await prisma.tournamentMatch.findFirst({
      where: {
        tournamentId,
        roundName: {
          contains: nextRoundName,
        },
        OR: [
          {
            teamAId: teamId,
          },
          {
            teamBId: teamId,
          },
        ],
      },
    });
    if (already) {
      return res.status(401).json({
        message: '이미 해당 토너먼트 경기 진행을 완료하였습니다.',
      });
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
            teamAId: teamId,
          },
          {
            teamBId: teamId,
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
        tournamentEntryId: entry.tournamentEntryId,
      },
    });

    let otherTeamId;
    if (match.teamAId === teamId) {
      otherTeamId = match.teamBId;
    } else {
      otherTeamId = match.teamAId;
    }

    setTimeout(async () => {
      const otherTeam = await prisma.tournamentEntry.findFirst({
        where: {
          tournamentId,
          teamId: otherTeamId,
        },
      });

      let message;
      if (otherTeam.ready === 1) {
        // 상대 팀 ready가 되었을 때 그대로 게임 진행
        if (match.teamAId === teamId) {
          // team A 인 유저 요청일 때는 playGame() -> match history() 결과 받기
          const playResult = await playGame(match.teamAId, match.teamBId);

          const splitResult = playResult.split('승리');
          const winnerName = splitResult[0].trim();
          const winnerUser = await prisma.user.findFirst({
            where: {
              userName: winnerName,
            },
          });

          let winnerId;
          if (userId === winnerUser.userId) {
            winnerId = teamId;
          } else {
            winnerId = otherTeamId;
          }

          message = await resultMatch(
            tournamentId,
            match.roundName,
            nextRoundName,
            winnerId,
          );
        } else {
          // team B 인 유저 요청일 때는 match_history를 findFirst()해서 경기 결과 받기
          message = await transactionFind(roundName, match);
        }
      } else {
        // 상대 팀 ready가 안되었을 때는 부전승처리
        message = await resultMatch(
          tournamentId,
          match.roundName,
          nextRoundName,
          teamId,
        );
      }

      // 해당 매치가 종료가 됐으니 ready는 다시 false로
      await prisma.tournamentEntry.update({
        data: {
          ready: 0,
        },
        where: {
          tournamentEntryId: entry.tournamentEntryId,
        },
      });

      return res.status(200).json({ message });
    }, 10000);
  } catch (error) {
    next();
  }
});

// 토너먼트 상세 조회 API
router.get('/tournament/:tournamentId', async (req, res, next) => {
  try {
    const { tournamentId } = req.params;
    const tournament = await prisma.tournament.findFirst({
      where: { tournamentId: +tournamentId },
    });
    const tournamentMatchList = await prisma.tournamentMatch.findMany({
      where: {
        tournamentId: +tournamentId,
      },
    });

    return res.status(200).json([tournament, tournamentMatchList]);
  } catch (error) {
    next(error);
  }
});

export default router;
