import express from 'express';
import { getRankings } from '../logics/ranking.logic.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/rankings', authMiddleware, getRankings);

export default router;
