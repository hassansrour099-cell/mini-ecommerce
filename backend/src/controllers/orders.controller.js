import { InsufficientStockError, getOrder, placeOrder } from '../services/orders.service.js';

export function createOrder(req, res, next) {
  try {
    const order = placeOrder(req.user.id);
    res.status(201).json({ order });
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      err.status = 409;
      err.code = 'INSUFFICIENT_STOCK';
    }
    next(err);
  }
}

export function showOrder(req, res) {
  res.json({ order: getOrder(req.user.id, req.params.id) });
}
