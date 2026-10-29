export class ArbitrageResponseDto {
  public id: number;
  public njuskalo_id: string;
  public title: string;
  public url: string;
  public neighborhood: string;
  public living_area_m2: number;
  public price_eur: number;
  public price_per_m2_eur: number;
  public rooms: string;
  public floor: string;
  public seller_name: string;
  public seller_type: string;
  public views_count: number;
  public published_at_raw?: string;
  public image_urls: string[];
  public neighborhood_avg_pm2: number;
  public discount_percentage: number;
  public estimated_monthly_revenue: number;
  public estimated_monthly_profit: number;

  constructor(data: ArbitrageResponseDto) {
    this.id = data.id;
    this.njuskalo_id = data.njuskalo_id;
    this.title = data.title;
    this.url = data.url;
    this.neighborhood = data.neighborhood;
    this.living_area_m2 = data.living_area_m2;
    this.price_eur = data.price_eur;
    this.price_per_m2_eur = data.price_per_m2_eur;
    this.rooms = data.rooms;
    this.floor = data.floor;
    this.seller_name = data.seller_name;
    this.seller_type = data.seller_type;
    this.views_count = data.views_count;
    this.published_at_raw = data.published_at_raw;
    this.image_urls = data.image_urls;
    this.neighborhood_avg_pm2 = data.neighborhood_avg_pm2;
    this.discount_percentage = data.discount_percentage;
    this.estimated_monthly_revenue = data.estimated_monthly_revenue;
    this.estimated_monthly_profit = data.estimated_monthly_profit;
  }

  public static fromCalculated(row: Record<string, any>, metrics: { discountPercentage: number; estimatedMonthlyRevenue: number; estimatedMonthlyProfit: number }): ArbitrageResponseDto {
    return new ArbitrageResponseDto({
      id: Number(row.id),
      njuskalo_id: String(row.njuskalo_id),
      title: String(row.title),
      url: String(row.url),
      neighborhood: row.neighborhood || 'Zagreb',
      living_area_m2: Number(row.living_area_m2 || 0),
      price_eur: Number(row.price_eur || 0),
      price_per_m2_eur: Number(row.price_per_m2_eur || 0),
      rooms: row.rooms || '',
      floor: row.floor || '',
      seller_name: row.seller_name || '',
      seller_type: row.seller_type || 'korisnik',
      views_count: Number(row.views_count || 0),
      published_at_raw: row.published_at_raw,
      image_urls: Array.isArray(row.image_urls) ? row.image_urls : [],
      neighborhood_avg_pm2: Number(row.neighborhood_avg_pm2 || 0),
      discount_percentage: metrics.discountPercentage,
      estimated_monthly_revenue: metrics.estimatedMonthlyRevenue,
      estimated_monthly_profit: metrics.estimatedMonthlyProfit,
    });
  }
}
