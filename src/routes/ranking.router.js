import express from 'express';
<<<<<<< HEAD:src/routes/rankingRouter.js
import { getRankings } from '../controllers/rankingController.js';
import authMiddleware from '../middlewares/auth.middleware.js';
=======
import { getRankings } from '../logics/ranking.logic.js';
>>>>>>> c51af6b95abe1e372a2d28e49fea09927958e882:src/routes/ranking.router.js

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
