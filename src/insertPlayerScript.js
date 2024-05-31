// insertPlayers.js
// player DB에 선수 데이터들을 삽입하는 코드 (한번만 실행하기)

import { PrismaClient } from '@prisma/client';
import playersData from './playerData';

const insertPrisma = new PrismaClient();

async function insertPlayers() {
  try {
    for (let i = 0; i < playersData.length; i++) 
        {
        const playerData = playersData[i];

        await insertPrisma.player.create({
          data: {
            playerName: playerData.playerName,
            speed: playerData.speed,
            goalDecision: playerData.goalDecision,
            shootPower: playerData.shootPower,
            defence: playerData.defence,
            stamina: playerData.stamina,
          }
      });
      console.log(`선수 ${playerData.playerName} 삽입이 완료 되었습니다.`);
    }
  } catch (error) {
    console.error('삽입 에러', error);
  } finally {
    await prisma.$disconnect();
  }
}

insertPlayers();
