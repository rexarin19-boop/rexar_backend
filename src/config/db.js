import { MongoClient } from 'mongodb';
import { env } from './env.js';

let client;
let db;

/** Skip if Prisma (or a prior run) already created the same index under another name. */
async function ensureIndex(collection, keys, options = {}) {
  try {
    await collection.createIndex(keys, options);
  } catch (err) {
    const skip =
      err.code === 85 ||
      err.code === 86 ||
      err.codeName === 'IndexOptionsConflict' ||
      err.codeName === 'IndexKeySpecsConflict';
    if (!skip) throw err;
  }
}

const CLIENT_OPTIONS = {
  serverSelectionTimeoutMS: 15000,
  // Windows routers sometimes fail IPv6/SRV — prefer IPv4
  family: 4,
};

async function openClient() {
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const next = new MongoClient(env.DATABASE_URL, CLIENT_OPTIONS);
      await next.connect();
      return next;
    } catch (err) {
      lastError = err;
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 1500 * attempt));
      }
    }
  }

  if (lastError?.message?.includes('EBADRESP') || lastError?.message?.includes('querySrv')) {
    throw new Error(
      'MongoDB DNS failed (querySrv EBADRESP). Check internet/VPN, or use Atlas "Standard connection string" in DATABASE_URL instead of mongodb+srv://',
    );
  }

  throw lastError;
}

export async function connectDb() {
  if (db) return db;

  client = await openClient();
  db = client.db();

  await ensureIndex(db.collection('users'), { firebase_uid: 1 }, { unique: true });
  await ensureIndex(db.collection('users'), { phone: 1 }, { unique: true });
  await ensureIndex(db.collection('users'), { email: 1 }, { unique: true, sparse: true });
  await ensureIndex(db.collection('tournaments'), { created_by_id: 1 });
  await ensureIndex(
    db.collection('tournament_joins'),
    { tournament_id: 1, user_id: 1 },
    { unique: true },
  );
  await ensureIndex(db.collection('tournament_joins'), { tournament_id: 1 });

  return db;
}

export function getDb() {
  if (!db) throw new Error('Database not connected');
  return db;
}

export async function pingDb() {
  return getDb().command({ ping: 1 });
}

export async function disconnectDb() {
  if (client) await client.close();
  client = null;
  db = null;
}
