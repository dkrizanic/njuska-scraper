import { Router } from 'express';
import { getArbitrageController } from '../controllers/arbitrage.controller';

const router = Router();

router.get('/', getArbitrageController);

export default router;
