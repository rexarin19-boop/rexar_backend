import { Router } from 'express';
import * as tournamentController from '../../controllers/tournament.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { createTournamentBodySchema } from '../../validators/tournament.validator.js';

const router = Router();

router.post('/', authenticate, validateBody(createTournamentBodySchema), asyncHandler(tournamentController.create));

export default router;
