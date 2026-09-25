import db from '../db/connection.js';
import { createHttpError } from '../middleware/errorHandler.js';
import { addToCart } from '../services/cart.service.js';

function listForUser(userId) {
  const items = db
    .prepare(
      `SELECT w.id, w.product_id, p.name, p.description
       FROM wishlist_items w
       JOIN products p ON p.id = w.product_id
       WHERE w.user_id = ?
       ORDER BY w.id`
    )
    .all(userId);

  const variantStmt = db.prepare(
    `SELECT id, label, price_cents, stock_quantity
     FROM product_variants
     WHERE product_id = ?
     ORDER BY id`
  );

  return items.map((item) => {
    const variants = variantStmt.all(item.product_id).map((variant) => ({
      id: variant.id,
      label: variant.label,
      priceCents: variant.price_cents,
      stockQuantity: variant.stock_quantity,
    }));
    const prices = variants.map((variant) => variant.priceCents);
    return {
      id: item.id,
      productId: item.product_id,
      name: item.name,
      description: item.description,
      variantCount: variants.length,
      minPriceCents: Math.min(...prices),
      maxPriceCents: Math.max(...prices),
      variants,
    };
  });
}

export function listWishlist(req, res) {
  res.json({ items: listForUser(req.user.id) });
}

export function addWishlistItem(req, res) {
  const productId = Number(req.body?.productId);
  if (!Number.isInteger(productId)) throw createHttpError(400, 'productId is required');

  const product = db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
  if (!product) throw createHttpError(404, 'Product not found');

  try {
    db.prepare('INSERT INTO wishlist_items (user_id, product_id) VALUES (?, ?)').run(
      req.user.id,
      productId
    );
  } catch (err) {
    if (err.code !== 'SQLITE_CONSTRAINT_UNIQUE') throw err;
  }

  res.status(201).json({ items: listForUser(req.user.id) });
}

export function removeWishlistItem(req, res) {
  const productId = Number(req.params.productId);
  if (!Number.isInteger(productId)) throw createHttpError(400, 'Invalid product id');

  const result = db
    .prepare('DELETE FROM wishlist_items WHERE user_id = ? AND product_id = ?')
    .run(req.user.id, productId);
  if (result.changes !== 1) throw createHttpError(404, 'Wishlist item not found');

  res.json({ items: listForUser(req.user.id) });
}

export function moveWishlistItem(req, res) {
  const productId = Number(req.body?.productId);
  const variantId = Number(req.body?.variantId);
  if (!Number.isInteger(productId)) throw createHttpError(400, 'productId is required');
  if (!Number.isInteger(variantId)) throw createHttpError(400, 'variantId is required');

  const saved = db
    .prepare('SELECT id FROM wishlist_items WHERE user_id = ? AND product_id = ?')
    .get(req.user.id, productId);
  if (!saved) throw createHttpError(404, 'Wishlist item not found');

  const move = db.transaction(() => {
    const result = addToCart(req.user.id, {
      productId,
      variantId,
      quantity: req.body?.quantity ?? 1,
    });
    db.prepare('DELETE FROM wishlist_items WHERE user_id = ? AND product_id = ?').run(
      req.user.id,
      productId
    );
    return result;
  });

  const result = move();
  res.json({
    clamped: result.clamped,
    cart: result.cart,
    items: listForUser(req.user.id),
  });
}
