import { Request, Response } from 'express';
import {
  getNeighborhoodAnalytics,
  getSellerAnalytics,
  getPriceChangeAnalytics,
} from '../services/analytics.service';

export async function getNeighborhoodsController(req: Request, res: Response): Promise<void> {
  try {
    const category = req.query.category as string;
    const data = await getNeighborhoodAnalytics(category);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}

export async function getSellersController(_req: Request, res: Response): Promise<void> {
  try {
    const data = await getSellerAnalytics();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}

export async function getPriceChangesController(_req: Request, res: Response): Promise<void> {
  try {
    const data = await getPriceChangeAnalytics();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
