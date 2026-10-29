import { fetchRawRentalArbitrageListings } from '../models/analytics.model';

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

export async function getArbitrageOpportunities(): Promise<ArbitrageOpportunity[]> {
  const rows = await fetchRawRentalArbitrageListings();

  const computed: ArbitrageOpportunity[] = rows.map(row => {
    const priceEur = parseFloat(row.price_eur || '0');
    const area = parseFloat(row.living_area_m2 || '0');
    const avgPm2 = parseFloat(row.neighborhood_avg_pm2 || '0');
    const pm2 = parseFloat(row.price_per_m2_eur || '0');

    const metrics = calculateArbitrageMetrics(priceEur, area, avgPm2, pm2);

    return {
      id: row.id,
      njuskalo_id: row.njuskalo_id,
      title: row.title,
      url: row.url,
      neighborhood: row.neighborhood,
      living_area_m2: area,
      price_eur: priceEur,
      price_per_m2_eur: pm2,
      rooms: row.rooms,
      floor: row.floor,
      seller_name: row.seller_name,
      seller_type: row.seller_type,
      views_count: row.views_count ? parseInt(row.views_count, 10) : 0,
      published_at_raw: row.published_at_raw,
      image_urls: row.image_urls || [],
      neighborhood_avg_pm2: avgPm2,
      discount_percentage: metrics.discountPercentage,
      estimated_monthly_revenue: metrics.estimatedMonthlyRevenue,
      estimated_monthly_profit: metrics.estimatedMonthlyProfit,
    };
  });

  return computed
    .sort((a, b) => b.discount_percentage - a.discount_percentage || b.estimated_monthly_profit - a.estimated_monthly_profit)
    .slice(0, 30);
}
