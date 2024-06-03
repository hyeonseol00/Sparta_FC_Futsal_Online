import 'dotenv/config';
import express from 'express';
import rankingRouter from './routes/ranking.router.js';
import cookieParser from 'cookie-parser';
import dotEnv from 'dotenv';
import errorHandlerMiddleware from './middlewares/error-handler.middleware.js';
import gamePlayRouter from './routes/game-play.router.js';
import userRouter from './routes/user.router.js';
import owningPlayerRouter from './routes/owning_player.router.js';
import teamRouter from './routes/team.router.js';
dotEnv.config();

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api', [gamePlayRouter, userRouter, owningPlayerRouter, teamRouter]);
app.use('/api/rankings', rankingRouter);
app.use(errorHandlerMiddleware);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`${PORT} 포트로 서버가 열렸어요!`);
});
