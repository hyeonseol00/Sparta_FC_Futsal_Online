import { prisma } from '../utils/prisma/index.js';

async function resultMatch(tournamentId, roundName, nextRoundName, teamId) {
  const splitRound = roundName.split('-');
  let nextRoundPullName, nextRoundNum, nextMatchLength;
  if (roundName.includes('quater')) {
    nextMatchLength = 2;

    if (+splitRound[1] === 1 || +splitRound[1] === 2) {
      nextRoundNum = 1;
    } else if (+splitRound[1] === 3 || +splitRound[1] === 4) {
      nextRoundNum = 2;
    }

    nextRoundPullName = nextRoundName + '-' + nextRoundNum;
  } else if (roundName.includes('semi')) {
    nextRoundPullName = 'final';
    nextMatchLength = 1;
  }

  if (roundName === 'final') {
    // 결승일 때 우승자 처리
    await prisma.tournament.update({
      data: {
        winnerTeamId: teamId,
      },
      where: {
        tournamentId,
      },
    });

    await prisma.tournament.update({
      data: {
        currentRound: 'finish',
      },
      where: {
        tournamentId,
      },
    });

    return 'Team ' + teamId + ' 님이 최종 우승하셨습니다!';
  } else {
    const nextMatch = await prisma.tournamentMatch.findFirst({
      where: {
        tournamentId,
        roundName: nextRoundPullName,
        teamBId: null,
      },
    });

    if (nextMatch) {
      // 이미 다음 매치가 만들어져 있을 때 team B에 참여
      await prisma.tournamentMatch.update({
        data: {
          teamBId: teamId,
        },
        where: {
          tournamentMatchId: nextMatch.tournamentMatchId,
        },
      });
    } else {
      // 새로운 매치 생성
      await prisma.tournamentMatch.create({
        data: {
          tournamentId,
          roundName: nextRoundPullName,
          teamAId: teamId,
        },
      });
    }

    const nextMatchList = await prisma.tournamentMatch.findMany({
      where: {
        tournamentId,
        roundName: { contains: nextRoundName },
        AND: [
          {
            teamAId: {
              not: null,
            },
          },
          {
            teamBId: {
              not: null,
            },
          },
        ],
      },
    });

    if (nextMatchList.length === nextMatchLength) {
      await prisma.tournament.update({
        data: {
          currentRound: nextRoundName,
        },
        where: {
          tournamentId,
        },
      });
    }

    return 'Team ' + teamId + ' 님이 다음 라운드에 진출하셨습니다.';
  }
}

async function loopFind(teamAId, teamBId, curTime) {
  setTimeout(async () => {
    const t = new Deta(curTime - 30 * 1000);
    const history = await prisma.matchHistory.findFirst({
      where: {
        OR: [
          {
            teamIdA: teamAId,
            teamIdB: teamBId,
          },
          {
            teamIdA: teamBId,
            teamIdB: teamAId,
          },
        ],
        matchTime: {
          gte: t,
          lte: curTime,
        },
      },
    });

    let message;
    if (history.resultA === 'win') {
      message = await resultMatch(
        tournamentId,
        match.roundName,
        nextRoundName,
        history.teamIdA,
      );
    } else {
      message = await resultMatch(
        tournamentId,
        match.roundName,
        nextRoundName,
        history.teamIdB,
      );
    }

    return message;
  }, 10000);
}

export { resultMatch, loopFind };
