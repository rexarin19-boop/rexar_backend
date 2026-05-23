import { prisma } from '../src/config/prisma.js';

try {
  await prisma.$connect();
  const count = await prisma.user.count();
  console.log('users:', count);
} catch (e) {
  console.error('MongoDB FAIL:', e.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
