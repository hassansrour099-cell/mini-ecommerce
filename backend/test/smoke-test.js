import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const databasePath = path.join(os.tmpdir(), `mini-ecommerce-smoke-${process.pid}.db`);
const demoEmail = 'ada@copperandgrain.test';
const demoPassword = 'brew-demo-1847';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function runSeed() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['src/db/seed.js'], {
      cwd: backendRoot,
      env: { ...process.env, DATABASE_PATH: databasePath, JWT_SECRET: 'smoke-test-secret' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr || `seed exited ${code}`));
    });
  });
}

const failures = [];
let server;
let db;

try {
  await runSeed();
  process.env.DATABASE_PATH = databasePath;
  process.env.JWT_SECRET = 'smoke-test-secret';

  const { default: app } = await import('../src/app.js');
  const { default: connection } = await import('../src/db/connection.js');
  db = connection;
  server = await new Promise((resolve) => {
    const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
  });
  const base = `http://127.0.0.1:${server.address().port}`;

  async function request(pathname, { method = 'GET', token, body } = {}) {
    const response = await fetch(`${base}${pathname}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const data = await response.json().catch(() => ({}));
    return { status: response.status, data };
  }

  const login = await request('/api/auth/login', {
    method: 'POST',
    body: { email: demoEmail, password: demoPassword },
  });
  assert(login.status === 200 && login.data.token, 'login did not return a token');
  const token = login.data.token;

  const catalog = await request('/api/products');
  assert(catalog.status === 200 && catalog.data.products.length === 15, 'expected 15 products');
  assert(
    catalog.data.products.every((product) => product.variantCount >= 1),
    'a product is missing its variant'
  );

  const detail = await request('/api/products/5');
  const variant = detail.data.product.variants[0];
  const before = variant.stockQuantity;
  assert(before >= 2, 'brew scale needs stock for the order check');

  const added = await request('/api/cart', {
    method: 'POST',
    token,
    body: { productId: 5, variantId: variant.id, quantity: 2 },
  });
  assert(added.status === 201 && added.data.cart.items.length === 1, 'cart add failed');
  assert(added.data.cart.items[0].quantity === 2, 'cart quantity was not 2');

  const patched = await request(`/api/cart/${added.data.cart.items[0].id}`, {
    method: 'PATCH',
    token,
    body: { quantity: 1 },
  });
  assert(patched.status === 200 && patched.data.cart.items[0].quantity === 1, 'quantity update failed');

  const order = await request('/api/orders', { method: 'POST', token, body: {} });
  assert(order.status === 201, 'checkout failed');
  assert(order.data.order.items[0].quantity === 1, 'order line quantity mismatch');
  const after = db.prepare('SELECT stock_quantity FROM product_variants WHERE id = ?').get(variant.id);
  assert(after.stock_quantity === before - 1, 'stock did not decrement');
  const cart = await request('/api/cart', { token });
  assert(cart.data.items.length === 0, 'cart was not cleared');

  const restocked = await request('/api/cart', {
    method: 'POST',
    token,
    body: { productId: 5, variantId: variant.id, quantity: 2 },
  });
  assert(restocked.status === 201, 'second cart add failed');
  db.prepare('UPDATE product_variants SET stock_quantity = 1 WHERE id = ?').run(variant.id);
  const conflict = await request('/api/orders', { method: 'POST', token, body: {} });
  assert(conflict.status === 409, `expected 409, got ${conflict.status}`);
  assert(conflict.data.error?.code === 'INSUFFICIENT_STOCK', 'missing INSUFFICIENT_STOCK code');
  assert(conflict.data.error?.details?.variantId === variant.id, 'conflict did not name the variant');
  assert(conflict.data.error?.details?.availableStock === 1, 'conflict did not report available stock');
  const stillThere = db.prepare('SELECT quantity FROM cart_items WHERE user_id = ?').get(login.data.user.id);
  assert(stillThere?.quantity === 2, 'failed checkout changed the cart');
  const unchanged = db.prepare('SELECT stock_quantity FROM product_variants WHERE id = ?').get(variant.id);
  assert(unchanged.stock_quantity === 1, 'failed checkout changed stock');

  console.log('smoke test passed');
} catch (err) {
  failures.push(err);
  console.error(err.message);
} finally {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (db) db.close();
  for (const suffix of ['', '-wal', '-shm']) {
    fs.rmSync(databasePath + suffix, { force: true });
  }
}

if (failures.length) process.exit(1);
