export interface SellerTypeMetricDto {
  seller_type: string;
  unique_accounts: number;
  active_listings: number;
  total_views: number;
  avg_views: number;
  avg_pm2: number;
}

export interface TopSellerMetricDto {
  seller_name: string;
  seller_type: string;
  listings_count: number;
  total_views: number;
  avg_pm2: number;
}

export class SellerAnalyticsDto {
  public sellerTypes: SellerTypeMetricDto[];
  public topSellers: TopSellerMetricDto[];

  constructor(sellerTypes: SellerTypeMetricDto[], topSellers: TopSellerMetricDto[]) {
    this.sellerTypes = sellerTypes;
    this.topSellers = topSellers;
  }

  public static fromRows(typeRows: Record<string, any>[], sellerRows: Record<string, any>[]): SellerAnalyticsDto {
    const sellerTypes = typeRows.map(row => ({
      seller_type: String(row.seller_type),
      unique_accounts: parseInt(row.unique_accounts, 10),
      active_listings: parseInt(row.active_listings, 10),
      total_views: parseInt(row.total_views || '0', 10),
      avg_views: parseInt(row.avg_views || '0', 10),
      avg_pm2: parseFloat(row.avg_pm2 || '0'),
    }));

    const topSellers = sellerRows.map(row => ({
      seller_name: String(row.seller_name),
      seller_type: String(row.seller_type),
      listings_count: parseInt(row.listings_count, 10),
      total_views: parseInt(row.total_views || '0', 10),
      avg_pm2: parseFloat(row.avg_pm2 || '0'),
    }));

    return new SellerAnalyticsDto(sellerTypes, topSellers);
  }
}
