const prisma = require('../../app');

const handleWin = async (req, res) => {
  const { user_id } = req.body;

  try {
    const userRecord = await prisma.record.findUnique({ where: { user_id } });

    if (!userRecord) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedRecord = await prisma.record.update({
      where: { user_id },
      data: {
        score: userRecord.score + 10,
        win: userRecord.win + 1,
      },
    });

    res.json({ message: '게임에서 승리하였습니다.', new_score: updatedRecord.score });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const handleLose = async (req, res) => {
  const { user_id } = req.body;

  try {
    const userRecord = await prisma.record.findUnique({ where: { user_id } });

    if (!userRecord) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedRecord = await prisma.record.update({
      where: { user_id },
      data: {
        score: userRecord.score - 10,
        lose: userRecord.lose + 1,
      },
    });

    res.json({ message: '게임에서 패배하였습니다.', new_score: updatedRecord.score });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const handleDraw = async (req, res) => {
  const { user_id } = req.body;

  try {
    const userRecord = await prisma.record.findUnique({ where: { user_id } });

    if (!userRecord) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedRecord = await prisma.record.update({
      where: { user_id },
      data: {
        draw: userRecord.draw + 1,
      },
    });

    res.json({ message: '무승부', new_score: updatedRecord.score });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { handleWin, handleLose, handleDraw };
