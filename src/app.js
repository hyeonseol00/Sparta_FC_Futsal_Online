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
<<<<<<< HEAD
import tournamentSetting from './routes/tournament.setting.router.js';
=======
import tournamentEndRouter from './routes/tournament-end.router.js';

dotEnv.config();
>>>>>>> 47ad41497c8d1ca5289f7f405604dca650d9a1e9

const app = express();
app.use(express.json());
app.use(cookieParser());
<<<<<<< HEAD
app.use('/api', [
=======

const routers = [
>>>>>>> 47ad41497c8d1ca5289f7f405604dca650d9a1e9
  gamePlayRouter,
  userRouter,
  owningPlayerRouter,
  teamRouter,
  rankingRouter,
  matchHistoryRouter,
<<<<<<< HEAD
  tournamentSetting,
]);
=======
  tournamentEndRouter,
];

app.use('/api', routers);
>>>>>>> 47ad41497c8d1ca5289f7f405604dca650d9a1e9
app.use(errorHandlerMiddleware);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`${PORT} 포트로 서버가 열렸어요!`);
});
