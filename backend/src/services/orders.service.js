import db from '../db/connection.js';
import { createHttpError } from '../middleware/errorHandler.js';

export class InsufficientStockError extends Error {
  constructor(line, available) {
    const label = `${line.product_name} (${line.variant_label})`;
    const unit = available === 1 ? 'unit' : 'units';
    super(`Only ${available} ${unit} of '${label}' remain in stock.`);
    this.name = 'InsufficientStockError';
    this.code = 'INSUFFICIENT_STOCK';
    this.details = {
      variantId: line.variant_id,
      availableStock: available,
      productName: line.product_name,
      variantLabel: line.variant_label,
      requested: line.quantity,
    };
  }
}

function mapOrder(order, items) {
  return {
    id: order.id,
    totalCents: order.total_cents,
    createdAt: order.created_at,
    items: items.map((item) => ({
      id: item.id,
      variantId: item.variant_id,
      productName: item.product_title_snapshot,
      variantLabel: item.variant_name_snapshot,
      unitPriceCents: item.price_cents_at_purchase,
      quantity: item.quantity,
      lineTotalCents: item.price_cents_at_purchase * item.quantity,
    })),
  };
}

export function getOrder(userId, orderId) {
  const id = Number(orderId);
  if (!Number.isInteger(id)) throw createHttpError(400, 'Invalid order id');

  const order = db
    .prepare('SELECT id, user_id, total_cents, created_at FROM orders WHERE id = ? AND user_id = ?')
    .get(id, userId);
  if (!order) throw createHttpError(404, 'Order not found');

  const items = db
    .prepare(
      `SELECT id, variant_id, product_title_snapshot, variant_name_snapshot, price_cents_at_purchase, quantity
       FROM order_items
       WHERE order_id = ?
       ORDER BY id`
    )
    .all(order.id);

  return mapOrder(order, items);
}

export function placeOrder(userId) {
  const checkout = db.transaction((uid) => {
    const lines = db
      .prepare(
        `SELECT
           ci.variant_id,
           ci.quantity,
           pv.price_cents,
           pv.label AS variant_label,
           p.name AS product_name
         FROM cart_items ci
         JOIN product_variants pv ON pv.id = ci.variant_id
         JOIN products p ON p.id = pv.product_id
         WHERE ci.user_id = ?
         ORDER BY ci.id`
      )
      .all(uid);

    if (lines.length === 0) {
      throw createHttpError(400, 'Your cart is empty', { code: 'EMPTY_CART' });
    }

    const stockStmt = db.prepare('SELECT stock_quantity FROM product_variants WHERE id = ?');
    for (const line of lines) {
      const current = stockStmt.get(line.variant_id);
      const available = current ? current.stock_quantity : 0;
      if (line.quantity > available) throw new InsufficientStockError(line, available);
    }

    const totalCents = lines.reduce((sum, line) => sum + line.price_cents * line.quantity, 0);
    const created = db
      .prepare('INSERT INTO orders (user_id, total_cents) VALUES (?, ?)')
      .run(uid, totalCents);
    const orderId = Number(created.lastInsertRowid);

    const insertItem = db.prepare(
      `INSERT INTO order_items
         (order_id, variant_id, product_title_snapshot, variant_name_snapshot, price_cents_at_purchase, quantity)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    const decrement = db.prepare(
      `UPDATE product_variants
       SET stock_quantity = stock_quantity - ?
       WHERE id = ? AND stock_quantity >= ?`
    );

    for (const line of lines) {
      const result = decrement.run(line.quantity, line.variant_id, line.quantity);
      if (result.changes !== 1) {
        const current = stockStmt.get(line.variant_id);
        throw new InsufficientStockError(line, current ? current.stock_quantity : 0);
      }
      insertItem.run(
        orderId,
        line.variant_id,
        line.product_name,
        line.variant_label,
        line.price_cents,
        line.quantity
      );
    }

    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(uid);
    return orderId;
  });

  const orderId = checkout.immediate(userId);
  return getOrder(userId, orderId);
}
