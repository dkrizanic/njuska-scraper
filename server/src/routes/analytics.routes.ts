import { Router } from 'express';
import {
  getNeighborhoodsController,
  getSellersController,
  getPriceChangesController,
} from '../controllers/analytics.controller';

const router = Router();

router.get('/neighborhoods', getNeighborhoodsController);
router.get('/sellers', getSellersController);
router.get('/price-changes', getPriceChangesController);

export default router;
