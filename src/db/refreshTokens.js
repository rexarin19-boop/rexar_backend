import crypto from 'crypto';
import { getDb } from '../config/db.js';

const COL = 'refresh_tokens';

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function storeRefreshToken(userId, refreshToken, expiresAt) {
  await getDb().collection(COL).insertOne({
    user_id: userId,
    token_hash: hashToken(refreshToken),
    expires_at: expiresAt,
    created_at: new Date(),
    revoked_at: null,
  });
}

export async function revokeRefreshToken(refreshToken) {
  await getDb().collection(COL).updateMany(
    { token_hash: hashToken(refreshToken), revoked_at: null },
    { $set: { revoked_at: new Date() } },
  );
}

export async function isRefreshTokenValid(refreshToken) {
  const doc = await getDb().collection(COL).findOne({
    token_hash: hashToken(refreshToken),
    revoked_at: null,
    expires_at: { $gt: new Date() },
  });
  return Boolean(doc);
}
