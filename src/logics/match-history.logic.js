import { prisma } from '../utils/prisma/index.js';

// 유저의 전적을 조회하는 함수
export const getMatchHistory = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // 해당 유저의 팀 정보를 조회
    const userTeams = await prisma.team.findMany({
      where: { userId: userId },
    });

    // 팀 ID 추출
    const teamIds = userTeams.map(team => team.teamId);

    // 해당 유저의 경기 기록을 조회
    const matches = await prisma.matchHistory.findMany({
      where: {
        OR: [
          { teamIdA: { in: teamIds } },
          { teamIdB: { in: teamIds } }
        ]
      },
      include: {
        teamA: true,
        teamB: true,
      },
      orderBy: { matchTime: 'desc' }
    });

    console.log("Matches found:", matches);

    // 각 팀의 기록을 조회하여 점수 변동을 실시간 반영
    const formattedMatches = await Promise.all(matches.map(async (match) => {
      const teamAScore = await prisma.record.findUnique({
        where: { userId: match.teamA.userId },
        select: { score: true }
      });

      const teamBScore = await prisma.record.findUnique({
        where: { userId: match.teamB.userId },
        select: { score: true }
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
        matchTime: match.matchTime
      };
    }));

    res.json({ matches: formattedMatches });
  } catch (error) {
    console.error(" 오류가 발생했습니다 ! :", error);
    next(error);
  }
};
