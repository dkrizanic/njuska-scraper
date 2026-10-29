export class StatsResponseDto {
  public totalListings: number;
  public withPrice: number;
  public rentalsCount: number;
  public salesCount: number;
  public detailedCount: number;
  public sellersCount: number;
  public totalViews: number;
  public avgViews: number;
  public avgSalePrice: number;
  public avgSalePm2: number;
  public avgRentPrice: number;
  public avgRentPm2: number;

  constructor(data: StatsResponseDto) {
    this.totalListings = data.totalListings;
    this.withPrice = data.withPrice;
    this.rentalsCount = data.rentalsCount;
    this.salesCount = data.salesCount;
    this.detailedCount = data.detailedCount;
    this.sellersCount = data.sellersCount;
    this.totalViews = data.totalViews;
    this.avgViews = data.avgViews;
    this.avgSalePrice = data.avgSalePrice;
    this.avgSalePm2 = data.avgSalePm2;
    this.avgRentPrice = data.avgRentPrice;
    this.avgRentPm2 = data.avgRentPm2;
  }

  public static fromRaw(raw: Record<string, any>): StatsResponseDto {
    return new StatsResponseDto({
      totalListings: Number(raw.totalListings || 0),
      withPrice: Number(raw.withPrice || 0),
      rentalsCount: Number(raw.rentalsCount || 0),
      salesCount: Number(raw.salesCount || 0),
      detailedCount: Number(raw.detailedCount || 0),
      sellersCount: Number(raw.sellersCount || 0),
      totalViews: Number(raw.totalViews || 0),
      avgViews: Math.round(Number(raw.avgViews || 0)),
      avgSalePrice: Math.round(Number(raw.avgSalePrice || 0)),
      avgSalePm2: Math.round(Number(raw.avgSalePm2 || 0)),
      avgRentPrice: Math.round(Number(raw.avgRentPrice || 0)),
      avgRentPm2: Math.round(Number(raw.avgRentPm2 || 0)),
    });
  }
}
