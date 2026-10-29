export class CreateListingDto {
  public njuskaloId: string;
  public url: string;
  public title: string;
  public categoryName?: string;
  public adTier?: string;
  public priceEur?: number;
  public pricePerM2Eur?: number;
  public livingAreaM2?: number;
  public landAreaM2?: number;
  public neighborhood?: string;
  public city?: string;
  public county?: string;
  public sellerName?: string;
  public sellerType?: string;
  public viewsCount?: number;
  public imageUrls?: string[];

  constructor(data: CreateListingDto) {
    this.njuskaloId = data.njuskaloId;
    this.url = data.url;
    this.title = data.title;
    this.categoryName = data.categoryName;
    this.adTier = data.adTier;
    this.priceEur = data.priceEur;
    this.pricePerM2Eur = data.pricePerM2Eur;
    this.livingAreaM2 = data.livingAreaM2;
    this.landAreaM2 = data.landAreaM2;
    this.neighborhood = data.neighborhood;
    this.city = data.city;
    this.county = data.county;
    this.sellerName = data.sellerName;
    this.sellerType = data.sellerType;
    this.viewsCount = data.viewsCount;
    this.imageUrls = data.imageUrls || [];
  }

  public static fromBody(body: Record<string, any>): CreateListingDto {
    if (!body.njuskaloId || !body.url || !body.title) {
      throw new Error('njuskaloId, url, and title are required to create a listing');
    }

    return new CreateListingDto({
      njuskaloId: String(body.njuskaloId),
      url: String(body.url),
      title: String(body.title),
      categoryName: body.categoryName,
      adTier: body.adTier,
      priceEur: body.priceEur != null ? Number(body.priceEur) : undefined,
      pricePerM2Eur: body.pricePerM2Eur != null ? Number(body.pricePerM2Eur) : undefined,
      livingAreaM2: body.livingAreaM2 != null ? Number(body.livingAreaM2) : undefined,
      landAreaM2: body.landAreaM2 != null ? Number(body.landAreaM2) : undefined,
      neighborhood: body.neighborhood,
      city: body.city,
      county: body.county,
      sellerName: body.sellerName,
      sellerType: body.sellerType,
      viewsCount: body.viewsCount != null ? Number(body.viewsCount) : undefined,
      imageUrls: Array.isArray(body.imageUrls) ? body.imageUrls : [],
    });
  }
}
