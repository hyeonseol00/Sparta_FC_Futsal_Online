import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import { Prisma } from '@prisma/client';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/tournament/end', async (req, res, next) =>
{
	try
	{
		const { tournamentId } = req.body;

		const tournament = await prisma.tournament.findFirst({ where: { tournamentId } });
		const tournamentMatch = await prisma.tournament.findFirst({
			where: {
				tournamentId
			},
			select: {
				semi1UserATeamId: true,
				semi1UserBTeamId: true,
				semi2UserATeamId: true,
				semi2UserBTeamId: true,
				finalUserATeamId: true,
				finalUserBTeamId: true,
			}
		});

		if (!tournament)
			return res.status(404).json({ errorMessage: '토너먼트를 찾을 수 없습니다.' });
		else if (tournament.winnerTeamId == null)
			return res.status(404).json({ errorMessage: '토너먼트가 아직 진행중입니다!' });

		// 상품 수여
		const teamIds = [
			tournamentMatch.semi1UserATeamId, tournamentMatch.semi1UserBTeamId,
			tournamentMatch.semi2UserATeamId, tournamentMatch.semi2UserBTeamId
		];

		const firstTeamId = tournament.winnerTeamId;
		const secondTeamId = tournamentMatch.finalUserATeamId == firstTeamId ?
			tournamentMatch.finalUserBTeamId :
			tournamentMatch.finalUserATeamId;
		let thirdTeamAId, thirdTeamBId;
		for (let i = 0; i < teamIds.length; i++)
		{
			if (teamIds[i] == firstTeamId || teamIds[i] == secondTeamId)
				break;

			if (!thirdUserAId)
				thirdTeamAId = teamIds[i];
			else
				thirdTeamBId = teamIds[i];
		}

		const firstTeam = await prisma.team.findFirst({ where: { teamId: firstTeamId } });
		const secondTeam = await prisma.team.findFirst({ where: { teamId: secondTeamId } });
		const thirdATeam = await prisma.team.findFirst({ where: { teamId: thirdTeamAId } });
		const thirdBTeam = await prisma.team.findFirst({ where: { teamId: thirdTeamBId } });

		const firstUserOwningPlayer = await prisma.owningPlayer.findFirst({
			where: {
				userId: firstTeam.userId,
				playerId: tournament.rewardPlayerId
			}
		});
		const secondUserOwningPlayer = await prisma.owningPlayer.findFirst({
			where: {
				userId: secondTeam.userId,
				playerId: tournament.rewardPlayerId
			}
		});
		const thirdUserAOwningPlayer = await prisma.owningPlayer.findFirst({
			where: {
				userId: thirdATeam.userId,
				playerId: tournament.rewardPlayerId
			}
		});
		const thirdUserBOwningPlayer = await prisma.owningPlayer.findFirst({
			where: {
				userId: thirdBTeam.userId,
				playerId: tournament.rewardPlayerId
			}
		});

		await prisma.$transaction(
			async (tx) =>
			{
				// 1등 보상
				if (firstUserOwningPlayer)
				{
					await tx.owningPlayer.update({
						data: {
							count: firstUserOwningPlayer.count + 3,
						},
						where: {
							userId: firstTeam.userId,
							playerId: tournament.rewardPlayerId
						}
					});
				} else
				{
					await tx.owningPlayer.create({
						data: {
							count: 3,
							userId: firstTeam.userId,
							playerId: tournament.rewardPlayerId
						},
					});
				}

				// 2등 보상
				if (secondUserOwningPlayer)
				{
					await tx.owningPlayer.update({
						data: {
							count: secondUserOwningPlayer.count + 2,
						},
						where: {
							userId: secondTeam.userId,
							playerId: tournament.rewardPlayerId
						}
					});
				} else
				{
					await tx.owningPlayer.create({
						data: {
							count: 2,
							userId: secondTeam.userId,
							playerId: tournament.rewardPlayerId
						},
					});
				}

				// 3등 보상
				if (thirdUserAOwningPlayer)
				{
					await tx.owningPlayer.update({
						data: {
							count: thirdUserAOwningPlayer.count + 1,
						},
						where: {
							userId: thirdATeam.userId,
							playerId: tournament.rewardPlayerId
						}
					});
				} else
				{
					await tx.owningPlayer.create({
						data: {
							count: 1,
							userId: thirdATeam.userId,
							playerId: tournament.rewardPlayerId
						},
					});
				}

				if (thirdUserBOwningPlayer)
				{
					await tx.owningPlayer.update({
						data: {
							count: thirdUserBOwningPlayer.count + 1,
						},
						where: {
							userId: thirdBTeam.userId,
							playerId: tournament.rewardPlayerId
						}
					});
				} else
				{
					await tx.owningPlayer.create({
						data: {
							count: 1,
							userId: thirdBTeam.userId,
							playerId: tournament.rewardPlayerId
						},
					});
				}
			}
		);

		return res.status(201).json({
			message: "토너먼트 종료 처리 완료!",
			first: firstTeam.userId,
			second: secondTeam.userId,
			thirdA: thirdATeam.userId,
			thirdB: thirdBTeam.userId,
		});
	}
	catch (error)
	{
		next(error);
	}
});

export default router;
