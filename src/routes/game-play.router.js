import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import { Prisma } from '@prisma/client';
import { playGame } from '../logics/game-play.logic.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/play/:userBId', authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;
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

router.post('/match-making/play', authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { userATeamId } = req.body;

    const userA = await prisma.user.findFirst({ where: { userId: userId } });
    const userARecord = await prisma.record.findFirst({ where: { userId: userId } });
    const matchedOpponents = await prisma.record.findMany({
      where: {
        NOT: {
          userId: userARecord.userId,
        },
        rank: {
          gte: userARecord.rank - 100,
          lte: userARecord.rank + 100,
        },
      },
    });
    if (!matchedOpponents)
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

// 토너먼트 생성
router.post('/tournament', authMiddleware, async (req, res, next) => {
  try {
    const newTournament = await prisma.tournament.create({
      data: {
        scheduledTime: new Date(),
        winnerTeamId: null,        
        rewardPlayerId: 1,         
        rewardPlayerGrade: 0,      
      }
    });

    return res.status(201).json({ message: "토너먼트가 생성되었습니다.", tournament: newTournament });
  } catch (error) {
    next(error);
  }
});

//토너먼트 방 확인 API
router.get('/tournament', async(req,res,next)=>{
  const Tournament = await prisma.tournament.findMany();
  if(!Tournament){
    return res.status(404).json({message:"토너먼트 방이 존재하지 않습니다."})
  }
  return res.status(200).json({Tournament});
})

// 토너먼트에 유저 등록
router.post('/tournament/:tournamentId/register', authMiddleware, async (req, res, next) => {
  try {
    const { tournamentId } = req.params;
    const { teamId, ready = 0 } = req.body; // 요청 본문에서 ready 값을 받아오고 기본값을 0으로 설정

    // 토너먼트 및 팀 확인
    const tournament = await prisma.tournament.findUnique({ where: { tournamentId: +tournamentId } });
    const team = await prisma.team.findUnique({ where: { teamId: +teamId } });

    if (!tournament) {
      return res.status(404).json({ errorMessage: '토너먼트를 찾을 수 없습니다.' });
    }
    if (!team) {
      return res.status(404).json({ errorMessage: '팀을 찾을 수 없습니다.' });
    }

    // 팀이 이미 토너먼트에 등록되어 있는지 확인
    const existingEntry = await prisma.tournamentEntry.findFirst({
      where: { teamId: +teamId, tournamentId: +tournamentId },
    });

    if (existingEntry) {
      return res.status(400).json({ errorMessage: '팀이 이미 토너먼트에 등록되어 있습니다.' });
    }

    // 새로운 토너먼트 엔트리 생성
    const tournamentEntry = await prisma.tournamentEntry.create({
      data: {
        tournamentId: +tournamentId,
        teamId: +teamId,
        ready: +ready,
      },
    });

    return res.status(200).json({ message: '팀이 토너먼트에 등록되었습니다.', tournamentEntry });
  } catch (error) {
    next(error);
  }
});

export default router;
