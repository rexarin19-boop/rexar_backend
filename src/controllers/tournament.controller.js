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
