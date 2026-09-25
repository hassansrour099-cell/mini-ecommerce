import db from '../db/connection.js';
import { createHttpError } from '../middleware/errorHandler.js';

function parseQuantity(value) {
  const quantity = Number(value);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    throw createHttpError(400, 'Quantity must be a whole number from 1 to 99');
  }
  return quantity;
}

function loadVariant(variantId) {
  const variant = db
    .prepare(
      `SELECT pv.id, pv.product_id, pv.label, pv.price_cents, pv.stock_quantity, p.name AS product_name
       FROM product_variants pv
       JOIN products p ON p.id = pv.product_id
       WHERE pv.id = ?`
    )
    .get(variantId);
  if (!variant) throw createHttpError(400, 'Variant not found');
  return variant;
}

function assertVariantForProduct(variant, productId) {
  if (Number(productId) !== variant.product_id) {
    throw createHttpError(400, 'Variant does not belong to that product');
  }
}

function stockError(variant, requested) {
  return createHttpError(
    409,
    `${variant.product_name} (${variant.label}) only has ${variant.stock_quantity} in stock`,
    {
      code: 'INSUFFICIENT_STOCK',
      details: {
        productName: variant.product_name,
        variantLabel: variant.label,
        variantId: variant.id,
        requested,
        available: variant.stock_quantity,
      },
    }
  );
}

function mapCartItem(row, variantsByProduct) {
  return {
    id: row.id,
    quantity: row.quantity,
    variantId: row.variant_id,
    variantLabel: row.variant_label,
    priceCents: row.price_cents,
    stockQuantity: row.stock_quantity,
    productId: row.product_id,
    productName: row.product_name,
    lineTotalCents: row.price_cents * row.quantity,
    variants: variantsByProduct.get(row.product_id),
  };
}

export function getCart(userId) {
  const rows = db
    .prepare(
      `SELECT
         ci.id,
         ci.quantity,
         ci.variant_id,
         pv.label AS variant_label,
         pv.price_cents,
         pv.stock_quantity,
         pv.product_id,
         p.name AS product_name
       FROM cart_items ci
       JOIN product_variants pv ON pv.id = ci.variant_id
       JOIN products p ON p.id = pv.product_id
       WHERE ci.user_id = ?
       ORDER BY ci.id`
    )
    .all(userId);

  const variantStmt = db.prepare(
    `SELECT id, label, price_cents, stock_quantity
     FROM product_variants
     WHERE product_id = ?
     ORDER BY id`
  );
  const variantsByProduct = new Map();
  for (const row of rows) {
    if (!variantsByProduct.has(row.product_id)) {
      variantsByProduct.set(
        row.product_id,
        variantStmt.all(row.product_id).map((variant) => ({
          id: variant.id,
          label: variant.label,
          priceCents: variant.price_cents,
          stockQuantity: variant.stock_quantity,
        }))
      );
    }
  }

  const items = rows.map((row) => mapCartItem(row, variantsByProduct));
  return {
    items,
    totalCents: items.reduce((sum, item) => sum + item.lineTotalCents, 0),
  };
}

function writeQuantity(userId, variant, quantity, existing) {
  if (variant.stock_quantity < 1) throw stockError(variant, quantity);

  if (existing) {
    const next = Math.min(existing.quantity + quantity, variant.stock_quantity);
    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(next, existing.id);
    return next < existing.quantity + quantity;
  }

  if (quantity > variant.stock_quantity) throw stockError(variant, quantity);

  try {
    db.prepare('INSERT INTO cart_items (user_id, variant_id, quantity) VALUES (?, ?, ?)').run(
      userId,
      variant.id,
      quantity
    );
  } catch (err) {
    if (err.code !== 'SQLITE_CONSTRAINT_UNIQUE') throw err;
    const row = db
      .prepare('SELECT id, quantity FROM cart_items WHERE user_id = ? AND variant_id = ?')
      .get(userId, variant.id);
    const next = Math.min(row.quantity + quantity, variant.stock_quantity);
    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(next, row.id);
    return next < row.quantity + quantity;
  }
  return false;
}

export function addToCart(userId, body) {
  if (!Number.isInteger(Number(body?.productId)) || !Number.isInteger(Number(body?.variantId))) {
    throw createHttpError(400, 'productId and variantId are required');
  }
  const quantity = parseQuantity(body?.quantity ?? 1);
  const variant = loadVariant(body.variantId);
  assertVariantForProduct(variant, body?.productId);
  const existing = db
    .prepare('SELECT id, quantity FROM cart_items WHERE user_id = ? AND variant_id = ?')
    .get(userId, variant.id);
  const clamped = writeQuantity(userId, variant, quantity, existing);
  return { clamped, cart: getCart(userId) };
}

export function updateCartItem(userId, itemId, body) {
  const id = Number(itemId);
  if (!Number.isInteger(id)) throw createHttpError(400, 'Invalid item id');
  if (body?.quantity === undefined && body?.variantId === undefined) {
    throw createHttpError(400, 'Provide a quantity or a variantId');
  }

  const item = db
    .prepare(
      `SELECT ci.id, ci.quantity, ci.variant_id, pv.product_id
       FROM cart_items ci
       JOIN product_variants pv ON pv.id = ci.variant_id
       WHERE ci.id = ? AND ci.user_id = ?`
    )
    .get(id, userId);
  if (!item) throw createHttpError(404, 'Cart item not found');

  const variant = loadVariant(body.variantId !== undefined ? body.variantId : item.variant_id);
  if (variant.product_id !== item.product_id) {
    throw createHttpError(400, 'Variant does not belong to that product');
  }

  const quantity = body.quantity !== undefined ? parseQuantity(body.quantity) : item.quantity;
  if (quantity > variant.stock_quantity) throw stockError(variant, quantity);

  const conflict = db
    .prepare('SELECT id, quantity FROM cart_items WHERE user_id = ? AND variant_id = ? AND id != ?')
    .get(userId, variant.id, item.id);

  if (conflict) {
    const merged = Math.min(conflict.quantity + quantity, variant.stock_quantity);
    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(merged, conflict.id);
    db.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?').run(item.id, userId);
  } else {
    db.prepare('UPDATE cart_items SET variant_id = ?, quantity = ? WHERE id = ? AND user_id = ?').run(
      variant.id,
      quantity,
      item.id,
      userId
    );
  }

  return getCart(userId);
}

export function removeCartItem(userId, itemId) {
  const id = Number(itemId);
  if (!Number.isInteger(id)) throw createHttpError(400, 'Invalid item id');
  const result = db.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?').run(id, userId);
  if (result.changes !== 1) throw createHttpError(404, 'Cart item not found');
  return getCart(userId);
}

export function clearCart(userId) {
  db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId);
  return getCart(userId);
}
