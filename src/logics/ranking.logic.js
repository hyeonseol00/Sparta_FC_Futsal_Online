import { prisma } from '../utils/prisma/index.js';

export const getRankings = async (req, res, next) => {
  try {
    const rankings = await prisma.record.findMany({
      orderBy: { score: 'desc' },
      include: { user: true },
    });

    const formattedRankings = rankings.map((record, index) => ({
      rank: index + 1,
      user_id: record.userId,
      user_name: record.user.userName, 
      score: record.score,
      wins: record.win,
      draws: record.draw,
      losses: record.lose,
    }));

    res.json({ rankings: formattedRankings });
  } catch (err) {
    console.error(" 오류가 발생했습니다 ! :", err);
    next(err);
  }
};
