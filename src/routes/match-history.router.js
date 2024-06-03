import express from 'express';
import { getMatchHistory } from '../logics/match-history.logic.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/history/:userId', authMiddleware, getMatchHistory);

export default router;
