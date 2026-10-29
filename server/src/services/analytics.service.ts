import {
  fetchNeighborhoodStats,
  fetchSellerStats,
  fetchPriceChanges,
  NeighborhoodStat,
  SellerAnalytics,
  PriceChangeRecord,
} from '../models/analytics.model';

export async function getNeighborhoodAnalytics(category?: string): Promise<NeighborhoodStat[]> {
  return fetchNeighborhoodStats(category);
}

export async function getSellerAnalytics(): Promise<SellerAnalytics> {
  return fetchSellerStats();
}

export async function getPriceChangeAnalytics(): Promise<PriceChangeRecord[]> {
  return fetchPriceChanges();
}
