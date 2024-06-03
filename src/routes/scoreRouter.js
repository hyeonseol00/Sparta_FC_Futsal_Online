import express from 'express';
import { handleWin, handleLose, handleDraw } from '../controllers/scoreController.js';

const router = express.Router();

router.post('/win', handleWin);
router.post('/lose', handleLose);
router.post('/draw', handleDraw);

export default router;
