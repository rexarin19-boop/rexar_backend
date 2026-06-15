import { connectDb, disconnectDb, getDb } from '../src/config/db.js';

try {
  await connectDb();
  const count = await getDb().collection('users').countDocuments();
  console.log('MongoDB OK — users:', count);
} catch (e) {
  console.error('MongoDB FAIL:', e.message);
  process.exitCode = 1;
} finally {
  await disconnectDb();
}
