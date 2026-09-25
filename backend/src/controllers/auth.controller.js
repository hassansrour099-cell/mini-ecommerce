import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../db/connection.js';
import { env } from '../config/env.js';
import { createHttpError } from '../middleware/errorHandler.js';

export function login(req, res) {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!email || !password) {
    throw createHttpError(400, 'Email and password are required');
  }

  const user = db.prepare('SELECT id, email, name, password_hash FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    throw createHttpError(401, 'Invalid email or password');
  }

  const token = jwt.sign({ sub: user.id, email: user.email }, env.jwtSecret, { expiresIn: '7d' });
  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name },
  });
}
