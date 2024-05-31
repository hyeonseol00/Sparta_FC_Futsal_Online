const express = require('express');
const { handleWin, handleLose, handleDraw } = require('../controllers/scoreController');

const router = express.Router();

router.post('/win', handleWin);
router.post('/lose', handleLose);
router.post('/draw', handleDraw);

module.exports = router;
