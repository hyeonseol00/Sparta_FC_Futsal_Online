import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/team/:teamId', async (req, res, next) => {
  const { teamId } = req.params;
  const findTeam = await prisma.team.findFirst({
    where: { teamId: +teamId },
  });

  if (!findTeam)
    return res.status(409).json({ message: '존재하지 않는 팀입니다.' });

  const { defenderId, strikerId, keeperId } = findTeam;
  if (!defenderId || !strikerId || !keeperId)
    return res
      .status(409)
      .json({ message: '팀 구성이 완성되지 않은 팀입니다.' });

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

  for (let id of playerIds) {
  }

  return res.status(200).json({ '팀 구성': content });
});

router.patch('/team/:teamId', authMiddleware, async (req, res, next) => {
  try {
    const { defenderId, strikerId, keeperId } = req.body;
    const { teamId } = req.params;
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

    const { isExistDefender, isExistStriker, isExistKeeper } = check;

    const playerOrder = [
      isExistDefender.playerId,
      isExistStriker.playerId,
      isExistKeeper.playerId,
    ];

    const players = await prisma.player.findMany({
      where: {
        OR: [
          { playerId: isExistDefender.playerId },
          { playerId: isExistStriker.playerId },
          { playerId: isExistKeeper.playerId },
        ],
      },
    });

    const names = playerOrder.map((playerId) =>
      players.find((player) => playerId == player.playerId),
    );

    await prisma.$transaction(
      async (tx) =>
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
        }),
    );

    return res.status(200).json({
      defender: names[0].playerName,
      striker: names[1].playerName,
      keeper: names[2].playerName,
    });
  } catch (error) {
    return res.status(401).json({ message: '잘못된 접근입니다.' });
  }
});

router.post('/team', authMiddleware, async (req, res, next) => {
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

  const newTeam = await prisma.team.create({
    data: {
      userId: req.user.userId,
      defenderId: defenderId,
      strikerId: strikerId,
      keeperId: keeperId,
    },
  });
  const newTeamId = newTeam.teamId;
  return res.status(201).json({ TeamId: newTeamId, message: '생성 성공!' });
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

export default router;
