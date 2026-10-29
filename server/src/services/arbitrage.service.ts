import { IArbitrageService } from '../interfaces/services/arbitrage.service.interface';
import { IAnalyticsRepository } from '../interfaces/repositories/analytics.repository.interface';
import { AnalyticsRepository } from '../repositories/analytics.repository';
import { ArbitrageResponseDto } from '../dtos/arbitrage/arbitrage-response.dto';

export function estimateMonthlyRevenue(livingAreaM2: number): number {
  const area = Math.max(0, livingAreaM2 || 0);
  if (area <= 40) return 55 * 20;
  if (area <= 65) return 75 * 20;
  if (area <= 90) return 95 * 20;
  return 125 * 20;
}

export function calculateArbitrageMetrics(
  priceEur: number,
  livingAreaM2: number,
  neighborhoodAvgPm2: number,
  pricePerM2Eur: number
) {
  const estimatedRevenue = estimateMonthlyRevenue(livingAreaM2);
  const estimatedMonthlyProfit = Math.round(estimatedRevenue - (priceEur || 0));

  let discountPercentage = 0;
  if (neighborhoodAvgPm2 > 0 && pricePerM2Eur > 0) {
    discountPercentage = Math.round(((neighborhoodAvgPm2 - pricePerM2Eur) / neighborhoodAvgPm2) * 1000) / 10;
  }

  return {
    discountPercentage,
    estimatedMonthlyRevenue: estimatedRevenue,
    estimatedMonthlyProfit,
  };
}

export class ArbitrageService implements IArbitrageService {
  constructor(private readonly analyticsRepo: IAnalyticsRepository = new AnalyticsRepository()) {}

  public async getArbitrageOpportunities(): Promise<ArbitrageResponseDto[]> {
    const rows = await this.analyticsRepo.getRawArbitrageListings();

    const dtos: ArbitrageResponseDto[] = rows.map(row => {
      const priceEur = parseFloat(row.price_eur || '0');
      const area = parseFloat(row.living_area_m2 || '0');
      const avgPm2 = parseFloat(row.neighborhood_avg_pm2 || '0');
      const pm2 = parseFloat(row.price_per_m2_eur || '0');

      const metrics = calculateArbitrageMetrics(priceEur, area, avgPm2, pm2);
      return ArbitrageResponseDto.fromCalculated(row, metrics);
    });

    return dtos
      .sort((a, b) => b.discount_percentage - a.discount_percentage || b.estimated_monthly_profit - a.estimated_monthly_profit)
      .slice(0, 30);
  }
}
