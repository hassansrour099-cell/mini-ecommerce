import db from '../db/connection.js';
import { createHttpError } from '../middleware/errorHandler.js';

function mapVariant(row) {
  return {
    id: row.id,
    label: row.label,
    sku: row.sku,
    priceCents: row.price_cents,
    stockQuantity: row.stock_quantity,
  };
}

export function listProducts(req, res) {
  const rows = db
    .prepare(
      `SELECT
         p.id,
         p.name,
         p.description,
         COUNT(pv.id) AS variant_count,
         MIN(pv.price_cents) AS min_price_cents,
         MAX(pv.price_cents) AS max_price_cents,
         SUM(pv.stock_quantity) AS total_stock
       FROM products p
       JOIN product_variants pv ON pv.product_id = p.id
       GROUP BY p.id
       ORDER BY p.id`
    )
    .all();

  res.json({
    products: rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      variantCount: row.variant_count,
      minPriceCents: row.min_price_cents,
      maxPriceCents: row.max_price_cents,
      totalStock: row.total_stock,
    })),
  });
}

export function getProduct(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw createHttpError(400, 'Invalid product id');

  const product = db.prepare('SELECT id, name, description FROM products WHERE id = ?').get(id);
  if (!product) throw createHttpError(404, 'Product not found');

  const variants = db
    .prepare(
      `SELECT id, label, sku, price_cents, stock_quantity
       FROM product_variants
       WHERE product_id = ?
       ORDER BY id`
    )
    .all(id)
    .map(mapVariant);

  res.json({ product: { ...product, variants } });
}
