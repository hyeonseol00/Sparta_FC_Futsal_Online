import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { Prisma } from '@prisma/client';

const router = express.Router();

// 회원가입 API
router.post('/sign-up', async (req, res, next) => {
  try {
    const { userId, userPw, userPwCheck, userName } = req.body;

    if (!userId || !userPw || !userPwCheck || !userName) {
      return res.status(400).json({ message: '데이터를 올바르게 입력해주세요.' });
    }

    //소문자 + 숫자 vaildation
    const idVaildation = /^[a-z0-9]+$/;
    if (!idVaildation.test(userId)) {
      return res.status(400).json({ message: '아이디는 소문자 + 숫자 조합으로 만들어주세요.' });
    }

    if (userPw.length < 6) {
      return res.status(400).json({ message: '비밀번호는 6자 이상으로 만들어주세요.' });
    }

    if (userPw !== userPwCheck) {
      return res.status(400).json({ message: '비밀번호 확인이 일치하지 않습니다.' });
    }

    const isExistUser = await prisma.user.findFirst({
      where: {
        OR: [
          {
            userId,
          },
          {
            userName,
          },
        ],
      },
    });
    if (isExistUser) {
      return res.status(409).json({ message: '이미 존재하는 유저입니다.' });
    }

    const hashedPw = await bcrypt.hash(userPw, 10);
    let user;
    await prisma.$transaction(
      async (tx) => {
        user = await tx.user.create({
          data: {
            userId,
            userName,
            userPw: hashedPw,
          },
          select: {
            userId: true,
            userName: true,
          },
        });

        await tx.record.create({
          data: {
            userId,
            rank: 0,
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      },
    );

    return res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
});

// 로그인 API
router.post('/sign-in', async (req, res, next) => {
  try {
    const { userId, userPw } = req.body;
    if (!userId || !userPw) {
      return res.status(400).json({ message: '데이터를 올바르게 입력해주세요.' });
    }

    const user = await prisma.user.findFirst({
      where: {
        userId,
      },
    });
    if (!user) {
      return res.status(401).json({ message: '존재하지 않는 사용자입니다.' });
    }

    if (!(await bcrypt.compare(userPw, user.userPw))) {
      return res.status(400).json({ message: '비밀번호가 일치하지 않습니다.' });
    }

    const token = jwt.sign(
      {
        userId: user.userId,
      },
      process.env.TOKEN_SECRET_KEY,
      {
        expiresIn: '1h',
      },
    );

    res.cookie('authorization', `Bearer ${token}`);
    return res.status(200).json({ token });
  } catch (error) {
    next(error);
  }
});

// 캐시 구매 API
router.patch('/user/:userId/showMeTheMoney', authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findFirst({
      where: {
        userId,
      },
    });
    if (!user) {
      return res.status(401).json({ message: '해당 유저가 존재하지 않습니다.' });
    }

    const updateUser = await prisma.user.update({
      data: {
        cash: user.cash + 5000,
      },
      where: {
        userId,
      },
      select: {
        userId: true,
        userName: true,
        cash: true,
      },
    });

    return res.status(200).json({ updateUser });
  } catch (error) {
    next(error);
  }
});

// 뽑은 선수 유저에 넣기
router.patch('/user/pickup', authMiddleware, async (req, res, next) => {
  try {
    // 유저 정보 조회
    const { userId } = req.user;

    if (!userId) {
      return res.status(400).json({ message: '유저 ID가 필요합니다.' });
    }

    const user = await prisma.user.findUnique({
      where: { userId },
      include: { owningPlayer: true }, // owningPlayer 정보 포함
    });

    if (!user) {
      return res.status(404).json({ message: '해당 유저를 찾을 수 없습니다.' });
    }

    // 캐시가 부족한 경우 return
    if (user.cash < 3000) {
      return res.status(400).json({ message: '캐시가 부족합니다.' });
    }

    // 데이터베이스에서 모든 선수 조회
    const players = await prisma.player.findMany();

    if (!players || players.length === 0) {
      return res.status(404).json({ message: '선수가 없습니다.' });
    }

    // 현재 시간을 기준으로 랜덤 인덱스값 설정
    const randomIndex = ((new Date().getTime())*11+1) % players.length; //강화가 0인 배열만 랜덤으로 가져오기
    const randomPlayer = players[randomIndex];

    // 유저 정보와 보유 선수 업데이트

    // 1. user 캐시 빼기
    await prisma.user.update({
      where: { userId },
      data: {
        cash: user.cash - 3000,
      },
    });

    // 2. 보유 선수 업데이트
    const existingOwningPlayer = await prisma.owningPlayer.findFirst({
      where: {
        userId,
        playerId: randomPlayer.playerId,
      },
    });

    // 소유 플레이어 정보 업데이트 OR 생성
    if (existingOwningPlayer) {
      await prisma.owningPlayer.update({
        where: {
          owningPlayerId: existingOwningPlayer.owningPlayerId,
        },
        data: {
          count: existingOwningPlayer.count + 1,
        },
      });
    } else {
      await prisma.owningPlayer.create({
        data: {
          user: {
            connect: { userId },
          },
          player: {
            connect: { playerId: randomPlayer.playerId },
          },
          count: 1,
        },
      });
    }

    // 유저 정보와 보유 선수 정보 재조회
    const updatedUser = await prisma.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        userName: true,
        cash: true,
      },
    });

    return res.status(200).json({ user: updatedUser, pickedPlayer: randomPlayer });
  } catch (error) {
    next(error);
  }
});

export default router;
