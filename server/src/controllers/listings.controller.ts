import { Request, Response, NextFunction } from 'express';
import { IListingsService } from '../interfaces/services/listing.service.interface';
import { ListingsService } from '../services/listings.service';
import { ListingQueryDto } from '../dtos/listing/listing-query.dto';

export class ListingsController {
  constructor(private readonly listingsService: IListingsService = new ListingsService()) {}

  getListings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const queryDto = ListingQueryDto.fromRequest(req.query);
      const result = await this.listingsService.getListings(queryDto);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getListingById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const id = parseInt(rawId as string, 10);
      const result = await this.listingsService.getListingById(id);
      if (!result) {
        res.status(404).json({ error: 'Listing not found' });
        return;
      }
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}

export const listingsController = new ListingsController();
export const getListingsController = listingsController.getListings;
