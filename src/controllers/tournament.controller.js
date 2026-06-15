import { HTTP_STATUS } from '../constants/httpStatus.js';
import * as tournamentService from '../services/tournament.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

export async function create(req, res) {
  const tournament = await tournamentService.createTournament(req.user.id, req.body);

  return sendSuccess(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'Tournament created successfully',
    data: { tournament },
  });
}

export async function list(req, res) {
  const tournaments = await tournamentService.listTournaments();

  return sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Tournaments fetched',
    data: { tournaments },
  });
}

export async function getById(req, res) {
  const tournament = await tournamentService.getTournamentById(req.params.id, req.user?.id);

  return sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Tournament fetched',
    data: { tournament },
  });
}

export async function join(req, res) {
  const result = await tournamentService.joinTournament(req.user.id, req.params.id);

  return sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    message: result.alreadyJoined ? 'Already joined' : 'Joined tournament successfully',
    data: result,
  });
}

export async function participants(req, res) {
  const data = await tournamentService.getTournamentParticipants(req.user.id, req.params.id);

  return sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Participants fetched',
    data,
  });
}

export async function listMine(req, res) {
  const tournaments = await tournamentService.listMyTournaments(req.user.id);

  return sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Your tournaments fetched',
    data: { tournaments },
  });
}

export async function updateRoom(req, res) {
  const tournament = await tournamentService.updateRoomDetails(req.user.id, req.params.id, req.body);

  return sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    message: req.body.publish ? 'Room details published' : 'Room details saved',
    data: { tournament },
  });
}
