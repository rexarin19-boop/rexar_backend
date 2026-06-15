import os from 'os';
import app from './app.js';
import { connectDb, disconnectDb } from './config/db.js';
import { env } from './config/env.js';
import { getFirebaseAdmin } from './config/firebase.admin.js';

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
    await connectDb();

    const lanIp = getLanIPv4();
    app.listen(env.PORT, '0.0.0.0', () => {
      console.log(`Rexar API running on http://localhost:${env.PORT}`);
      if (lanIp) {
        console.log(`Wi-Fi fallback → http://${lanIp}:${env.PORT}`);
      }
      console.log(`Health: http://localhost:${env.PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  await disconnectDb();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDb();
  process.exit(0);
});

startServer();
