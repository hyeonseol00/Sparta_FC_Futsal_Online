import express from 'express';
import cookieParser from 'cookie-parser';
import dotEnv from 'dotenv';
import GamePlayRouter from './routes/game-play.router.js';
import errorHandlerMiddleware from './middlewares/error-handler.middleware.js';
import userRouter from './routes/user.router.js';
import owningPlayerRouter from './routes/owning_player.router.js';
import teamRouter from './routes/team.router.js';
dotEnv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());
app.use('/api', [GamePlayRouter, userRouter, owningPlayerRouter, teamRouter]);
app.use(errorHandlerMiddleware);

app.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸어요!');
});
