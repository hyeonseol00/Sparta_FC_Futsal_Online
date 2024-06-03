import { prisma } from '../utils/prisma/index.js';

export const getRankings = async (req, res) => {
  try {
    const rankings = await prisma.record.findMany({
      orderBy: { score: 'desc' },
      include: { user: true },
    });

    const formattedRankings = rankings.map((record, index) => ({
      rank: index + 1, 
       // 점수가 높은 순서대로 정렬된 결과에서 순위 매기기 , index 는 0부터 시작 1을 더해 순위로 변환 -> 이렇게 하면 점수가 높은 순으로 순위표 작성
      user_id: record.userId,
      score: record.score,
      wins: record.win,
      draws: record.draw,
      losses: record.lose,
    }));

    res.json({ rankings: formattedRankings });
  } catch (err) {
    next(err); // 오류 발생 시 중앙 오류 처리 미들웨어로 전달
  }
};