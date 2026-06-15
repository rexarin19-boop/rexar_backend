import { Router } from 'express';
import * as tournamentController from '../../controllers/tournament.controller.js';
import { authenticate, authorize, optionalAuthenticate } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { createTournamentBodySchema } from '../../validators/tournament.validator.js';
import { updateRoomBodySchema } from '../../validators/room.validator.js';

const router = Router();

/** Public list — all tournaments from DB (newest first) */
router.get('/', asyncHandler(tournamentController.list));

router.get(
  '/mine',
  authenticate,
  authorize('ORGANIZER'),
  asyncHandler(tournamentController.listMine),
);

router.get('/:id', optionalAuthenticate, asyncHandler(tournamentController.getById));

router.post(
  '/:id/join',
  authenticate,
  asyncHandler(tournamentController.join),
);

router.get(
  '/:id/participants',
  authenticate,
  authorize('ORGANIZER'),
  asyncHandler(tournamentController.participants),
);

router.post(
  '/',
  authenticate,
  authorize('ORGANIZER'),
  validateBody(createTournamentBodySchema),
  asyncHandler(tournamentController.create),
);

router.patch(
  '/:id/room',
  authenticate,
  authorize('ORGANIZER'),
  validateBody(updateRoomBodySchema),
  asyncHandler(tournamentController.updateRoom),
);

export default router;
