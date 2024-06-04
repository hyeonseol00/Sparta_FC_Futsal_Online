import express from 'express';
import { getRankings } from '../logics/ranking.logic.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/rankings', authMiddleware, (req, res, next) => {
  try {
    // getRankings 함수 호출
    getRankings(req, res, next);
  } catch (error) {
    next(error); // 오류 발생 시 중앙 오류 처리 미들웨어로 전달
  }
});

export default router;
