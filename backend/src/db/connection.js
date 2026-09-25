import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { env } from '../config/env.js';

fs.mkdirSync(path.dirname(env.databasePath), { recursive: true });

const db = new Database(env.databasePath);
db.pragma('foreign_keys = ON');

export default db;
