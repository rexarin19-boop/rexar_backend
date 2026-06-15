import * as tournamentsDb from '../db/tournaments.js';
import * as tournamentJoinsDb from '../db/tournamentJoins.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { AppError } from '../utils/AppError.js';

async function withJoinedCounts(tournaments) {
  const ids = tournaments.map((t) => t.id);
  const counts = await tournamentJoinsDb.countJoinsByTournamentIds(ids);
  return tournaments.map((t) => ({
    ...t,
    joinedCount: counts[t.id] ?? 0,
  }));
}

async function withJoinedCount(tournament) {
  const joinedCount = await tournamentJoinsDb.countJoins(tournament.id);
  return { ...tournament, joinedCount };
}

export async function listTournaments() {
  const list = await tournamentsDb.listTournaments();
  return withJoinedCounts(list);
}

export async function createTournament(userId, payload) {
  const totalPrize = payload.prizeFirst + payload.prizeSecond + payload.prizeThird;
  if (totalPrize <= 0) {
    throw new AppError('Set at least one prize amount above 0', HTTP_STATUS.BAD_REQUEST);
  }

  const tournament = await tournamentsDb.insertTournament(userId, payload);
  return { ...tournament, joinedCount: 0 };
}

export async function getTournamentById(id, userId) {
  const tournament = await tournamentsDb.findTournamentById(id);
  if (!tournament) {
    throw new AppError('Tournament not found', HTTP_STATUS.NOT_FOUND);
  }
  const enriched = await withJoinedCount(tournament);
  if (userId) {
    enriched.userHasJoined = await tournamentJoinsDb.hasJoined(id, userId);
  }
  return enriched;
}

export async function listMyTournaments(userId) {
  const list = await tournamentsDb.listTournamentsByCreator(userId);
  return withJoinedCounts(list);
}

export async function updateRoomDetails(userId, tournamentId, payload) {
  const existing = await tournamentsDb.findTournamentById(tournamentId);
  if (!existing) {
    throw new AppError('Tournament not found', HTTP_STATUS.NOT_FOUND);
  }
  if (existing.createdById !== userId) {
    throw new AppError('You can only update your own tournaments', HTTP_STATUS.FORBIDDEN);
  }

  const updated = await tournamentsDb.updateTournamentRoom(tournamentId, userId, payload);
  if (!updated) {
    throw new AppError('Failed to update room details', HTTP_STATUS.BAD_REQUEST);
  }
  return withJoinedCount(updated);
}

export async function joinTournament(userId, tournamentId) {
  const tournament = await tournamentsDb.findTournamentById(tournamentId);
  if (!tournament) {
    throw new AppError('Tournament not found', HTTP_STATUS.NOT_FOUND);
  }
  if (tournament.createdById === userId) {
    throw new AppError('Organizers cannot join their own tournament', HTTP_STATUS.BAD_REQUEST);
  }

  const joinedCount = await tournamentJoinsDb.countJoins(tournamentId);
  if (joinedCount >= tournament.maxParticipants) {
    throw new AppError('Tournament is full', HTTP_STATUS.BAD_REQUEST);
  }

  const result = await tournamentJoinsDb.insertJoin(tournamentId, userId);
  const newCount = await tournamentJoinsDb.countJoins(tournamentId);

  return {
    alreadyJoined: result.alreadyJoined === true,
    joinedCount: newCount,
  };
}

export async function getTournamentParticipants(userId, tournamentId) {
  const tournament = await tournamentsDb.findTournamentById(tournamentId);
  if (!tournament) {
    throw new AppError('Tournament not found', HTTP_STATUS.NOT_FOUND);
  }
  if (tournament.createdById !== userId) {
    throw new AppError('Only the organizer can view participants', HTTP_STATUS.FORBIDDEN);
  }

  const participants = await tournamentJoinsDb.listParticipants(tournamentId);
  return { joinedCount: participants.length, participants };
}
