// insertPlayers.js
// player DB에 선수 데이터들을 삽입하는 코드 (한번만 실행하기)

import dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../utils/prisma/index.js';
import playersData from '../datas/player.data.js';

async function insertPlayers() {
  try {
    for (let i = 0; i < playersData.length; i++) {
      const playerData = playersData[i];

      let plus;
      for (let j = 0; j <= 10; j++) {
        if (j < 2) {
          plus = 0;
        } else if (j < 5) {
          plus += 1;
        } else if (j < 8) {
          plus += 2;
        } else if (j < 10) {
          plus += 3;
        } else {
          plus += 4;
        }

        await prisma.player.create({
          data: {
            playerName: playerData.player_name,
            speed: playerData.speed + plus,
            goalDecision: playerData.goal_decision + plus,
            shootPower: playerData.shoot_power + plus,
            defence: playerData.defence + plus,
            stamina: playerData.stamina + plus,
            grade: j,
          },
        });
        console.log(`선수 ${playerData.player_name} 삽입이 완료 되었습니다.`);
      }
    }
  } catch (error) {
    console.error('삽입 에러', error);
  } finally {
    await prisma.$disconnect();
  }
}

insertPlayers();
