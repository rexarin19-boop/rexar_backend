import app from './app.js';
import { env } from './config/env.js';
import { getFirebaseAdmin } from './config/firebase.admin.js';
import { prisma } from './config/prisma.js';

async function startServer() {
  try {
    getFirebaseAdmin();
    await prisma.$connect();

    app.listen(env.PORT, () => {
      console.log(`Rexar API running on http://localhost:${env.PORT}`);
      console.log(`Health: http://localhost:${env.PORT}/health`);
      console.log(`Auth:   http://localhost:${env.PORT}${env.API_PREFIX}/auth`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
