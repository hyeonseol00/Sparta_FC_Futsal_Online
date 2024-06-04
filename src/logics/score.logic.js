import { prisma } from '../utils/prisma/index.js';

const weight = {
  speed: 0.1,
  goalDecision: 0.3,
  shootPower: 0.1,
  defence: 0.3,
  stamina: 0.2,
};

const updateRecords = async (userId, opponentId, userScoreChange, opponentScoreChange, userResult, opponentResult, teamIdA, teamIdB) => {
  const userRecord = await prisma.record.findUnique({ where: { userId } });
  const opponentRecord = await prisma.record.findUnique({ where: { userId: opponentId } });

  await prisma.$transaction([
    prisma.record.update({
      where: { userId },
      data: {
        score: userRecord.score + userScoreChange,
        win: userResult === 'win' ? userRecord.win + 1 : userRecord.win,
        lose: userResult === 'lose' ? userRecord.lose + 1 : userRecord.lose,
        draw: userResult === 'draw' ? userRecord.draw + 1 : userRecord.draw,
      },
    }),
    prisma.record.update({
      where: { userId: opponentId },
      data: {
        score: opponentRecord.score + opponentScoreChange,
        win: opponentResult === 'win' ? opponentRecord.win + 1 : opponentRecord.win,
        lose: opponentResult === 'lose' ? opponentRecord.lose + 1 : opponentRecord.lose,
        draw: opponentResult === 'draw' ? opponentRecord.draw + 1 : opponentRecord.draw,
      },
    }),
    prisma.matchHistory.create({
      data: {
        userIdA: userId,
        userIdB: opponentId,
        teamIdA,
        teamIdB,
        resultA: userResult,
        resultB: opponentResult,
        scoreChangeA: userScoreChange,
        scoreChangeB: opponentScoreChange,
        matchTime: new Date(),
      },
    })
  ]);
};

export const handleWin = async (userId, opponentId, teamIdA, teamIdB) => {
  try {
    await updateRecords(userId, opponentId, 10, -10, 'win', 'lose', teamIdA, teamIdB);
    return { message: '게임에서 승리하였습니다.', new_score: userRecord.score + 10 };
  } catch (err) {
    throw new Error(err.message);
  }
};

export const handleLose = async (userId, opponentId, teamIdA, teamIdB) => {
  try {
    await updateRecords(userId, opponentId, -10, 10, 'lose', 'win', teamIdA, teamIdB);
    return { message: '게임에서 패배하였습니다.', new_score: userRecord.score - 10 };
  } catch (err) {
    throw new Error(err.message);
  }
};

export const handleDraw = async (userId, opponentId, teamIdA, teamIdB) => {
  try {
    await updateRecords(userId, opponentId, 0, 0, 'draw', 'draw', teamIdA, teamIdB);
    return { message: '무승부', new_score: userRecord.score };
  } catch (err) {
    throw new Error(err.message);
  }
};
