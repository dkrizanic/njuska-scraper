import { IAnalyticsService } from '../interfaces/services/analytics.service.interface';
import { IAnalyticsRepository } from '../interfaces/repositories/analytics.repository.interface';
import { AnalyticsRepository } from '../repositories/analytics.repository';
import {
  NeighborhoodStatsDto,
  SellerAnalyticsDto,
  PriceChangeResponseDto,
} from '../dtos/analytics';

export class AnalyticsService implements IAnalyticsService {
  constructor(private readonly analyticsRepo: IAnalyticsRepository = new AnalyticsRepository()) {}

  public async getNeighborhoodAnalytics(category?: string): Promise<NeighborhoodStatsDto[]> {
    const rows = await this.analyticsRepo.getNeighborhoodStats(category);
    return rows.map(row => NeighborhoodStatsDto.fromRow(row));
  }

  public async getSellerAnalytics(): Promise<SellerAnalyticsDto> {
    const { typeRows, sellerRows } = await this.analyticsRepo.getSellerStats();
    return SellerAnalyticsDto.fromRows(typeRows, sellerRows);
  }

  public async getPriceChangeAnalytics(): Promise<PriceChangeResponseDto[]> {
    const rows = await this.analyticsRepo.getPriceChanges();
    return rows.map(row => PriceChangeResponseDto.fromRow(row));
  }
}
