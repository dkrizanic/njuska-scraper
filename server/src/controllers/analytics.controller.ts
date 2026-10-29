import { Request, Response, NextFunction } from 'express';
import { IAnalyticsService } from '../interfaces/services/analytics.service.interface';
import { AnalyticsService } from '../services/analytics.service';

export class AnalyticsController {
  constructor(private readonly analyticsService: IAnalyticsService = new AnalyticsService()) {}

  getNeighborhoods = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = req.query.category as string;
      const data = await this.analyticsService.getNeighborhoodAnalytics(category);
      res.json(data);
    } catch (error) {
      next(error);
    }
  };

  getSellers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.analyticsService.getSellerAnalytics();
      res.json(data);
    } catch (error) {
      next(error);
    }
  };

  getPriceChanges = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.analyticsService.getPriceChangeAnalytics();
      res.json(data);
    } catch (error) {
      next(error);
    }
  };
}

export const analyticsController = new AnalyticsController();
export const getNeighborhoodsController = analyticsController.getNeighborhoods;
export const getSellersController = analyticsController.getSellers;
export const getPriceChangesController = analyticsController.getPriceChanges;
