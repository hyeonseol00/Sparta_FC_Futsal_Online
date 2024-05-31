import { prisma } from '../utils/prisma/index.js';
import { Prisma } from '@prisma/client';

class Team {
  constructor(strikerId, defenderId, keeperId) {
    this.striker = prisma.player.findFirst({ where: { playerId: +strikerId } });
    this.defender = prisma.player.findFirst({
      where: { playerId: +defenderId },
    });
    this.keeper = prisma.player.findFirst({ where: { playerId: +keeperId } });
  }
}

const weight = {
  speed: 0.1,
  goalDecision: 0.3,
  shootPower: 0.1,
  defeence: 0.3,
  stamina: 0.2,
};

async function playGame(userATeamId, userBTeanId) {
  const userATeamList = await prisma.team.findFirst({
    where: { teamId: +userATeamId },
  });
  const userBTeamList = await prisma.team.findFirst({
    where: { teamId: +userBTeanId },
  });

  const userATeam = new Team(...userATeamList);
  const userBTeam = new Team(...userBTeamList);

  // 스탯 졍규화

  // 룰렛
}

export { playGame };
