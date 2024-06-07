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
    const userATeam = await prisma.team.findFirst({
      where: { teamId: userATeamId },
    });
    const userBTeam = await prisma.team.findFirst({
      where: { teamId: userBTeamId },
    });

    if (!userA)
      return res
        .status(404)
        .json({ errorMessage: '유저 정보를 불러올 수 없습니다.' });
    else if (!userATeam)
      return res
        .status(404)
        .json({ errorMessage: '유저의 팀을 찾을 수 없습니다.' });
    else if (!userBTeam)
      return res
        .status(404)
        .json({ errorMessage: '상대방 팀을 찾을 수 없습니다.' });
    else if (userA.userId != userATeam.userId)
      return res
        .status(403)
        .json({ errorMessage: `${userA.userName}님이 소유한 팀이 아닙니다!` });

    return res
      .status(201)
      .json({ message: await playGame(userATeamId, userBTeamId) });
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
      return res
        .status(404)
        .json({ errorMessage: '매치 조건에 맞는 유저를 찾을 수 없습니다.' });
    const userBRecord =
      matchedOpponents[Math.floor(Math.random() * matchedOpponents.length)];
    const userB = await prisma.user.findFirst({
      where: { userId: userBRecord.userId },
    });

    const userATeam = await prisma.team.findFirst({
      where: { teamId: userATeamId },
    });
    const userBTeams = await prisma.team.findMany({
      where: { userId: userBRecord.userId },
    });
    if (!userBTeams)
      return res
        .status(404)
        .json({ errorMessage: '상대방 팀을 찾을 수 없습니다.' });
    const userBTeam = userBTeams[Math.floor(Math.random() * userBTeams.length)];

    if (!userA)
      return res
        .status(404)
        .json({ errorMessage: '유저 정보를 불러올 수 없습니다.' });
    else if (!userATeam)
      return res
        .status(404)
        .json({ errorMessage: '유저의 팀을 찾을 수 없습니다.' });
    else if (userA.userId != userATeam.userId)
      return res
        .status(403)
        .json({ errorMessage: `${userA.userName}님이 소유한 팀이 아닙니다!` });

    return res.status(201).json({
      message: `${userBRecord.score}점 ${userB.userName}님과 매치가 성사되었습니다!`,
      result: `${await playGame(userATeamId, userBTeam.teamId)}`,
    });
  } catch (error) {
    next(error);
  }
});

// 토너먼트 생성
router.post('/tournament', authMiddleware, async (req, res, next) => {
  try {
    const grade5Players = await prisma.player.findMany({
      where: { grade: 5 },
    });

    const randIdx = Math.floor(Math.random() * grade5Players.length);
    const rewardPlayerId = grade5Players[randIdx].playerId;
    const rewardPlayerGrade = grade5Players[randIdx].grade;

    const newTournament = await prisma.tournament.create({
      data: {
        scheduledTime: new Date(),
        winnerTeamId: null,
        rewardPlayerId,
        rewardPlayerGrade,
      },
    });

    return res.status(201).json({
      message: '토너먼트가 생성되었습니다.',
      tournament: newTournament,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/tournament', async (req, res, next) => {
  try {
    const tournaments = await prisma.tournament.findMany();
    const tournamentEntries = await prisma.tournamentEntry.findMany();

    if (!tournaments) {
      return res
        .status(404)
        .json({ message: '토너먼트 방이 존재하지 않습니다.' });
    }

    const tournamentInfo = [];

    for (let i = 0; i < tournaments.length; i++) {
      const tournament = tournaments[i];

      let currentParticipants = 0;
      for (let j = 0; j < tournamentEntries.length; j++) {
        if (tournamentEntries[j].tournamentId === tournament.tournamentId) {
          currentParticipants++;
        }
      }

      const maxParticipants = 8;
      const participantStatus = `(${currentParticipants}/${maxParticipants})`;

      tournamentInfo.push({
        tournament_id: tournament.tournamentId,
        participants: participantStatus,
      });
    }

    return res.status(200).json({ tournamentInfo });
  } catch (error) {
    next(error);
  }
});

// 토너먼트에 유저 등록
router.post(
  '/tournament/:tournamentId/register',
  authMiddleware,
  async (req, res, next) => {
    try {
      const { tournamentId } = req.params;
      const { teamId, ready = 0 } = req.body; //ready default 값으로 0

      // 토너먼트 및 팀 확인
      const tournament = await prisma.tournament.findUnique({
        where: { tournamentId: +tournamentId },
      });
      const team = await prisma.team.findUnique({ where: { teamId: +teamId } });

      if (!tournament) {
        return res
          .status(404)
          .json({ errorMessage: '토너먼트를 찾을 수 없습니다.' });
      }
      if (!team) {
        return res.status(404).json({ errorMessage: '팀을 찾을 수 없습니다.' });
      }

      // 팀이 이미 토너먼트에 등록되어 있는지 확인
      const existingEntry = await prisma.tournamentEntry.findFirst({
        where: { teamId: +teamId, tournamentId: +tournamentId },
      });

      if (existingEntry) {
        return res
          .status(400)
          .json({ errorMessage: '팀이 이미 토너먼트에 등록되어 있습니다.' });
      }

      // 새로운 토너먼트 엔트리 생성
      const tournamentEntry = await prisma.tournamentEntry.create({
        data: {
          tournamentId: +tournamentId,
          teamId: +teamId,
          ready: +ready,
        },
      });

      return res
        .status(200)
        .json({ message: '팀이 토너먼트에 등록되었습니다.', tournamentEntry });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
