import { Request, Response } from 'express';
import { getListings, ListingsQueryParams } from '../services/listings.service';

export async function getListingsController(req: Request, res: Response): Promise<void> {
  try {
    const params: ListingsQueryParams = {
      category: req.query.category as string,
      neighborhood: req.query.neighborhood as string,
      sellerType: req.query.sellerType as string,
      minPrice: req.query.minPrice as string,
      maxPrice: req.query.maxPrice as string,
      query: req.query.query as string,
      sort: req.query.sort as string,
      limit: req.query.limit as string,
      offset: req.query.offset as string,
      page: req.query.page as string,
    };

    const result = await getListings(params);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
