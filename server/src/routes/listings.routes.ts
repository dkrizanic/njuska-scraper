import { Router } from 'express';
import { listingsController } from '../controllers/listings.controller';

const router = Router();

router.get('/', listingsController.getListings);
router.get('/:id', listingsController.getListingById);

export default router;
