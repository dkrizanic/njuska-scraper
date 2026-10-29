import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';

const router = Router();

router.get('/neighborhoods', analyticsController.getNeighborhoods);
router.get('/sellers', analyticsController.getSellers);
router.get('/price-changes', analyticsController.getPriceChanges);

export default router;
