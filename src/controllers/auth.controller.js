import { HTTP_STATUS } from '../constants/httpStatus.js';
import * as authService from '../services/auth.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

export async function verify(req, res) {
  const result = await authService.verifyAndLogin({ idToken: req.body.idToken });

  if (result.needsRegistration) {
    return sendSuccess(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Phone verified. Complete registration.',
      data: {
        needsRegistration: true,
        phone: result.phone,
      },
    });
  }

  return sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Login successful',
    data: {
      needsRegistration: false,
      ...result,
    },
  });
}

export async function register(req, res) {
  const result = await authService.registerUser({
    idToken: req.body.idToken,
    displayName: req.body.displayName,
    avatarUrl: req.body.avatarUrl ?? null,
    role: req.body.role,
  });

  return sendSuccess(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'Registration successful',
    data: result,
  });
}

export async function refresh(req, res) {
  const result = await authService.refreshSession(req.body.refreshToken);

  return sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Token refreshed',
    data: result,
  });
}

export async function logout(req, res) {
  const result = await authService.logoutUser(req.body.refreshToken);

  return sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Logged out',
    data: result,
  });
}

export async function me(req, res) {
  const user = await authService.getUserById(req.user.id);

  return sendSuccess(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Profile fetched',
    data: { user },
  });
}
