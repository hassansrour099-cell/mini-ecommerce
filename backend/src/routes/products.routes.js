import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getProduct, listProducts } from '../controllers/products.controller.js';

const router = Router();

router.get('/', asyncHandler(listProducts));
router.get('/:id', asyncHandler(getProduct));

export default router;
