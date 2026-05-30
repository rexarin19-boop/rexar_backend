import { prisma } from '../config/prisma.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { AppError } from '../utils/AppError.js';

function sanitizeTournament(tournament) {
  return {
    id: tournament.id,
    createdById: tournament.createdById,
    tournamentName: tournament.tournamentName,
    game: tournament.game,
    format: tournament.format,
    date: tournament.date,
    time: tournament.time,
    isPublic: tournament.isPublic,
    entryFee: tournament.entryFee,
    prizePool: tournament.prizePool,
    maxParticipants: tournament.maxParticipants,
    rules: tournament.rules,
    registrationDeadline: tournament.registrationDeadline,
    allowTeamRegistration: tournament.allowTeamRegistration,
    autoApprovePlayers: tournament.autoApprovePlayers,
    matches: tournament.matches,
    roomSize: tournament.roomSize,
    map: tournament.map,
    spectatorMode: tournament.spectatorMode,
    prizeFirst: tournament.prizeFirst,
    prizeSecond: tournament.prizeSecond,
    prizeThird: tournament.prizeThird,
    bannerUri: tournament.bannerUri,
    createdAt: tournament.createdAt,
    updatedAt: tournament.updatedAt,
  };
}

export async function createTournament(userId, payload) {
  const totalPrize = payload.prizeFirst + payload.prizeSecond + payload.prizeThird;
  if (totalPrize <= 0) {
    throw new AppError('Set at least one prize amount above 0', HTTP_STATUS.BAD_REQUEST);
  }

  const tournament = await prisma.tournament.create({
    data: {
      createdById: userId,
      ...payload,
    },
  });

  return sanitizeTournament(tournament);
}
