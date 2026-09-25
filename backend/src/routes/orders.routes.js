import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createOrder, showOrder } from '../controllers/orders.controller.js';

const router = Router();

router.use(requireAuth);
router.post('/', asyncHandler(createOrder));
router.get('/:id', asyncHandler(showOrder));

export default router;
