import { handleWin, handleLose, handleDraw } from './scoreController.js';

const main = async () => {
  const userId = 'jsuk09'; 

  try {
    const winResult = await handleWin(userId);
    console.log('Win Result:', winResult);

    const loseResult = await handleLose(userId);
    console.log('Lose Result:', loseResult);

    const drawResult = await handleDraw(userId);
    console.log('Draw Result:', drawResult);
  } catch (error) {
    console.error('Error:', error.message);
  }
};

main();
