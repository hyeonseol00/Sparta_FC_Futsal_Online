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
      const findName = await prisma.player.findFirst({
        where: { playerId: playerIds[i] },
      });

      content.push(
        `역활 : ${pos[i]} / 이름: ${findName.playerName} / 등급 : ${findName.grade}`,
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

    //유저가 가진 팀인지 확인
    const isTeam = await prisma.team.findFirst({
      where: {
        userId,
        teamId: +teamId,
      },
    });

    if (!isTeam) {
      return res
        .status(404)
        .json({ message: '팀이 없거나 자신의 팀이 아닙니다.' });
    }

    const isDefender = await prisma.owningPlayer.findFirst({
      where: { userId, playerId: defenderId },
    });

    const isStriker = await prisma.owningPlayer.findFirst({
      where: { userId, playerId: defenderId },
    });

    const isKeeperId = await prisma.owningPlayer.findFirst({
      where: { userId, playerId: defenderId },
    });

    if (!isDefender || !isStriker || !isKeeperId) {
      return res
        .status(404)
        .json({ message: '해당 선수를 가지고 있지 않습니다.' });
    }

    const isRecordBeforeDefender = await prisma.owningPlayer.findFirst({
      where: { userId, playerId: isTeam.defenderId },
    });

    const isRecordBeforeStriker = await prisma.owningPlayer.findFirst({
      where: { userId, playerId: isTeam.strikerId },
    });

    const isRecordBeforeKeeperId = await prisma.owningPlayer.findFirst({
      where: { userId, playerId: isTeam.keeperId },
    });

    const recordBeforePlayers = [
      isRecordBeforeDefender,
      isRecordBeforeStriker,
      isRecordBeforeKeeperId,
    ];

    const BeforePlayersId = [
      isTeam.defenderId,
      isTeam.strikerId,
      isTeam.keeperId,
    ];
    await prisma.$transaction(
      async (tx) => {
        for (let i = 0; i < recordBeforePlayers.length; i++) {
          if (!recordBeforePlayers[i]) {
            const beforePlayerContent = await tx.player.findFirst({
              where: { playerId: BeforePlayersId[i] },
            });

            await tx.owningPlayer.create({
              data: {
                userId,
                playerId: beforePlayerContent.playerId,
                grade: beforePlayerContent.grade,
                count: 1,
              },
            });
          } else {
            await tx.owningPlayer.update({
              where: {
                owningPlayerId: recordBeforePlayers[i].owningPlayerId,
                userId,
                playerId: recordBeforePlayers[i].playerId,
              },
              data: {
                count: recordBeforePlayers[i].count + 1,
              },
            });
          }
        }

        await tx.team.update({
          where: {
            userId,
            teamId: +teamId,
          },
          data: {
            defenderId: defenderId,
            strikerId: strikerId,
            keeperId: keeperId,
          },
        });

        const insertPlayers = [defenderId, strikerId, keeperId];

        const defender = await tx.owningPlayer.update({
          where: {
            owningPlayerId: isDefender.owningPlayerId,
            userId,
            playerId: defenderId,
          },
          data: {
            count: isDefender.count - 1,
          },
        });

        const striker = await tx.owningPlayer.update({
          where: {
            owningPlayerId: isStriker.owningPlayerId,
            userId,
            playerId: defenderId,
          },
          data: {
            count: isStriker.count - 1,
          },
        });

        const keeper = await tx.owningPlayer.update({
          where: {
            owningPlayerId: isKeeperId.owningPlayerId,
            userId,
            playerId: defenderId,
          },
          data: {
            count: isKeeperId.count - 1,
          },
        });
        const isCountPlayer = [defender, striker, keeper];

        for (let i = 0; i < insertPlayers.length; i++) {
          if (isCountPlayer[i].count < 1) {
            await tx.owningPlayer.deleteMany({
              where: { userId, playerId: defenderId },
            });
          }
        }

        const nowPlayerNames = [];
        for (let i = 0; i < insertPlayers.length; i++) {
          const Name = await tx.player.findFirst({
            where: { playerId: insertPlayers[i] },
          });
          nowPlayerNames.push(Name.playerName);
        }

        return res.status(200).json({
          defender: nowPlayerNames[0].playerName,
          defender: nowPlayerNames[1].playerName,
          defender: nowPlayerNames[2].playerName,
        });
      },
      { maxWait: 5000, timeout: 10000 },
    );
  } catch (error) {
    next(error);
  }
});

router.post('/team', authMiddleware, async (req, res, next) => {
  try {
    const { defenderId, strikerId, keeperId } = req.body;
    const userId = req.user.userId;

    const check = await TakePlayer(userId, defenderId, strikerId, keeperId);
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
        const players = await tx.owningPlayer.update({
          where: {
            userId: userId,
            owningPlayerId: idArray[i].owningPlayerId,
          },
          data: { count: idArray[i].count - 1 },
        });
        ZeroCountPlayersDelete(players);
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

async function TakePlayer(userId, defenderId, strikerId, keeperId) {
  const isExistDefender = await prisma.owningPlayer.findFirst({
    where: {
      userId: userId,
      playerId: defenderId,
    },
  });

  const isExistStriker = await prisma.owningPlayer.findFirst({
    where: {
      userId: userId,
      playerId: strikerId,
    },
  });

  const isExistKeeper = await prisma.owningPlayer.findFirst({
    where: {
      userId: userId,
      playerId: keeperId,
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

async function OldPlayers(oldPlayersIds) {
  const oldDefender = await prisma.player.findFirst({
    where: {
      playerId: oldPlayersIds.defenderId,
    },
  });

  const oldStriker = await prisma.player.findFirst({
    where: {
      playerId: oldPlayersIds.strikerId,
    },
  });

  const oldKeeper = await prisma.player.findFirst({
    where: {
      playerId: oldPlayersIds.keeperId,
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

async function ZeroCountPlayersDelete(player) {
  if (player.count === 0) {
    await prisma.owningPlayer.delete({
      where: {
        owningPlayerId: player.owningPlayerId,
      },
    });
  }
}

export default router;
