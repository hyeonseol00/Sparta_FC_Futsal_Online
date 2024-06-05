import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/team/:teamId', async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const findTeam = await prisma.team.findFirst({
      where: { teamId: +teamId },
    });

    if (!findTeam)
      return res.status(404).json({ message: '존재하지 않는 팀입니다.' });

    const { defenderId, strikerId, keeperId } = findTeam;
    if (!defenderId || !strikerId || !keeperId)
      return res
        .status(404)
        .json({ message: '현재 팀 구성에 오류가 있습니다.' });

    const content = [];
    const playerIds = [defenderId, strikerId, keeperId];
    const pos = ['defender', 'strikerId', 'keeperId'];

    for (let i = 0; i < playerIds.length; i++) {
      const owningPlayerId = +playerIds[i];
      const findPlayer = await prisma.owningPlayer.findFirst({
        where: { owningPlayerId },
      });
      const findName = await prisma.player.findFirst({
        where: { playerId: findPlayer.playerId },
        select: { playerName: true },
      });

      content.push(
        `역활 : ${pos[i]} / 이름: ${findName.playerName} / 등급 : ${findPlayer.grade}`,
      );
    }

    return res.status(200).json({ '팀 구성': content });
  } catch (error) {
    next(error);
  }
});

router.patch('/team/:teamId', authMiddleware, async (req, res, next) => {
  try {
    const { defenderId, strikerId, keeperId } = req.body;
    const { teamId } = req.params;
    const userId = req.user.userId;

    const check = await Check(userId, defenderId, strikerId, keeperId);
    if (check == 'error_0') {
      return res
        .status(401)
        .json({ message: '해당 선수가 존재하지 않거나 내 팀이 아닙니다.' });
    } else if (check == 'error_1') {
      return res
        .status(403)
        .json({ message: '한 선수가 두개의 항목을 차지할 수 없습니다.' });
    }

    const { isExistDefender, isExistStriker, isExistKeeper } = check;

    const oldPlayersId = await prisma.team.findFirst({
      where: {
        userId: userId,
      },
      select: {
        defenderId: true,
        strikerId: true,
        keeperId: true,
      },
    });

    const oldPlayers = await OldPlayerFindforChange(userId, oldPlayersId);

    const players = await prisma.player.findMany({
      where: {
        OR: [
          { playerId: isExistDefender.playerId },
          { playerId: isExistStriker.playerId },
          { playerId: isExistKeeper.playerId },
        ],
      },
    });

    const PlayerArray = [isExistDefender, isExistStriker, isExistKeeper];
    const playerOrder = [
      isExistDefender.playerId,
      isExistStriker.playerId,
      isExistKeeper.playerId,
    ];
    const names = playerOrder.map((playerId) =>
      players.find((player) => playerId == player.playerId),
    );

    await prisma.$transaction(async (tx) => {
      await tx.team.update({
        where: {
          userId: userId,
          teamId: +teamId,
        },
        data: {
          defenderId: isExistDefender.owningPlayerId,
          strikerId: isExistStriker.owningPlayerId,
          keeperId: isExistKeeper.owningPlayerId,
        },
      });

      const newInsertPlayers = await RemoveSamePlayerId(
        PlayerArray,
        oldPlayers,
      );

      for (let i = 0; i < newInsertPlayers[0].length; i++) {
        await tx.owningPlayer.update({
          where: {
            userId: userId,
            owningPlayerId: newInsertPlayers[0][i].owningPlayerId,
          },
          data: { count: newInsertPlayers[0][i].count - 1 },
        });

        await tx.owningPlayer.update({
          where: {
            userId: userId,
            owningPlayerId: newInsertPlayers[1][i].owningPlayerId,
          },
          data: { count: newInsertPlayers[1][i].count + 1 },
        });
      }

      return res.status(200).json({
        defender: names[0].playerName,
        striker: names[1].playerName,
        keeper: names[2].playerName,
      });
    });
  } catch (error) {
    next(error);
  }
});

router.post('/team', authMiddleware, async (req, res, next) => {
  try {
    const { defenderId, strikerId, keeperId } = req.body;
    const userId = req.user.userId;

    const check = await Check(userId, defenderId, strikerId, keeperId);
    if (check == 'error_0') {
      return res
        .status(404)
        .json({ message: '해당 선수가 존재하지 않거나 내 팀이 아닙니다.' });
    } else if (check == 'error_1') {
      return res
        .status(400)
        .json({ message: '한 선수가 두개의 항목을 차지할 수 없습니다.' });
    }
    await prisma.$transaction(async (tx) => {
      const newTeam = await tx.team.create({
        data: {
          userId: req.user.userId,
          defenderId: defenderId,
          strikerId: strikerId,
          keeperId: keeperId,
        },
      });

      const idArray = [
        check.isExistDefender,
        check.isExistStriker,
        check.isExistKeeper,
      ];

      for (let i = 0; i < 3; i++) {
        await tx.owningPlayer.update({
          where: {
            userId: userId,
            owningPlayerId: idArray[i].owningPlayerId,
          },
          data: { count: idArray[i].count - 1 },
        });
      }

      return res
        .status(201)
        .json({ TeamId: newTeam.teamId, message: '생성 성공!' });
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/team/:teamId', authMiddleware, async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.userId;

    await prisma.$transaction(async (tx) => {
      const playersId = await tx.team.findFirst({
        where: {
          userId: userId,
        },
      });

      if (playersId.userId != userId)
        return res.status(401).json({ message: '권한이 없는 Id 입니다.' });

      const playersIdArray = [
        playersId.defenderId,
        playersId.strikerId,
        playersId.keeperId,
      ];

      for (let i = 0; i < 3; i++) {
        const players = await tx.owningPlayer.findFirst({
          where: {
            userId: userId,
            owningPlayerId: playersIdArray[i],
          },
        });

        await tx.owningPlayer.update({
          where: {
            userId: userId,
            owningPlayerId: playersIdArray[i],
          },
          data: {
            count: players.count + 1,
          },
        });

        await tx.team.deleteMany({
          where: {
            teamId: +teamId,
          },
        });
      }

      return res
        .status(200)
        .json({ message: teamId + '번 팀이 삭제되었습니다.' });
    });
  } catch (error) {
    next(error);
  }
});

async function Check(userId, defenderId, strikerId, keeperId) {
  const isExistDefender = await prisma.owningPlayer.findFirst({
    where: {
      userId: userId,
      owningPlayerId: defenderId,
    },
  });

  const isExistStriker = await prisma.owningPlayer.findFirst({
    where: {
      userId: userId,
      owningPlayerId: strikerId,
    },
  });

  const isExistKeeper = await prisma.owningPlayer.findFirst({
    where: {
      userId: userId,
      owningPlayerId: keeperId,
    },
  });

  if (!isExistDefender || !isExistStriker || !isExistKeeper) return 'error_0';

  if (
    isExistDefender.owningPlayerId == isExistStriker.owningPlayerId ||
    isExistStriker.owningPlayerId == isExistKeeper.owningPlayerId ||
    isExistKeeper.owningPlayerId == isExistDefender.owningPlayerId
  )
    return 'error_1';

  return { isExistDefender, isExistStriker, isExistKeeper };
}

async function OldPlayerFindforChange(userId, oldPlayersId) {
  const oldDefender = await prisma.owningPlayer.findFirst({
    where: {
      userId: userId,
      owningPlayerId: oldPlayersId.defenderId,
    },
  });

  const oldStriker = await prisma.owningPlayer.findFirst({
    where: {
      userId: userId,
      owningPlayerId: oldPlayersId.strikerId,
    },
  });

  const oldKeeper = await prisma.owningPlayer.findFirst({
    where: {
      userId: userId,
      owningPlayerId: oldPlayersId.keeperId,
    },
  });

  return [oldDefender, oldStriker, oldKeeper];
}

async function RemoveSamePlayerId(arr1, arr2) {
  for (let i = 0; i < arr1.length; i++) {
    for (let k = 0; k < arr2.length; k++) {
      if (arr1[i].owningPlayerId == arr2[k].owningPlayerId) {
        arr1.splice(i, 1);
        arr2.splice(k, 1);
        i--;
        k--;
        break;
      }
    }
  }
  return [arr1, arr2];
}

export default router;
