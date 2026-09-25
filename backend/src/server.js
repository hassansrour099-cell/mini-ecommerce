import db from './db/connection.js';
import { env } from './config/env.js';
import app from './app.js';

const ready = db
  .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'products'")
  .get();

if (!ready) {
  console.error('Database is not initialized. From the repo root, run: npm run seed');
  process.exit(1);
}

app.listen(env.port, () => {
  console.log(`API listening on http://localhost:${env.port}`);
});
