import { HTTP_STATUS } from '../constants/httpStatus.js';
import { sendError } from '../utils/apiResponse.js';

export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return sendError(res, {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Validation failed',
        errors,
      });
    }

    req.body = result.data;
    next();
  };
}
