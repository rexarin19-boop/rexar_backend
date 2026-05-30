import os from 'os';
import app from './app.js';
import { env } from './config/env.js';
import { getFirebaseAdmin } from './config/firebase.admin.js';
import { prisma } from './config/prisma.js';

function getLanIPv4() {
  const nets = os.networkInterfaces();
  for (const ifaces of Object.values(nets)) {
    for (const net of ifaces ?? []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return null;
}

async function startServer() {
  try {
    getFirebaseAdmin();
    await prisma.$connect();

    const lanIp = getLanIPv4();
    app.listen(env.PORT, '0.0.0.0', () => {
      console.log(`Rexar API running on http://localhost:${env.PORT}`);
      if (lanIp) {
        console.log(`Phone / Expo .env → EXPO_PUBLIC_API_URL=http://${lanIp}:${env.PORT}`);
      }
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
