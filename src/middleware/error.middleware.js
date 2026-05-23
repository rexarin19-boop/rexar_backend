import { env } from '../config/env.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { sendError } from '../utils/apiResponse.js';
import { AppError } from '../utils/AppError.js';

export function notFoundHandler(req, res) {
  return sendError(res, {
    statusCode: HTTP_STATUS.NOT_FOUND,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
}

export function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    return sendError(res, {
      statusCode: err.statusCode,
      message: err.message,
      errors: err.errors,
    });
  }

  console.error(err);

  if (err.code === 'P2010' || err.name === 'PrismaClientInitializationError') {
    return sendError(res, {
      statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
      message:
        'Database not connected',
    });
  }

  return sendError(res, {
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message: env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
}
