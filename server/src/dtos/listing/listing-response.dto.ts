import { ListingEntity } from '../../entities/listing.entity';

export class ListingResponseDto {
  public id: number;
  public njuskalo_id: string;
  public url: string;
  public title: string;
  public category_name: string;
  public ad_tier: string;
  public price_eur: number;
  public price_per_m2_eur: number;
  public living_area_m2: number;
  public location_summary?: string;
  public county?: string;
  public city?: string;
  public neighborhood: string;
  public property_type?: string;
  public rooms: string;
  public floor: string;
  public energy_class?: string;
  public views_count: number;
  public seller_name: string;
  public seller_type: string;
  public details_scraped: boolean;
  public first_seen_at: string;
  public last_seen_at: string;
  public published_at?: string;
  public image_urls: string[];

  constructor(data: ListingResponseDto) {
    this.id = data.id;
    this.njuskalo_id = data.njuskalo_id;
    this.url = data.url;
    this.title = data.title;
    this.category_name = data.category_name;
    this.ad_tier = data.ad_tier;
    this.price_eur = data.price_eur;
    this.price_per_m2_eur = data.price_per_m2_eur;
    this.living_area_m2 = data.living_area_m2;
    this.location_summary = data.location_summary;
    this.county = data.county;
    this.city = data.city;
    this.neighborhood = data.neighborhood;
    this.property_type = data.property_type;
    this.rooms = data.rooms;
    this.floor = data.floor;
    this.energy_class = data.energy_class;
    this.views_count = data.views_count;
    this.seller_name = data.seller_name;
    this.seller_type = data.seller_type;
    this.details_scraped = data.details_scraped;
    this.first_seen_at = data.first_seen_at;
    this.last_seen_at = data.last_seen_at;
    this.published_at = data.published_at;
    this.image_urls = data.image_urls;
  }

  public static fromEntity(entity: ListingEntity): ListingResponseDto {
    return new ListingResponseDto({
      id: entity.id,
      njuskalo_id: entity.njuskaloId,
      url: entity.url,
      title: entity.title,
      category_name: entity.categoryName || '',
      ad_tier: entity.adTier || 'regular',
      price_eur: entity.priceEur || 0,
      price_per_m2_eur: entity.pricePerM2Eur || 0,
      living_area_m2: entity.livingAreaM2 || 0,
      location_summary: entity.locationSummary || undefined,
      county: entity.county || undefined,
      city: entity.city || undefined,
      neighborhood: entity.neighborhood || 'Zagreb',
      property_type: entity.propertyType || undefined,
      rooms: entity.rooms || '',
      floor: entity.floor || '',
      energy_class: entity.energyClass || undefined,
      views_count: entity.viewsCount || 0,
      seller_name: entity.sellerName || '',
      seller_type: entity.sellerType || 'korisnik',
      details_scraped: entity.detailsScraped,
      first_seen_at: entity.firstSeenAt.toISOString(),
      last_seen_at: entity.lastSeenAt.toISOString(),
      published_at: entity.publishedAt ? entity.publishedAt.toISOString() : undefined,
      image_urls: entity.imageUrls || [],
    });
  }

  public static fromRecord(row: Record<string, any>): ListingResponseDto {
    return new ListingResponseDto({
      id: Number(row.id),
      njuskalo_id: String(row.njuskalo_id),
      url: String(row.url),
      title: String(row.title),
      category_name: row.category_name || '',
      ad_tier: row.ad_tier || 'regular',
      price_eur: row.price_eur != null ? Number(row.price_eur) : 0,
      price_per_m2_eur: row.price_per_m2_eur != null ? Number(row.price_per_m2_eur) : 0,
      living_area_m2: row.living_area_m2 != null ? Number(row.living_area_m2) : 0,
      location_summary: row.location_summary || undefined,
      county: row.county || undefined,
      city: row.city || undefined,
      neighborhood: row.neighborhood || 'Zagreb',
      property_type: row.property_type || undefined,
      rooms: row.rooms || '',
      floor: row.floor || '',
      energy_class: row.energy_class || undefined,
      views_count: row.views_count != null ? Number(row.views_count) : 0,
      seller_name: row.seller_name || '',
      seller_type: row.seller_type || 'korisnik',
      details_scraped: Boolean(row.details_scraped),
      first_seen_at: row.first_seen_at ? new Date(row.first_seen_at).toISOString() : new Date().toISOString(),
      last_seen_at: row.last_seen_at ? new Date(row.last_seen_at).toISOString() : new Date().toISOString(),
      published_at: row.published_at ? new Date(row.published_at).toISOString() : undefined,
      image_urls: Array.isArray(row.image_urls) ? row.image_urls : [],
    });
  }
}

export class PaginatedListingsResponseDto {
  public total: number;
  public page: number;
  public limit: number;
  public totalPages: number;
  public items: ListingResponseDto[];

  constructor(total: number, page: number, limit: number, items: ListingResponseDto[]) {
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit) || 1;
    this.items = items;
  }
}
