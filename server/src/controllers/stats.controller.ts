import { Request, Response } from 'express';
import { getStats } from '../services/stats.service';

export async function getStatsController(_req: Request, res: Response): Promise<void> {
  try {
    const stats = await getStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
