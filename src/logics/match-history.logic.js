import { prisma } from '../utils/prisma/index.js';

// 유저의 전적을 조회하는 함수
async function getMatchHistory(userId) {
  // 유효한 userId 인지 확인
  const user = await prisma.user.findUnique({
    where: { userId: userId },
  });

  if (!user) {
    throw new Error('유효하지 않은 userId 입니다.');
  }

  const userTeams = await prisma.team.findMany({
    where: {
      userId: userId,
    },
    select: { teamId: true },
  });

  if (userTeams.length === 0) {
    throw new Error('경기 기록이 없습니다!');
  }

  // 팀 ID 추출
  const teamIds = userTeams.map((team) => team.teamId);

  // 해당 유저의 경기 기록을 조회
  const matches = await prisma.matchHistory.findMany({
    where: {
      OR: [{ teamIdA: { in: teamIds } }, { teamIdB: { in: teamIds } }],
    },
    include: {
      teamA: { select: { userId: true } },
      teamB: { select: { userId: true } },
    },
    orderBy: { matchTime: 'desc' },
  });

  if (matches.length === 0) {
    throw new Error('경기 기록이 없습니다!');
  }

  const userIds = matches.flatMap(match => [match.teamA.userId, match.teamB.userId]);
  const userScores = await prisma.record.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true, score: true },
  });

  const scoreMap = new Map(userScores.map(user => [user.userId, user.score]));

  // 각 팀의 기록을 조회하여 점수 변동을 실시간 반영
  const formattedMatches = matches.map((match) => ({
    teamIdA: match.teamIdA,
    teamIdB: match.teamIdB,
    resultA: match.resultA,
    resultB: match.resultB,
    scoreChangeA: match.scoreChangeA,
    scoreChangeB: match.scoreChangeB,
    teamAScore: scoreMap.get(match.teamA.userId) || 0,
    teamBScore: scoreMap.get(match.teamB.userId) || 0,
    matchTime: match.matchTime,
  }));

  return formattedMatches;
}

async function getTournamentMatchHistory(teamAId, teamBId, curTime) {
  const t = curTime - 10 * 1000;
  const history = await prisma.matchHistory.findFirst({
    where: {
      OR: [
        { teamIdA: { in: teamAId }, teamIdB: { in: teamBId } },
        { teamIdA: { in: teamBId }, teamIdB: { in: teamAId } },
      ],
      matchTime: {
        gte: t,
        lte: curTime,
      },
    },
  });

  return history;
}

export { getMatchHistory, getTournamentMatchHistory };
