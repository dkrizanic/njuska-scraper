export interface NeighborhoodStat {
  neighborhood: string;
  total_ads: number;
  avg_price: number;
  avg_pm2: number;
  avg_views: number;
  total_views: number;
}

export interface SellerTypeStat {
  seller_type: string;
  unique_accounts: number;
  active_listings: number;
  total_views: number;
  avg_views: number;
  avg_pm2: number;
}

export interface TopSellerStat {
  seller_name: string;
  seller_type: string;
  listings_count: number;
  total_views: number;
  avg_pm2: number;
}

export interface SellersAnalyticsData {
  sellerTypes: SellerTypeStat[];
  topSellers: TopSellerStat[];
}

export interface NeighborhoodChartProps {
  data: NeighborhoodStat[];
  category: 'all' | 'rent' | 'sale';
}

export interface SellersOverviewProps {
  data: SellersAnalyticsData;
}
