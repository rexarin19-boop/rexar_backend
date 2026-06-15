import { Router } from 'express';
import { pingDb } from '../config/db.js';
import { env } from '../config/env.js';
import v1Routes from './v1/index.js';

const router = Router();

router.get('/health', async (_req, res) => {
  let db = 'disconnected';
  try {
    await pingDb();
    db = 'connected';
  } catch {
    db = 'disconnected';
  }

  res.json({
    success: true,
    message: 'Rexar API is running',
    env: env.NODE_ENV,
    db,
  });
});

router.use(env.API_PREFIX, v1Routes);

export default router;
