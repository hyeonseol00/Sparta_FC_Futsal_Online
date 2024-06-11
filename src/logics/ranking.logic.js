import { prisma } from '../utils/prisma/index.js';

// 유저의 랭킹을 업데이트하고 DB에 저장하는 함수
export const storeRankings = async () => {
  try {
    const rankings = await prisma.record.findMany({
      orderBy: { score: 'desc' },
    });

    const updates = rankings.map((ranking, index) => ({
      userId: ranking.userId,
      ranking: index + 1,
    }));

    const query = `
      UPDATE record
      SET ranking = CASE userId
        ${updates.map((update) => `WHEN '${update.userId}' THEN ${update.ranking}`).join('\n')}
      END
      WHERE userId IN (${updates.map((update) => `'${update.userId}'`).join(', ')});
    `;

    await prisma.$executeRawUnsafe(query);
    console.log("랭킹 업데이트가 완료되었습니다.");
  } catch (err) {
    console.error("랭킹 업데이트 중 오류가 발생했습니다 ! :", err);
  }
};

// 유저의 랭킹을 조회하는 함수
export const getRankings = async (req, res, next) => {
  try {
    await storeRankings(); // 랭킹을 조회하기 전에 항상 업데이트

    const rankings = await prisma.record.findMany({
      orderBy: { ranking: 'asc' },
      include: { user: true },
    });

    const formattedRankings = rankings.map((record) => ({
      ranking: record.ranking,
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
