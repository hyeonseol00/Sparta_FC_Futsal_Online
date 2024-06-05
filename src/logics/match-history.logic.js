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
      teamA: true,
      teamB: true,
    },
    orderBy: {
      matchTime: 'desc',
    },
  });

  if (matches.length === 0) {
    throw new Error('경기 기록이 없습니다!');
  }

  console.log('Matches found:', matches); // 로깅 추가

  // 각 팀의 기록을 조회하여 점수 변동을 실시간 반영
  const formattedMatches = await Promise.all(
    matches.map(async (match) => {
      const teamAScore = await prisma.record.findUnique({
        where: { userId: match.teamA.userId },
        select: { score: true },
      });

      const teamBScore = await prisma.record.findUnique({
        where: { userId: match.teamB.userId },
        select: { score: true },
      });

      return {
        teamIdA: match.teamIdA,
        teamIdB: match.teamIdB,
        resultA: match.resultA,
        resultB: match.resultB,
        scoreChangeA: match.scoreChangeA,
        scoreChangeB: match.scoreChangeB,
        teamAScore: teamAScore?.score || 0,
        teamBScore: teamBScore?.score || 0,
        matchTime: match.matchTime,
      };
    })
  );

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
