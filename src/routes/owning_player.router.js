import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

//강화 확률
const enhancementProbability = {
  0: 1,
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
const explodedProbability = 0.1; //10%

// 강화 API
router.patch('/reinforce', authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { playerName, grade } = req.body;

    if (!playerName || !grade) {
      return res
        .status(400)
        .json({ message: '데이터를 올바르게 입력해주세요.' });
    }

    if (grade >= 10) {
      return res
        .status(400)
        .json({ message: '강화는 최대 10카 까지만 가능합니다.' });
    }

    const playerInfo = await prisma.player.findFirst({
      where: {
        playerName,
        grade,
      },
    });
    if (!playerInfo) {
      return res.status(401).json({ message: '존재하지 않는 선수입니다.' });
    }

    const owningPlayer = await prisma.owningPlayer.findFirst({
      where: {
        userId,
        playerId: playerInfo.playerId,
        grade,
      },
    });
    if (!owningPlayer) {
      return res.status(401).json({ message: '소유 중이지 않은 선수입니다.' });
    }

    if (owningPlayer.count < 2) {
      return res.status(401).json({
        message: '같은 선수의 카드가 두 장이 있어야 강화할 수 있습니다.',
      });
    }

    const successProbability = enhancementProbability[grade];
    const random = Math.random();

    if (owningPlayer.count === 2) {
      await prisma.owningPlayer.delete({
        where: {
          owningPlayerId: owningPlayer.owningPlayerId,
        },
      });
    } else {
      await prisma.owningPlayer.update({
        data: {
          count: owningPlayer.count - 2,
        },
        where: {
          owningPlayerId: owningPlayer.owningPlayerId,
        },
      });
    }

    let updateGrade;
    let result;

    if (random < successProbability) {
      // 강화 성공
      updateGrade = owningPlayer.grade + 1;
      result = '성공';
    } else {
      // 강화 실패
      if (owningPlayer.grade < 4) {
        updateGrade = 1;
      } else if (owningPlayer.grade < 7) {
        updateGrade = owningPlayer.grade - 3;
      } else {
        //7카 이상일 때 일정 확률로 0카
        const failRandom = Math.random();
        if (failRandom < explodedProbability) {
          updateGrade = 0;
        } else {
          updateGrade = owningPlayer.grade - 3;
        }
      }

      result = '실패';
    }

    const gradePlayerInfo = await prisma.player.findFirst({
      where: {
        playerName,
        grade: updateGrade,
      },
    });

    const owningGradePlayer = await prisma.owningPlayer.findFirst({
      where: {
        userId,
        playerId: gradePlayerInfo.playerId,
        grade: gradePlayerInfo.grade,
      },
    });

    if (owningGradePlayer) {
      // 이미 +1 카드가 보유 선수에 존재 한다면
      await prisma.owningPlayer.update({
        data: {
          count: owningGradePlayer.count + 1,
        },
        where: {
          owningPlayerId: owningGradePlayer.playerId,
        },
      });
    } else {
      // +1 카드가 보유 선수에 없다면
      await prisma.owningPlayer.create({
        data: {
          userId,
          playerId: gradePlayerInfo.playerId,
          grade: gradePlayerInfo.grade,
        },
      });
    }

    return res.status(200).json({ message: '강화에 ' + result + '했습니다.' });
  } catch (error) {
    next(error);
  }
});

// 보유 중인 선수 조회 API
router.get('/owning-player', authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const ownPlayerList = await prisma.owningPlayer.findMany({
      where: {
        NOT: {
          count: 0,
        },
        userId,
      },
      select: {
        owningPlayerId: true,
        playerId: true,
        grade: true,
        count: true,
      },
    });

    return res.status(200).json(ownPlayerList);
  } catch (error) {
    next(error);
  }
});

export default router;
