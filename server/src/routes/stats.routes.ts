import { Router } from 'express';
import { getStatsController } from '../controllers/stats.controller';

const router = Router();

router.get('/', getStatsController);

export default router;
