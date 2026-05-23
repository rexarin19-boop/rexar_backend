export function sendSuccess(res, { statusCode = 200, message, data, meta }) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta,
  });
}

export function sendError(res, { statusCode = 500, message, errors }) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}
