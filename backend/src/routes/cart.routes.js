import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createCartItem,
  deleteCart,
  deleteCartItem,
  listCart,
  patchCartItem,
} from '../controllers/cart.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/', asyncHandler(listCart));
router.post('/', asyncHandler(createCartItem));
router.delete('/', asyncHandler(deleteCart));
router.patch('/:itemId', asyncHandler(patchCartItem));
router.delete('/:itemId', asyncHandler(deleteCartItem));

export default router;
