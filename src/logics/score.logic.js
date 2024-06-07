import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma/index.js';

// 유저 승리 시 점수 업데이트 및 기록 저장 함수
export const handleWin = async (userId, opponentId, teamIdA, teamIdB, aScore, bScore) => {
  try {
    const [userRecord, opponentRecord] = await prisma.$transaction([
      prisma.record.findUnique({ where: { userId } }),
      prisma.record.findUnique({ where: { userId: opponentId } })
    ]);

    await prisma.$transaction(async (tx) => {
      const updates = [
        { userId, win: userRecord ? userRecord.win + 1 : 1, score: userRecord ? userRecord.score + 10 : 1010 },
        { userId: opponentId, lose: opponentRecord ? opponentRecord.lose + 1 : 1, score: opponentRecord ? opponentRecord.score - 10 : 990 }
      ];

      const query = `
        UPDATE "record"
        SET win = CASE userId 
          ${updates.map(update => `WHEN '${update.userId}' THEN ${update.win}`).join(' ')}
        END,
        lose = CASE userId 
          ${updates.map(update => `WHEN '${update.userId}' THEN ${update.lose}`).join(' ')}
        END,
        score = CASE userId 
          ${updates.map(update => `WHEN '${update.userId}' THEN ${update.score}`).join(' ')}
        END
        WHERE userId IN (${updates.map(update => `'${update.userId}'`).join(', ')});
      `;

      await tx.$executeRawUnsafe(query);

      await tx.matchHistory.create({
        data: {
          teamIdA,
          teamIdB,
          resultA: 'win',
          resultB: 'lose',
          scoreChangeA: userRecord ? userRecord.score + 10 : 1010,
          scoreChangeB: opponentRecord ? opponentRecord.score - 10 : 990,
          matchTime: new Date(),
          teamAScore: aScore,
          teamBScore: bScore,
        }
      });
    });

    return { message: '게임에서 승리하였습니다.' };
  } catch (err) {
    throw new Error(err.message);
  }
};

// 유저 패배 시 점수 업데이트 및 기록 저장 함수
export const handleLose = async (userId, opponentId, teamIdA, teamIdB) => {
  try {
    const [userRecord, opponentRecord] = await prisma.$transaction([
      prisma.record.findUnique({ where: { userId } }),
      prisma.record.findUnique({ where: { userId: opponentId } })
    ]);

    await prisma.$transaction(async (tx) => {
      const updates = [
        { userId, lose: userRecord ? userRecord.lose + 1 : 1, score: userRecord ? userRecord.score - 10 : 990 },
        { userId: opponentId, win: opponentRecord ? opponentRecord.win + 1 : 1, score: opponentRecord ? opponentRecord.score + 10 : 1010 }
      ];

      const query = `
        UPDATE "record"
        SET win = CASE userId 
          ${updates.map(update => `WHEN '${update.userId}' THEN ${update.win}`).join(' ')}
        END,
        lose = CASE userId 
          ${updates.map(update => `WHEN '${update.userId}' THEN ${update.lose}`).join(' ')}
        END,
        score = CASE userId 
          ${updates.map(update => `WHEN '${update.userId}' THEN ${update.score}`).join(' ')}
        END
        WHERE userId IN (${updates.map(update => `'${update.userId}'`).join(', ')});
      `;

      await tx.$executeRawUnsafe(query);

      await tx.matchHistory.create({
        data: {
          teamIdA,
          teamIdB,
          resultA: 'lose',
          resultB: 'win',
          scoreChangeA: userRecord ? userRecord.score - 10 : 990,
          scoreChangeB: opponentRecord ? opponentRecord.score + 10 : 1010,
          matchTime: new Date(),
          teamAScore: userRecord ? userRecord.score - 10 : 990,
          teamBScore: opponentRecord ? opponentRecord.score + 10 : 1010,
        }
      });
    });

    return { message: '게임에서 패배하였습니다.' };
  } catch (err) {
    throw new Error(err.message);
  }
};

// 유저 무승부 시 점수 업데이트 및 기록 저장 함수
export const handleDraw = async (userId, opponentId, teamIdA, teamIdB) => {
  try {
    const [userRecord, opponentRecord] = await prisma.$transaction([
      prisma.record.findUnique({ where: { userId } }),
      prisma.record.findUnique({ where: { userId: opponentId } })
    ]);

    await prisma.$transaction(async (tx) => {
      const updates = [
        { userId, draw: userRecord ? userRecord.draw + 1 : 1 },
        { userId: opponentId, draw: opponentRecord ? opponentRecord.draw + 1 : 1 }
      ];

      const query = `
        UPDATE "record"
        SET draw = CASE userId 
          ${updates.map(update => `WHEN '${update.userId}' THEN ${update.draw}`).join(' ')}
        END
        WHERE userId IN (${updates.map(update => `'${update.userId}'`).join(', ')});
      `;

      await tx.$executeRawUnsafe(query);

      await tx.matchHistory.create({
        data: {
          teamIdA,
          teamIdB,
          resultA: 'draw',
          resultB: 'draw',
          scoreChangeA: 0,
          scoreChangeB: 0,
          matchTime: new Date(),
          teamAScore: userRecord.score,
          teamBScore: opponentRecord.score,
        }
      });
    });

    return { message: '무승부', new_score: userRecord.score };
  } catch (err) {
    throw new Error(err.message);
  }
};
