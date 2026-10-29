import {
  NeighborhoodStatsDto,
  SellerAnalyticsDto,
  PriceChangeResponseDto,
} from '../../dtos/analytics';

export interface IAnalyticsService {
  getNeighborhoodAnalytics(category?: string): Promise<NeighborhoodStatsDto[]>;
  getSellerAnalytics(): Promise<SellerAnalyticsDto>;
  getPriceChangeAnalytics(): Promise<PriceChangeResponseDto[]>;
}
