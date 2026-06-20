import os from 'os';

const port = process.env.PORT || 4000;

function getLanIPv4() {
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const net of ifaces ?? []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return null;
}

//testing

const lan = getLanIPv4();

console.log('\n--- Rexar API URLs ---\n');
console.log(`Local:   http://localhost:${port}/health`);
if (lan) {
  console.log(`Phone:   http://${lan}:${port}/health`);
  console.log(`\nPut in Rexar/.env:\n  EXPO_PUBLIC_API_URL=http://${lan}:${port}\n`);
} else {
  console.log('\nCould not detect LAN IP. Run ipconfig and set Rexar/.env manually.\n');
}
