import { getOrder, placeOrder } from '../services/orders.service.js';

export function createOrder(req, res) {
  const order = placeOrder(req.user.id);
  res.status(201).json({ order });
}

export function showOrder(req, res) {
  res.json({ order: getOrder(req.user.id, req.params.id) });
}
