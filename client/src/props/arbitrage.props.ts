export interface ArbitrageOpportunity {
  id: number;
  njuskalo_id: string;
  title: string;
  url: string;
  neighborhood: string;
  living_area_m2: number;
  price_eur: number;
  price_per_m2_eur: number;
  rooms: string;
  floor: string;
  seller_name: string;
  seller_type: string;
  views_count: number;
  published_at_raw?: string;
  image_urls: string[];
  neighborhood_avg_pm2: number;
  discount_percentage: number;
  estimated_monthly_revenue: number;
  estimated_monthly_profit: number;
}

export interface ArbitrageCardProps {
  item: ArbitrageOpportunity;
}

export interface ArbitrageGridProps {
  items: ArbitrageOpportunity[];
  loading?: boolean;
}
