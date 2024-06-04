import { prisma } from '../utils/prisma/index.js';

// 유저의 전적을 조회하는 함수
export const getMatchHistory = async (req, res, next) => {
  try {
    const { userId } = req.params;

    console.log("Fetching match history for userId:", userId);  // 로깅 추가

    // 해당 유저의 경기 기록을 조회
    const matches = await prisma.matchHistory.findMany({
      where: {
        OR: [
          { userIdA: userId },
          { userIdB: userId }
        ]
      },
      include: {
        userA: true,
        userB: true,
        teamA: true,
        teamB: true
      },
      orderBy: {
        matchTime: 'desc'
      }
    });

    console.log("Matches found:", matches);  // 로깅 추가

    // 조회된 경기 기록을 포맷
    const formattedMatches = matches.map(match => ({
      userIdA: match.userIdA,
      userIdB: match.userIdB,
      teamIdA: match.teamIdA,
      teamIdB: match.teamIdB,
      resultA: match.resultA,
      resultB: match.resultB,
      scoreChangeA: match.scoreChangeA,
      scoreChangeB: match.scoreChangeB,
      matchTime: match.matchTime
    }));

    res.json({ matches: formattedMatches });
  } catch (error) {
    console.error("Error fetching match history:", error);  // 에러 로그 잡기 
    next(error);
  }
};
