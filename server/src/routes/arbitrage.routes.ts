import { Router } from 'express';
import { arbitrageController } from '../controllers/arbitrage.controller';

const router = Router();

router.get('/', arbitrageController.getArbitrage);

export default router;
