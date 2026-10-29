export class NeighborhoodStatsDto {
  public neighborhood: string;
  public total_ads: number;
  public avg_price: number;
  public avg_pm2: number;
  public avg_views: number;
  public total_views: number;

  constructor(data: NeighborhoodStatsDto) {
    this.neighborhood = data.neighborhood;
    this.total_ads = data.total_ads;
    this.avg_price = data.avg_price;
    this.avg_pm2 = data.avg_pm2;
    this.avg_views = data.avg_views;
    this.total_views = data.total_views;
  }

  public static fromRow(row: Record<string, any>): NeighborhoodStatsDto {
    return new NeighborhoodStatsDto({
      neighborhood: String(row.neighborhood),
      total_ads: parseInt(row.total_ads, 10),
      avg_price: parseFloat(row.avg_price || '0'),
      avg_pm2: parseFloat(row.avg_pm2 || '0'),
      avg_views: parseInt(row.avg_views || '0', 10),
      total_views: parseInt(row.total_views || '0', 10),
    });
  }
}
