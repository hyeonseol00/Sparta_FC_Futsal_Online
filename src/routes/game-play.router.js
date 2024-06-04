import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import { Prisma } from '@prisma/client';
import { playGame } from '../logics/game-play.logic.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/play/:user_b_id', authMiddleware, async (req, res, next) => {
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
      message: `${userBRecord.rank}점 ${userB.userName}님과 매치가 성사되었습니다!`,
      result: `${await playGame(userATeamId, userBTeam.teamId)}`,
    });
  } catch (error) {
    next(error);
  }
});

//토너먼트 생성
router.post('/tournament', authMiddleware, async (req, res, next) => {
  try {
    const { user } = req.user;

    const newTournament = await prisma.tournament.create({
      data: {
        scheduled_time: new Date(),
        winner_team_id: 1,
        reward_player_id: 1,
        reward_player_grade: 0,
      }
    });

    const tournamentEntry = await prisma.tournament_entry.create({
        data: {
          entry1_team_id:null,
          entry2_team_id:null,
          entry3_team_id:null,
          entry4_team_id:null,
          entry5_team_id:null,
          entry6_team_id:null,
          entry7_team_id:null,
          entry8_team_id:null,
          tournament_id: newTournament.tournament_id,
        },
      })

    return res.status(201).json({ message: "토너먼트가 생성되었습니다." });
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
    const { teamId } = req.body;

    const tournament = await prisma.tournament.findUnique({ where: { tournament_id: +(tournamentId) } });
    const team = await prisma.team.findUnique({ where: { teamId: +(teamId) } });

    if (!tournament) return res.status(404).json({ errorMessage: '토너먼트를 찾을 수 없습니다.' });
    if (!team) return res.status(404).json({ errorMessage: '팀을 찾을 수 없습니다.' });
    const tournamentEntry = await prisma.tournament_entry.findUnique({where: { tournament_id: +(tournamentId) } });

    if (!tournamentEntry){
    return res.status(200).json({ message: '토너먼트 Entry가 존재하지 않습니다.(db 오류)' });
  }

   // 팀이 이미 토너먼트에 등록되어 있는지 확인
   const existingEntries = [
    tournamentEntry.entry1_team_id,
    tournamentEntry.entry2_team_id,
    tournamentEntry.entry3_team_id,
    tournamentEntry.entry4_team_id,
    tournamentEntry.entry5_team_id,
    tournamentEntry.entry6_team_id,
    tournamentEntry.entry7_team_id,
    tournamentEntry.entry8_team_id
  ];

  if (existingEntries.includes(+(teamId))) {
    return res.status(400).json({ errorMessage: '토너먼트에 등록된 팀입니다.' });
  }

    let updateData = {};
    if (!tournamentEntry.entry1_team_id) updateData.entry1_team_id = +(teamId);
    else if (!tournamentEntry.entry2_team_id) updateData.entry2_team_id = +(teamId);
    else if (!tournamentEntry.entry3_team_id) updateData.entry3_team_id = +(teamId);
    else if (!tournamentEntry.entry4_team_id) updateData.entry4_team_id = +(teamId);
    else if (!tournamentEntry.entry5_team_id) updateData.entry5_team_id = +(teamId);
    else if (!tournamentEntry.entry6_team_id) updateData.entry6_team_id = +(teamId);
    else if (!tournamentEntry.entry7_team_id) updateData.entry7_team_id = +(teamId);
    else if (!tournamentEntry.entry8_team_id) updateData.entry8_team_id = +(teamId);
    else return res.status(400).json({ errorMessage: '토너먼트 자리가 모두 찼습니다.' });
    
    const updatedTournamentEntry = await prisma.tournament_entry.update({
      where: { tournament_id: +(tournamentId) },
      data: updateData,
    });

    return res.status(200).json({ message: '팀이 토너먼트에 등록되었습니다.', tournamentEntry: updatedTournamentEntry });
  
  } catch (error) {
    next(error);
  }
});


export default router;
