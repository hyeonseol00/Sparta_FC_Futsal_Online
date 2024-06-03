import express from 'express';
import { getRankings } from '../logics/ranking.logic.js';

const router = express.Router();

router.get('/', getRankings);

export default router;
