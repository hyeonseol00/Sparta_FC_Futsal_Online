import { prisma } from '../utils/prisma/index.js';

const weight = {
  speed: 0.1,
  goalDecision: 0.3,
  shootPower: 0.1,
  defence: 0.3,
  stamina: 0.2,
};

// 유저 승리 시 점수 업데이트 및 기록 저장 함수
export const handleWin = async (userId, opponentId, teamIdA, teamIdB) => {
  try {
    const userRecord = await prisma.record.findUnique({ where: { userId } });
    const opponentRecord = await prisma.record.findUnique({ where: { userId: opponentId } });

    const updatedUserScore = userRecord.score + 10;
    const updatedOpponentScore = opponentRecord.score - 10;

    await prisma.record.update({
      where: { userId },
      data: {
        score: updatedUserScore,
        win: userRecord.win + 1,
      },
    });

    await prisma.record.update({
      where: { userId: opponentId },
      data: {
        score: updatedOpponentScore,
        lose: opponentRecord.lose + 1,
      },
    });

    await prisma.matchHistory.create({
      data: {
        userIdA: userId,
        userIdB: opponentId,
        teamIdA,
        teamIdB,
        resultA: 'win',
        resultB: 'lose',
        scoreChangeA: 10,
        scoreChangeB: -10,
        matchTime: new Date(),
      },
    });

    return { message: '게임에서 승리하였습니다.', new_score: updatedUserScore };
  } catch (err) {
    throw new Error(err.message);
  }
};

// 유저 패배 시 점수 업데이트 및 기록 저장 함수
export const handleLose = async (userId, opponentId, teamIdA, teamIdB) => {
  try {
    const userRecord = await prisma.record.findUnique({ where: { userId } });
    const opponentRecord = await prisma.record.findUnique({ where: { userId: opponentId } });

    const updatedUserScore = userRecord.score - 10;
    const updatedOpponentScore = opponentRecord.score + 10;

    await prisma.record.update({
      where: { userId },
      data: {
        score: updatedUserScore,
        lose: userRecord.lose + 1,
      },
    });

    await prisma.record.update({
      where: { userId: opponentId },
      data: {
        score: updatedOpponentScore,
        win: opponentRecord.win + 1,
      },
    });

    await prisma.matchHistory.create({
      data: {
        userIdA: userId,
        userIdB: opponentId,
        teamIdA,
        teamIdB,
        resultA: 'lose',
        resultB: 'win',
        scoreChangeA: -10,
        scoreChangeB: 10,
        matchTime: new Date(),
      },
    });

    return { message: '게임에서 패배하였습니다.', new_score: updatedUserScore };
  } catch (err) {
    throw new Error(err.message);
  }
};

// 유저 무승부 시 점수 업데이트 및 기록 저장 함수
export const handleDraw = async (userId, opponentId, teamIdA, teamIdB) => {
  try {
    const userRecord = await prisma.record.findUnique({ where: { userId } });
    const opponentRecord = await prisma.record.findUnique({ where: { userId: opponentId } });

    await prisma.record.update({
      where: { userId },
      data: {
        draw: userRecord.draw + 1,
      },
    });

    await prisma.record.update({
      where: { userId: opponentId },
      data: {
        draw: opponentRecord.draw + 1,
      },
    });

    await prisma.matchHistory.create({
      data: {
        userIdA: userId,
        userIdB: opponentId,
        teamIdA,
        teamIdB,
        resultA: 'draw',
        resultB: 'draw',
        scoreChangeA: 0,
        scoreChangeB: 0,
        matchTime: new Date(),
      },
    });

    return { message: '무승부', new_score: userRecord.score };
  } catch (err) {
    throw new Error(err.message);
  }
};
