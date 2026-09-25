export function createHttpError(status, message, extras = {}) {
  const err = new Error(message);
  err.status = status;
  if (extras.code) err.code = extras.code;
  if (extras.details) err.details = extras.details;
  return err;
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY' || err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(400).json({ error: 'Invalid reference or duplicate record' });
  }

  const status = Number.isInteger(err.status) ? err.status : 500;
  if (status >= 500) console.error(err);

  const body = {
    error: status >= 500 ? 'Something went wrong' : err.message,
  };
  if (status < 500 && err.code) body.code = err.code;
  if (status < 500 && err.details) body.details = err.details;
  res.status(status).json(body);
}
