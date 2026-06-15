import { Router } from 'express';
import * as authController from '../../controllers/auth.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authenticateFirebase } from '../../middleware/firebase.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  createMeBodySchema,
  registerBodySchema,
  signInBodySchema,
  verifyBodySchema,
} from '../../validators/auth.validator.js';

const router = Router();

/** Login — phone OR email + password (same password from signup) */
router.post('/sign-in', validateBody(signInBodySchema), asyncHandler(authController.signIn));

/** OTP verify (signup step 1) */
router.post('/login', validateBody(verifyBodySchema), asyncHandler(authController.login));
router.post('/verify', validateBody(verifyBodySchema), asyncHandler(authController.login));

router.post('/register', validateBody(registerBodySchema), asyncHandler(authController.register));

router.get('/me', authenticate, asyncHandler(authController.me));
router.get('/getMe', authenticateFirebase, asyncHandler(authController.getMe));
router.post(
  '/createMe',
  authenticateFirebase,
  validateBody(createMeBodySchema),
  asyncHandler(authController.createMe),
);

export default router;
