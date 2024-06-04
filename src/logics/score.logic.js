import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma/index.js';

const weight = {
  speed: 0.1,
  goalDecision: 0.3,
  shootPower: 0.1,
  defence: 0.3,
  stamina: 0.2,
};

// 유저 승리 시 점수 업데이트 및 기록 저장 함수
export const handleWin = async (userId, opponentId, teamIdA, teamIdB, aScore, bScore) => {
  try {
    const userRecord = await prisma.record.findUnique({ where: { userId } });
    const opponentRecord = await prisma.record.findUnique({ where: { userId: opponentId } });

    await prisma.$transaction(
      async (tx) => {
        if (userRecord) {
          await tx.record.update({
            data: {
              win: +userRecord.win + 1,
              score: +userRecord.score + 10,
            },
            where: {
              userId,
            },
          });
        } else {
          await tx.record.create({
            data: {
              userId,
              win: 1,
              lose: 0,
              draw: 0,
              score: 1010,
              rank: 1,
            },
          });
        }

        if (opponentRecord) {
          await tx.record.update({
            data: {
              lose: +opponentRecord.lose + 1,
              score: +opponentRecord.score - 10,
            },
            where: {
              userId: opponentId,
            },
          });
        } else {
          await tx.record.create({
            data: {
              userId: opponentId,
              win: 0,
              lose: 1,
              draw: 0,
              score: 990,
              rank: 1,
            },
          });
        }

        await tx.matchHistory.create({
          data: {
            userIdA: userId,
            userIdB: opponentId,
            teamIdA,
            teamIdB,
            resultA: 'win',
            resultB: 'lose',
            scoreChangeA: userRecord.score + 10,
            scoreChangeB: opponentRecord.score - 10,
            matchTime: new Date(),
            teamAScore: aScore,
            teamBScore: bScore,
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      },
    );

    return { message: '게임에서 승리하였습니다.' };
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
