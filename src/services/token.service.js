import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';

export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      phone: user.phone,
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN },
  );
}

export function signRefreshToken(user) {
  return jwt.sign(
    { sub: user.id, type: 'refresh' },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN },
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
}

export function verifyRefreshToken(token) {
  const payload = jwt.verify(token, env.JWT_REFRESH_SECRET);
  if (payload.type !== 'refresh') {
    throw new Error('Invalid refresh token type');
  }
  return payload;
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function storeRefreshToken(userId, refreshToken) {
  const decoded = jwt.decode(refreshToken);
  const expiresAt = new Date(decoded.exp * 1000);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt,
    },
  });
}

export async function revokeRefreshToken(refreshToken) {
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(refreshToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function isRefreshTokenValid(refreshToken) {
  const record = await prisma.refreshToken.findFirst({
    where: {
      tokenHash: hashToken(refreshToken),
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
  return Boolean(record);
}

export function buildAuthPayload(user, accessToken, refreshToken) {
  return {
    user: {
      id: user.id,
      phone: user.phone,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role,
    },
    accessToken,
    refreshToken,
  };
}
