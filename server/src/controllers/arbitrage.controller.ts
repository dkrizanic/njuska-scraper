import { Request, Response } from 'express';
import { getArbitrageOpportunities } from '../services/arbitrage.service';

export async function getArbitrageController(_req: Request, res: Response): Promise<void> {
  try {
    const opportunities = await getArbitrageOpportunities();
    res.json(opportunities);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
