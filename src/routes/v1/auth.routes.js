import { Router } from 'express';
import * as authController from '../../controllers/auth.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  logoutBodySchema,
  refreshBodySchema,
  registerBodySchema,
  verifyBodySchema,
} from '../../validators/auth.validator.js';

const router = Router();

router.post('/verify', validateBody(verifyBodySchema), asyncHandler(authController.verify));
router.post('/register', validateBody(registerBodySchema), asyncHandler(authController.register));
router.post('/refresh', validateBody(refreshBodySchema), asyncHandler(authController.refresh));
router.post('/logout', validateBody(logoutBodySchema), asyncHandler(authController.logout));
router.get('/me', authenticate, asyncHandler(authController.me));

export default router;
