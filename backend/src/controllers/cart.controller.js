import { addToCart, clearCart, getCart, removeCartItem, updateCartItem } from '../services/cart.service.js';

export function listCart(req, res) {
  res.json(getCart(req.user.id));
}

export function createCartItem(req, res) {
  const result = addToCart(req.user.id, req.body);
  res.status(201).json(result);
}

export function patchCartItem(req, res) {
  res.json(updateCartItem(req.user.id, req.params.itemId, req.body));
}

export function deleteCartItem(req, res) {
  res.json(removeCartItem(req.user.id, req.params.itemId));
}

export function deleteCart(req, res) {
  res.json(clearCart(req.user.id));
}
