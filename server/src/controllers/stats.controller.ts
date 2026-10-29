import { Request, Response, NextFunction } from 'express';
import { IStatsService } from '../interfaces/services/stats.service.interface';
import { StatsService } from '../services/stats.service';

export class StatsController {
  constructor(private readonly statsService: IStatsService = new StatsService()) {}

  getStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.statsService.getPlatformStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  };
}

export const statsController = new StatsController();
export const getStatsController = statsController.getStats;
