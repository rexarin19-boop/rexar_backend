import { getFirebaseAuth } from '../config/firebase.admin.js';
import { useFirebaseAuth, useJwtAuth } from '../config/env.js';
import * as usersDb from '../db/users.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { AppError } from '../utils/AppError.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
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
    email: user.email,
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

/** Login with phone OR email + the password user set at signup. */
export async function loginWithPassword({ identifier, password }) {
  const user = await usersDb.findUserByIdentifier(identifier);

  if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    throw new AppError('Wrong phone/email or password', HTTP_STATUS.UNAUTHORIZED);
  }

  if (!user.isActive) {
    throw new AppError('Account is disabled', HTTP_STATUS.FORBIDDEN);
  }

  const customToken = await getFirebaseAuth().createCustomToken(user.firebaseUid);

  return {
    customToken,
    user: sanitizeUser(user),
  };
}

export async function verifyAndLogin({ idToken }) {
  const { firebaseUid, phone, email } = await verifyFirebaseIdToken(idToken);
  const user = await usersDb.findUserByFirebase({ firebaseUid, phone, email });

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
    await usersDb.updateUser(user.id, { firebaseUid });
  }

  return {
    needsRegistration: false,
    ...(await issueSession(user)),
  };
}

export async function registerUser({ idToken, displayName, email, password, avatarUrl, role }) {
  const { firebaseUid, phone } = await verifyFirebaseIdToken(idToken);

  if (!phone) {
    throw new AppError('Phone verification required before signup', HTTP_STATUS.BAD_REQUEST);
  }

  if (!password || password.length < 6) {
    throw new AppError('Password must be at least 6 characters', HTTP_STATUS.BAD_REQUEST);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = await hashPassword(password);
  const existing = await usersDb.findExistingUser({
    firebaseUid,
    phone,
    email: normalizedEmail,
  });

  if (existing) {
    if (!existing.passwordHash) {
      const user = await usersDb.updateUser(existing.id, {
        firebaseUid,
        phone,
        email: normalizedEmail,
        displayName,
        avatarUrl,
        role: role ?? existing.role ?? 'PLAYER',
        passwordHash,
      });
      return issueSession(user);
    }

    throw new AppError('Account already exists. Please log in.', HTTP_STATUS.CONFLICT);
  }

  const user = await usersDb.createUser({
    firebaseUid,
    phone,
    email: normalizedEmail,
    displayName,
    avatarUrl,
    role: role ?? 'PLAYER',
    passwordHash,
  });

  return issueSession(user);
}

export async function resolveUserFromFirebaseToken(idToken) {
  const { firebaseUid, phone, email } = await verifyFirebaseIdToken(idToken);
  const user = await usersDb.findUserByFirebase({ firebaseUid, phone, email });

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

  if (!(await isRefreshTokenValid(refreshToken))) {
    throw new AppError('Refresh token revoked or expired', HTTP_STATUS.UNAUTHORIZED);
  }

  const user = await usersDb.findUserById(payload.sub);
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
    return { loggedOut: true, note: 'Sign out on the app with Firebase Auth.signOut()' };
  }

  if (refreshToken) await revokeRefreshToken(refreshToken);
  return { loggedOut: true };
}

export async function getUserById(userId) {
  const user = await usersDb.findUserById(userId);
  if (!user) throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  return sanitizeUser(user);
}

export async function getMeByFirebase({ firebaseUid, phone, email }) {
  const existing = await usersDb.findExistingUser({
    firebaseUid,
    phone,
    email: email?.toLowerCase(),
  });

  if (!existing?.email || !existing.passwordHash) return null;
  if (!existing.isActive) throw new AppError('Account is disabled', HTTP_STATUS.FORBIDDEN);

  if (existing.firebaseUid !== firebaseUid) {
    await usersDb.updateUser(existing.id, { firebaseUid });
  }

  return sanitizeUser(existing);
}

export async function createMe({ idToken, displayName, email, password, avatarUrl, role }) {
  const session = await registerUser({ idToken, displayName, email, password, avatarUrl, role });
  return session.user;
}
