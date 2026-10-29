import { Router } from 'express';
import { getListingsController } from '../controllers/listings.controller';

const router = Router();

router.get('/', getListingsController);

export default router;
