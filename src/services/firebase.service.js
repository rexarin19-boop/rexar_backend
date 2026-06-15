import { getFirebaseAuth } from '../config/firebase.admin.js';
import { AppError } from '../utils/AppError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export async function verifyFirebaseIdToken(idToken) {
  try {
    const decoded = await getFirebaseAuth().verifyIdToken(idToken);

    if (!decoded.phone_number && !decoded.email) {
      throw new AppError('Invalid Firebase token', HTTP_STATUS.BAD_REQUEST);
    }

    return {
      firebaseUid: decoded.uid,
      phone: decoded.phone_number ?? null,
      email: decoded.email ? decoded.email.toLowerCase() : null,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;

    throw new AppError('Invalid or expired Firebase token', HTTP_STATUS.UNAUTHORIZED);
  }
}
