export interface IAnalyticsRepository {
  getNeighborhoodStats(category?: string): Promise<Record<string, any>[]>;
  getSellerStats(): Promise<{ typeRows: Record<string, any>[]; sellerRows: Record<string, any>[] }>;
  getPriceChanges(): Promise<Record<string, any>[]>;
  getRawArbitrageListings(): Promise<Record<string, any>[]>;
}
