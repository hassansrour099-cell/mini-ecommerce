import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { createHttpError } from './errorHandler.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return next(createHttpError(401, 'Authentication required'));

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = { id: payload.sub, email: payload.email };
    return next();
  } catch {
    return next(createHttpError(401, 'Invalid or expired token'));
  }
}
