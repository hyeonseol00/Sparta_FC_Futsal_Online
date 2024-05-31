import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

// 회원가입 API
router.post('/sign-up', async (req, res, next) => {
  try {
    const { userId, userPw, userPwCheck, userName } = req.body;

    if (!userId || !userPw || !userPwCheck || !userName) {
      return res
        .status(400)
        .json({ message: '데이터를 올바르게 입력해주세요.' });
    }

    //소문자 + 숫자 vaildation
    const idVaildation = /^[a-z0-9]+$/;
    if (!idVaildation.test(userId)) {
      return res
        .status(400)
        .json({ message: '아이디는 소문자 + 숫자 조합으로 만들어주세요.' });
    }

    if (userPw.length < 6) {
      return res
        .status(400)
        .json({ message: '비밀번호는 6자 이상으로 만들어주세요.' });
    }

    if (userPw !== userPwCheck) {
      return res
        .status(400)
        .json({ message: '비밀번호 확인이 일치하지 않습니다.' });
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

    const user = await prisma.user.create({
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
      return res
        .status(400)
        .json({ message: '데이터를 올바르게 입력해주세요.' });
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
router.patch(
  '/user/:userId/showMeTheMoney',
  authMiddleware,
  async (req, res, next) => {
    try {
      const { userId } = req.params;

      console.log(userId);

      const user = await prisma.user.findFirst({
        where: {
          userId,
        },
      });
      if (!user) {
        return res
          .status(401)
          .json({ message: '해당 유저가 존재하지 않습니다.' });
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
  },
);

export default router;
