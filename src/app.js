import express from 'express';
import cookieParser from 'cookie-parser';
import dotEnv from 'dotenv';
import errorHandlerMiddleware from './middlewares/error-handler.middleware.js';
import rankingRouter from './routes/ranking.router.js';
import gamePlayRouter from './routes/game-play.router.js';
import userRouter from './routes/user.router.js';
import owningPlayerRouter from './routes/owning_player.router.js';
import teamRouter from './routes/team.router.js';
import matchHistoryRouter from './routes/match-history.router.js';

dotEnv.config();

const app = express();
app.use(express.json());
app.use(cookieParser());

const routers = [
  gamePlayRouter,
  userRouter,
  owningPlayerRouter,
  teamRouter,
  rankingRouter,
  matchHistoryRouter
];

app.use('/api', routers);
app.use(errorHandlerMiddleware);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`${PORT} 포트로 서버가 열렸어요!`);
});
