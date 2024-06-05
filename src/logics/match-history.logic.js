import { prisma } from '../utils/prisma/index.js';

// 유저의 전적을 조회하는 함수
export async function getMatchHistory(teamId) {
    // 해당 유저의 팀 정보를 조회
  const team = await prisma.team.findFirst({
    where: {
      teamId,
    },
  });
  if (!team) {
    return res.status(401).json({
      message: '해당 팀 아이디가 존재하지 않습니다.',
    });
  }

    const userTeams = await prisma.team.findMany({
      where: {
      userId: team.userId,
      },
    });

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
        userA: true,
        userB: true,
      },
      orderBy: {
      matchTime: 'desc',
    },
    });

  console.log('Matches found:', matches); // 로깅 추가

    // 각 팀의 기록을 조회하여 점수 변동을 실시간 반영
  const formattedMatches = await Promise.all(
    matches.map(async (match) => {
      const teamAScore = await prisma.record.findUnique({
        where: { userId: match.userIdA },
        select: { score: true },
      });

      const teamBScore = await prisma.record.findUnique({
        where: { userId: match.userIdB },
        select: { score: true },
      });

      return {
        teamIdA: match.teamIdA,
        teamIdB: match.teamIdB,
        resultA: match.resultA,
        resultB: match.resultB,
        scoreChangeA: match.scoreChangeA,
        scoreChangeB: match.scoreChangeB,
        teamAScore: teamAScore.score,
        teamBScore: teamBScore.score,
        matchTime: match.matchTime,
      };
    }),
  );

  return formattedMatches;
}
