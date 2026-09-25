import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

dotenv.config({ path: path.join(backendRoot, '.env') });

function resolveDatabasePath() {
  const configured = process.env.DATABASE_PATH || './data/shop.db';
  if (path.isAbsolute(configured)) return configured;
  return path.resolve(backendRoot, configured);
}

export const env = {
  port: Number(process.env.PORT || 3001),
  jwtSecret: process.env.JWT_SECRET || 'dev-only-change-me',
  databasePath: resolveDatabasePath(),
};

export const demoAccount = {
  email: 'ada@copperandgrain.test',
  password: 'brew-demo-1847',
  name: 'Ada Pell',
};
