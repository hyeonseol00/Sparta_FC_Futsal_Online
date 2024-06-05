import express from 'express';
import { getMatchHistory } from '../logics/match-history.logic.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/history/:userId', authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.params;

    const formattedMatches = await getMatchHistory(userId);
    
    return res.json({ matches: formattedMatches });
  } catch (error) {
    if (error.message === '유효하지 않은 userId 입니다.' || error.message === '경기 기록이 없습니다!') {
      return res.status(404).json({ message: error.message });
    }
    console.error(' 오류가 발생했습니다 ! :', error); // 에러 로그 잡기
    next(error);
  }
});


export default router;
