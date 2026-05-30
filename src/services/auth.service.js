import { prisma } from '../config/prisma.js';
import { useFirebaseAuth, useJwtAuth } from '../config/env.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { AppError } from '../utils/AppError.js';
import { verifyFirebaseIdToken } from './firebase.service.js';
import {
  buildAuthPayload,
  isRefreshTokenValid,
  revokeRefreshToken,
  signAccessToken,
  signRefreshToken,
  storeRefreshToken,
  verifyRefreshToken,
} from './token.service.js';

function sanitizeUser(user) {
  return {
    id: user.id,
    phone: user.phone,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

async function issueSession(user) {
  if (useJwtAuth) {
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    await storeRefreshToken(user.id, refreshToken);
    return {
      authMode: 'jwt',
      ...buildAuthPayload(user, accessToken, refreshToken),
    };
  }

  return {
    authMode: 'firebase',
    user: sanitizeUser(user),
    tokenHint: 'Use Firebase idToken in Authorization: Bearer <idToken>',
  };
}

export async function verifyAndLogin({ idToken }) {
  const { firebaseUid, phone } = await verifyFirebaseIdToken(idToken);

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ firebaseUid }, { phone }],
    },
  });

  if (!user) {
    return {
      needsRegistration: true,
      phone,
      firebaseUid,
      authMode: useFirebaseAuth ? 'firebase' : 'jwt',
    };
  }

  if (!user.isActive) {
    throw new AppError('Account is disabled', HTTP_STATUS.FORBIDDEN);
  }

  if (user.firebaseUid !== firebaseUid) {
    await prisma.user.update({
      where: { id: user.id },
      data: { firebaseUid },
    });
  }

  const session = await issueSession(user);

  return {
    needsRegistration: false,
    ...session,
  };
}

export async function registerUser({ idToken, displayName, avatarUrl, role }) {
  const { firebaseUid, phone } = await verifyFirebaseIdToken(idToken);

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ firebaseUid }, { phone }],
    },
  });

  if (existing) {
    throw new AppError('User already registered. Please login.', HTTP_STATUS.CONFLICT);
  }

  const user = await prisma.user.create({
    data: {
      firebaseUid,
      phone,
      displayName,
      avatarUrl,
      role: role ?? 'PLAYER',
    },
  });

  return issueSession(user);
}

/** Load Rexar user from Firebase idToken (used by auth middleware in firebase mode). */
export async function resolveUserFromFirebaseToken(idToken) {
  const { firebaseUid, phone } = await verifyFirebaseIdToken(idToken);

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ firebaseUid }, { phone }],
    },
  });

  if (!user) {
    throw new AppError('User not registered', HTTP_STATUS.UNAUTHORIZED);
  }

  if (!user.isActive) {
    throw new AppError('Account is disabled', HTTP_STATUS.FORBIDDEN);
  }

  return user;
}

export async function refreshSession(refreshToken) {
  if (useFirebaseAuth) {
    throw new AppError(
      'Refresh not used in firebase auth mode. Get a new idToken from Firebase on the app.',
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError('Invalid refresh token', HTTP_STATUS.UNAUTHORIZED);
  }

  const valid = await isRefreshTokenValid(refreshToken);
  if (!valid) {
    throw new AppError('Refresh token revoked or expired', HTTP_STATUS.UNAUTHORIZED);
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive) {
    throw new AppError('User not found', HTTP_STATUS.UNAUTHORIZED);
  }

  await revokeRefreshToken(refreshToken);

  const newAccessToken = signAccessToken(user);
  const newRefreshToken = signRefreshToken(user);
  await storeRefreshToken(user.id, newRefreshToken);

  return buildAuthPayload(user, newAccessToken, newRefreshToken);
}

export async function logoutUser(refreshToken) {
  if (useFirebaseAuth) {
    return {
      loggedOut: true,
      note: 'Sign out on the app with Firebase Auth.signOut()',
    };
  }

  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }
  return { loggedOut: true };
}

export async function getUserById(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }
  return sanitizeUser(user);
}

/** Excelrs-style getMe — returns null if Firebase user not registered yet. */
export async function getMeByFirebase({ firebaseUid, phone }) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ firebaseUid }, { phone }],
    },
  });

  if (!user) {
    return null;
  }

  if (!user.isActive) {
    throw new AppError('Account is disabled', HTTP_STATUS.FORBIDDEN);
  }

  if (user.firebaseUid !== firebaseUid) {
    await prisma.user.update({
      where: { id: user.id },
      data: { firebaseUid },
    });
  }

  return sanitizeUser(user);
}

/** Excelrs-style createMe — same as register after OTP. */
export async function createMe({ idToken, displayName, avatarUrl, role }) {
  const session = await registerUser({ idToken, displayName, avatarUrl, role });
  return session.user;
}
