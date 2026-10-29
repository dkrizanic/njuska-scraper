export class ListingQueryDto {
  public category?: 'rent' | 'sale';
  public neighborhood?: string;
  public sellerType?: string;
  public minPrice?: number;
  public maxPrice?: number;
  public query?: string;
  public sort: string;
  public limit: number;
  public offset: number;
  public page: number;

  constructor(data: Partial<ListingQueryDto> = {}) {
    this.category = data.category;
    this.neighborhood = data.neighborhood?.trim();
    this.sellerType = data.sellerType?.trim();
    this.minPrice = data.minPrice != null && !isNaN(data.minPrice) ? data.minPrice : undefined;
    this.maxPrice = data.maxPrice != null && !isNaN(data.maxPrice) ? data.maxPrice : undefined;
    this.query = data.query?.trim();
    this.sort = data.sort || 'newest';
    this.limit = Math.min(100, Math.max(1, data.limit || 50));
    this.page = Math.max(1, data.page || 1);
    this.offset = data.offset != null && data.offset >= 0 ? data.offset : (this.page - 1) * this.limit;
  }

  public static fromRequest(query: Record<string, any>): ListingQueryDto {
    const rawCategory = typeof query.category === 'string' ? query.category.toLowerCase() : undefined;
    const category = rawCategory === 'rent' || rawCategory === 'sale' ? rawCategory : undefined;

    const limit = query.limit ? parseInt(query.limit, 10) : 50;
    const page = query.page ? parseInt(query.page, 10) : 1;
    const offset = query.offset ? parseInt(query.offset, 10) : (page - 1) * limit;

    return new ListingQueryDto({
      category,
      neighborhood: typeof query.neighborhood === 'string' ? query.neighborhood : undefined,
      sellerType: typeof query.sellerType === 'string' ? query.sellerType : undefined,
      minPrice: query.minPrice ? parseFloat(query.minPrice) : undefined,
      maxPrice: query.maxPrice ? parseFloat(query.maxPrice) : undefined,
      query: typeof query.query === 'string' ? query.query : undefined,
      sort: typeof query.sort === 'string' ? query.sort : 'newest',
      limit,
      page,
      offset,
    });
  }
}
