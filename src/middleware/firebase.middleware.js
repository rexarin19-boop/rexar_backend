import { verifyFirebaseIdToken } from '../services/firebase.service.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { sendError } from '../utils/apiResponse.js';

function getBearerToken(req) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7);
}

/** Verifies Firebase idToken only — user may not exist in DB yet (getMe during signup). */
export async function authenticateFirebase(req, res, next) {
  const token = getBearerToken(req);

  if (!token) {
    return sendError(res, {
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      message: 'Authorization token required',
    });
  }

  try {
    const { firebaseUid, phone, email } = await verifyFirebaseIdToken(token);
    req.firebase = { firebaseUid, phone, email };
    return next();
  } catch {
    return sendError(res, {
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      message: 'Invalid or expired Firebase idToken',
    });
  }
}
