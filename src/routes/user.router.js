import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma/index.js';

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

export default router;