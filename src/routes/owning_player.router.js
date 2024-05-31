import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

//강화 확률
const enhancementProbability = {
  1: 0.95, //95%
  2: 0.81, //81%
  3: 0.64, //64%
  4: 0.5, //50%
  5: 0.26, //26%
  6: 0.15, //15%
  7: 0.07, //7%
  8: 0.04, //4%
  9: 0.02, //2%
};

// 강화 API
router.post('/reinforce', authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { playerId, grade } = req.body;

    if (!playerId || !grade) {
      return res
        .status(400)
        .json({ message: '데이터를 올바르게 입력해주세요.' });
    }

    const owningPlayer = await prisma.owningPlayer.findFirst({
      where: {
        userId,
        playerId,
        grade,
      },
    });
    if (!owningPlayer) {
      return res.status(401).json({ message: '갖고 있지 않은 선수입니다.' });
    }

    if (owningPlayer.grade >= 10) {
      return res.status(400).json({ message: '최대 강화입니다.' });
    }

    const successProbability = enhancementProbability[owningPlayer.grade + 1];
    const random = Math.random();

    if (random < successProbability) {
      // 강화 성공
      await prisma.owningPlayer.update({
        data: {
          grade: owningPlayer.grade + 1,
        },
        where: {
          owningPlayerId: owningPlayer.owningPlayerId,
        },
      });
      return res.status(200).json({ message: '강화에 성공하셨습니다!!!' });
    } else {
      // 강화 실패
      return res.status(200).json({ message: '강화에 실패했습니다.' });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
