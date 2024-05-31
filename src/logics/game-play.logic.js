import { prisma } from '../utils/prisma/index.js';
import { Prisma } from '@prisma/client';

const weight = {
  speed: 0.1,
  goalDecision: 0.3,
  shootPower: 0.1,
  defence: 0.3,
  stamina: 0.2,
};

async function playGame(userATeamId, userBTeamId) {
  const userATeamList = await prisma.team.findFirst({ where: { teamId: +userATeamId } });
  const userBTeamList = await prisma.team.findFirst({ where: { teamId: +userBTeamId } });

  const userATeamOwningPlayer = {
    striker: await prisma.owningPlayer.findFirst({ where: { owningPlayerId: +userATeamList.strikerId } }),
    defender: await prisma.owningPlayer.findFirst({ where: { owningPlayerId: +userATeamList.defenderId } }),
    keeper: await prisma.owningPlayer.findFirst({ where: { owningPlayerId: +userATeamList.keeperId } }),
  };
  const userBTeamOwningPlayer = {
    striker: await prisma.owningPlayer.findFirst({ where: { owningPlayerId: +userBTeamList.strikerId } }),
    defender: await prisma.owningPlayer.findFirst({ where: { owningPlayerId: +userBTeamList.defenderId } }),
    keeper: await prisma.owningPlayer.findFirst({ where: { owningPlayerId: +userBTeamList.keeperId } }),
  };
  const userATeam = {
    striker: await prisma.player.findFirst({ where: { playerId: +userATeamOwningPlayer.striker.playerId } }),
    defender: await prisma.player.findFirst({ where: { playerId: +userATeamOwningPlayer.defender.playerId } }),
    keeper: await prisma.player.findFirst({ where: { playerId: +userATeamOwningPlayer.keeper.playerId } }),
  };
  const userBTeam = {
    striker: await prisma.player.findFirst({ where: { playerId: +userBTeamOwningPlayer.striker.playerId } }),
    defender: await prisma.player.findFirst({ where: { playerId: +userBTeamOwningPlayer.defender.playerId } }),
    keeper: await prisma.player.findFirst({ where: { playerId: +userBTeamOwningPlayer.keeper.playerId } }),
  };

  // 스탯 정규화
  const userATeamPower =
    userATeam.striker.speed * weight.speed +
    userATeam.striker.goalDecision * weight.goalDecision +
    userATeam.striker.shootPower * weight.shootPower +
    userATeam.striker.defence * weight.defence +
    userATeam.striker.stamina * weight.stamina +
    userATeamOwningPlayer.striker.grade +
    userATeam.defender.speed * weight.speed +
    userATeam.defender.goalDecision * weight.goalDecision +
    userATeam.defender.shootPower * weight.shootPower +
    userATeam.defender.defence * weight.defence +
    userATeam.defender.stamina * weight.stamina +
    userATeamOwningPlayer.defender.grade +
    userATeam.keeper.speed * weight.speed +
    userATeam.keeper.goalDecision * weight.goalDecision +
    userATeam.keeper.shootPower * weight.shootPower +
    userATeam.keeper.defence * weight.defence +
    userATeam.keeper.stamina * weight.stamina +
    userATeamOwningPlayer.keeper.grade;

  const userBTeamPower =
    userBTeam.striker.speed * weight.speed +
    userBTeam.striker.goalDecision * weight.goalDecision +
    userBTeam.striker.shootPower * weight.shootPower +
    userBTeam.striker.defence * weight.defence +
    userBTeam.striker.stamina * weight.stamina +
    userBTeamOwningPlayer.striker.grade +
    userBTeam.defender.speed * weight.speed +
    userBTeam.defender.goalDecision * weight.goalDecision +
    userBTeam.defender.shootPower * weight.shootPower +
    userBTeam.defender.defence * weight.defence +
    userBTeam.defender.stamina * weight.stamina +
    userBTeamOwningPlayer.defender.grade +
    userBTeam.keeper.speed * weight.speed +
    userBTeam.keeper.goalDecision * weight.goalDecision +
    userBTeam.keeper.shootPower * weight.shootPower +
    userBTeam.keeper.defence * weight.defence +
    userBTeam.keeper.stamina * weight.stamina +
    userBTeamOwningPlayer.keeper.grade;

  // 룰렛
  const scoreSum = userATeamPower + userBTeamPower;
  const userA = await prisma.user.findFirst({ where: { userId: userATeamList.userId } });
  const userB = await prisma.user.findFirst({ where: { userId: userBTeamList.userId } });
  const userARecord = await prisma.record.findFirst({ where: { userId: userATeamList.userId } });
  const userBRecord = await prisma.record.findFirst({ where: { userId: userBTeamList.userId } });

  const aScore = Math.floor(Math.random() * 4) + 2; // 2에서 5 사이
  const bScore = Math.floor(Math.random() * Math.min(3, aScore)); // aScore보다 작은 값을 설정

  const randomValue = Math.random() * scoreSum;
  if (randomValue < userATeamPower) {
    await prisma.$transaction(
      async (tx) => {
        if (userARecord) {
          await tx.record.update({
            data: {
              score: +userARecord.score + aScore,
              win: +userARecord.win + 1,
            },
            where: {
              userId: userATeamList.userId,
            },
          });
        } else {
          await tx.record.create({
            data: {
              userId: userATeamList.userId,
              score: aScore,
              win: 1,
              lose: 0,
              draw: 0,
              rank: 1000,
            },
          });
        }

        if (userBRecord) {
          await tx.record.update({
            data: {
              score: +userBRecord.score + bScore,
              win: +userBRecord.lose + 1,
            },
            where: {
              userId: userBTeamList.userId,
            },
          });
        } else {
          await tx.record.create({
            data: {
              userId: userBTeamList.userId,
              score: bScore,
              win: 0,
              lose: 1,
              draw: 0,
              rank: 1000,
            },
          });
        }
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      },
    );

    return `${userA.userName} 승리: ${userA.userName} ${aScore} - ${bScore} ${userB.userName}`;
  } else {
    await prisma.$transaction(
      async (tx) => {
        if (userBRecord) {
          await tx.record.update({
            data: {
              score: +userBRecord.score + aScore,
              win: +userBRecord.win + 1,
            },
            where: {
              userId: userBTeamList.userId,
            },
          });
        } else {
          await tx.record.create({
            data: {
              userId: userBTeamList.userId,
              score: aScore,
              win: 1,
              lose: 0,
              draw: 0,
              rank: 1000,
            },
          });
        }

        if (userARecord) {
          await tx.record.update({
            data: {
              score: +userARecord.score + bScore,
              win: +userARecord.lose + 1,
            },
            where: {
              userId: userATeamList.userId,
            },
          });
        } else {
          await tx.record.create({
            data: {
              userId: userATeamList.userId,
              score: bScore,
              win: 0,
              lose: 1,
              draw: 0,
              rank: 1000,
            },
          });
        }
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      },
    );

    return `${userB.userName} 승리: ${userB.userName} ${aScore} - ${bScore} ${userA.userName}`;
  }
}

export { playGame };
