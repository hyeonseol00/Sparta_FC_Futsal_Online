import prisma from '../utils/prisma/index.js';

export const handleWin = async (user_id) => {
  try {
    const userRecord = await prisma.record.findUnique({ where: { userId: user_id } });

    const updatedRecord = await prisma.record.update({
      where: { userId: user_id },
      data: {
        score: userRecord.score + 10,
        win: userRecord.win + 1,
      },
    });

    return { message: '게임에서 승리하였습니다.', new_score: updatedRecord.score };
  } catch (err) {
    throw new Error(err.message);
  }
};

export const handleLose = async (user_id) => {
  try {
    const userRecord = await prisma.record.findUnique({ where: { userId: user_id } });

    const updatedRecord = await prisma.record.update({
      where: { userId: user_id },
      data: {
        score: userRecord.score - 10,
        lose: userRecord.lose + 1,
      },
    });

    return { message: '게임에서 패배하였습니다.', new_score: updatedRecord.score };
  } catch (err) {
    throw new Error(err.message);
  }
};

export const handleDraw = async (user_id) => {
  try {
    const userRecord = await prisma.record.findUnique({ where: { userId: user_id } });

    const updatedRecord = await prisma.record.update({
      where: { userId: user_id },
      data: {
        draw: userRecord.draw + 1,
      },
    });

    return { message: '무승부', new_score: updatedRecord.score };
  } catch (err) {
    throw new Error(err.message);
  }
};
