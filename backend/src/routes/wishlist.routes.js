import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  addWishlistItem,
  listWishlist,
  moveWishlistItem,
  removeWishlistItem,
} from '../controllers/wishlist.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/', asyncHandler(listWishlist));
router.post('/', asyncHandler(addWishlistItem));
router.post('/move', asyncHandler(moveWishlistItem));
router.delete('/:productId', asyncHandler(removeWishlistItem));

export default router;
