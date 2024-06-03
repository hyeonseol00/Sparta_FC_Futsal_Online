import express from 'express';
import { getMatchHistory } from '../logics/match-history.logic.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/history/:userId', authMiddleware, (req, res, next) => {
  try {
    getMatchHistory(req, res, next);
  } catch (error) {
    next(error);
  }
});

export default router;
