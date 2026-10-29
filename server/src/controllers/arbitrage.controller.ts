import { Request, Response, NextFunction } from 'express';
import { IArbitrageService } from '../interfaces/services/arbitrage.service.interface';
import { ArbitrageService } from '../services/arbitrage.service';

export class ArbitrageController {
  constructor(private readonly arbitrageService: IArbitrageService = new ArbitrageService()) {}

  getArbitrage = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const opportunities = await this.arbitrageService.getArbitrageOpportunities();
      res.json(opportunities);
    } catch (error) {
      next(error);
    }
  };
}

export const arbitrageController = new ArbitrageController();
export const getArbitrageController = arbitrageController.getArbitrage;
