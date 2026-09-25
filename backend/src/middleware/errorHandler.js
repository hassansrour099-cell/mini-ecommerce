export function createHttpError(status, message, extras = {}) {
  const err = new Error(message);
  err.status = status;
  if (extras.code) err.code = extras.code;
  if (extras.details) err.details = extras.details;
  return err;
}

function sendError(res, status, code, message, details) {
  const error = { code, message };
  if (details) error.details = details;
  res.status(status).json({ error });
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err.type === 'entity.parse.failed') {
    return sendError(res, 400, 'INVALID_JSON', 'Invalid JSON');
  }

  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY' || err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return sendError(res, 400, 'CONSTRAINT', 'Invalid reference or duplicate record');
  }

  const status = Number.isInteger(err.status) ? err.status : 500;
  if (status >= 500) console.error(err);

  sendError(
    res,
    status,
    status >= 500 ? 'INTERNAL' : err.code || 'REQUEST_FAILED',
    status >= 500 ? 'Something went wrong' : err.message,
    status < 500 ? err.details : undefined
  );
}
