import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import * as refreshTokensDb from '../db/refreshTokens.js';

export function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, phone: user.phone },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN },
  );
}

export function signRefreshToken(user) {
  return jwt.sign({ sub: user.id, type: 'refresh' }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
}

export function verifyRefreshToken(token) {
  const payload = jwt.verify(token, env.JWT_REFRESH_SECRET);
  if (payload.type !== 'refresh') throw new Error('Invalid refresh token type');
  return payload;
}

export async function storeRefreshToken(userId, refreshToken) {
  const decoded = jwt.decode(refreshToken);
  const expiresAt = new Date(decoded.exp * 1000);
  await refreshTokensDb.storeRefreshToken(userId, refreshToken, expiresAt);
}

export async function revokeRefreshToken(refreshToken) {
  await refreshTokensDb.revokeRefreshToken(refreshToken);
}

export async function isRefreshTokenValid(refreshToken) {
  return refreshTokensDb.isRefreshTokenValid(refreshToken);
}

export function buildAuthPayload(user, accessToken, refreshToken) {
  return {
    user: {
      id: user.id,
      phone: user.phone,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role,
    },
    accessToken,
    refreshToken,
  };
}
