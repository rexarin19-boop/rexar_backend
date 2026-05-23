import { Router } from 'express';
import { env } from '../config/env.js';
import v1Routes from './v1/index.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Rexar API is running',
    env: env.NODE_ENV,
  });
});

router.use(env.API_PREFIX, v1Routes);

export default router;
