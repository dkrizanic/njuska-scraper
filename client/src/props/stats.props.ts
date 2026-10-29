export interface Stats {
  totalListings: number;
  withPrice: number;
  rentalsCount: number;
  salesCount: number;
  detailedCount: number;
  sellersCount: number;
  totalViews: number;
  avgViews: number;
  avgSalePrice: number;
  avgSalePm2: number;
  avgRentPrice: number;
  avgRentPm2: number;
}

export interface KpiCardsProps {
  stats: Stats | null;
  arbitrageCount: number;
}
