import { Router } from 'express';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import v1Routes from './v1/index.js';

const router = Router();

router.get('/health', async (_req, res) => {
  let db = 'disconnected';
  try {
    await prisma.$runCommandRaw({ ping: 1 });
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
