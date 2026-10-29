import { Router } from 'express';
import statsRoutes from './stats.routes';
import listingsRoutes from './listings.routes';
import arbitrageRoutes from './arbitrage.routes';
import analyticsRoutes from './analytics.routes';

const router = Router();

router.use('/stats', statsRoutes);
router.use('/listings', listingsRoutes);
router.use('/rental-arbitrage', arbitrageRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
