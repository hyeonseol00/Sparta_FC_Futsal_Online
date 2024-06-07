import express from 'express';
import { getMatchHistory } from '../logics/match-history.logic.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/history/:teamId', authMiddleware, async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const formattedMatches = getMatchHistory(teamId);
    return res.json({ matches: formattedMatches });
  } catch (error) {
    console.error(' 오류가 발생했습니다 ! :', error); // 에러 로그 잡기
    next(error);
  }
});

export default router;
