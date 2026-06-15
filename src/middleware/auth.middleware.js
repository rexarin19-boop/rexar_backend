import { useFirebaseAuth, useJwtAuth } from '../config/env.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { resolveUserFromFirebaseToken } from '../services/auth.service.js';
import { verifyAccessToken } from '../services/token.service.js';
import { sendError } from '../utils/apiResponse.js';

function getBearerToken(req) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7);
}

export async function authenticate(req, res, next) {
  const token = getBearerToken(req);

  if (!token) {
    return sendError(res, {
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      message: 'Authorization token required',
    });
  }

  try {
    if (useFirebaseAuth) {
      const user = await resolveUserFromFirebaseToken(token);
      req.user = {
        id: user.id,
        role: user.role,
        phone: user.phone,
        firebaseUid: user.firebaseUid,
      };
      return next();
    }

    if (useJwtAuth) {
      const payload = verifyAccessToken(token);
      req.user = {
        id: payload.sub,
        role: payload.role,
        phone: payload.phone,
      };
      return next();
    }

    return sendError(res, {
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Invalid AUTH_MODE configuration',
    });
  } catch {
    return sendError(res, {
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      message: useFirebaseAuth
        ? 'Invalid or expired Firebase idToken'
        : 'Invalid or expired access token',
    });
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, {
        statusCode: HTTP_STATUS.UNAUTHORIZED,
        message: 'Not authenticated',
      });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return sendError(res, {
        statusCode: HTTP_STATUS.FORBIDDEN,
        message: 'Insufficient permissions',
      });
    }

    next();
  };
}

/** Sets req.user when token is valid; continues anonymously otherwise. */
export async function optionalAuthenticate(req, res, next) {
  const token = getBearerToken(req);
  if (!token) return next();

  try {
    if (useFirebaseAuth) {
      const user = await resolveUserFromFirebaseToken(token);
      req.user = {
        id: user.id,
        role: user.role,
        phone: user.phone,
        firebaseUid: user.firebaseUid,
      };
    } else if (useJwtAuth) {
      const payload = verifyAccessToken(token);
      req.user = {
        id: payload.sub,
        role: payload.role,
        phone: payload.phone,
      };
    }
  } catch {
    // ignore invalid token for public reads
  }

  return next();
}
