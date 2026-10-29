import { pool } from '../config/db';
import { ListingEntity } from '../entities/listing.entity';
import { ListingQueryDto } from '../dtos/listing/listing-query.dto';
import { CreateListingDto } from '../dtos/listing/create-listing.dto';
import { IListingRepository } from '../interfaces/repositories/listing.repository.interface';

export class ListingRepository implements IListingRepository {
  private buildWhereClause(filters: ListingQueryDto): { conditions: string[]; values: any[] } {
    const conditions: string[] = [];
    const values: any[] = [];
    let valIdx = 1;

    if (filters.category === 'rent') {
      conditions.push("(category_name ILIKE '%najam%' OR url ILIKE '%iznajmljivanje%')");
    } else if (filters.category === 'sale') {
      conditions.push("(category_name ILIKE '%prodaja%' OR url ILIKE '%prodaja%')");
    }

    if (filters.neighborhood) {
      conditions.push(`neighborhood ILIKE $${valIdx++}`);
      values.push(`%${filters.neighborhood}%`);
    }

    if (filters.sellerType) {
      conditions.push(`seller_type = $${valIdx++}`);
      values.push(filters.sellerType);
    }

    if (filters.minPrice !== undefined && !isNaN(filters.minPrice)) {
      conditions.push(`price_eur >= $${valIdx++}`);
      values.push(filters.minPrice);
    }

    if (filters.maxPrice !== undefined && !isNaN(filters.maxPrice)) {
      conditions.push(`price_eur <= $${valIdx++}`);
      values.push(filters.maxPrice);
    }

    if (filters.query) {
      conditions.push(`(title ILIKE $${valIdx} OR description ILIKE $${valIdx} OR neighborhood ILIKE $${valIdx} OR seller_name ILIKE $${valIdx})`);
      values.push(`%${filters.query}%`);
      valIdx++;
    }

    return { conditions, values };
  }

  private resolveOrderBy(sort?: string): string {
    switch (sort) {
      case 'views_desc':
        return 'ORDER BY views_count DESC NULLS LAST';
      case 'price_asc':
        return 'ORDER BY price_eur ASC NULLS LAST';
      case 'price_desc':
        return 'ORDER BY price_eur DESC NULLS LAST';
      case 'pm2_asc':
        return 'ORDER BY price_per_m2_eur ASC NULLS LAST';
      case 'pm2_desc':
        return 'ORDER BY price_per_m2_eur DESC NULLS LAST';
      case 'area_asc':
        return 'ORDER BY living_area_m2 ASC NULLS LAST';
      case 'area_desc':
        return 'ORDER BY living_area_m2 DESC NULLS LAST';
      default:
        return 'ORDER BY last_seen_at DESC';
    }
  }

  public async findMany(filters: ListingQueryDto): Promise<{ total: number; entities: ListingEntity[] }> {
    const { conditions, values } = this.buildWhereClause(filters);
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderBy = this.resolveOrderBy(filters.sort);

    const countSql = `SELECT COUNT(*) FROM listings ${whereClause}`;
    const countRes = await pool.query(countSql, values);
    const total = parseInt(countRes.rows[0].count, 10);

    const limitIdx = values.length + 1;
    const offsetIdx = values.length + 2;
    const queryValues = [...values, filters.limit, filters.offset];

    const sql = `
      SELECT id, njuskalo_id, url, title, category_name, ad_tier, price_eur, price_per_m2_eur,
             living_area_m2, land_area_m2, location_summary, county, city, neighborhood, property_type,
             rooms, floor, total_floors, year_built, year_renovated, energy_class, heating_type, parking,
             description, attributes, views_count, seller_id, seller_name, seller_type, seller_url,
             details_scraped, first_seen_at, last_seen_at, published_at, image_urls
      FROM listings
      ${whereClause}
      ${orderBy}
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const itemsRes = await pool.query(sql, queryValues);
    const entities = itemsRes.rows.map(row => new ListingEntity(row));

    return { total, entities };
  }

  public async findById(id: number): Promise<ListingEntity | null> {
    const sql = `
      SELECT id, njuskalo_id, url, title, category_name, ad_tier, price_eur, price_per_m2_eur,
             living_area_m2, land_area_m2, location_summary, county, city, neighborhood, property_type,
             rooms, floor, total_floors, year_built, year_renovated, energy_class, heating_type, parking,
             description, attributes, views_count, seller_id, seller_name, seller_type, seller_url,
             details_scraped, first_seen_at, last_seen_at, published_at, image_urls
      FROM listings
      WHERE id = $1
      LIMIT 1
    `;
    const res = await pool.query(sql, [id]);
    if (res.rows.length === 0) return null;
    return new ListingEntity(res.rows[0]);
  }

  public async create(dto: CreateListingDto): Promise<ListingEntity> {
    const sql = `
      INSERT INTO listings (
        njuskalo_id, url, title, category_name, ad_tier, price_eur, price_per_m2_eur,
        living_area_m2, land_area_m2, neighborhood, city, county, seller_name, seller_type,
        views_count, image_urls, first_seen_at, last_seen_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
      RETURNING *
    `;
    const values = [
      dto.njuskaloId,
      dto.url,
      dto.title,
      dto.categoryName || null,
      dto.adTier || 'Regular',
      dto.priceEur || null,
      dto.pricePerM2Eur || null,
      dto.livingAreaM2 || null,
      dto.landAreaM2 || null,
      dto.neighborhood || null,
      dto.city || null,
      dto.county || null,
      dto.sellerName || null,
      dto.sellerType || null,
      dto.viewsCount || 0,
      JSON.stringify(dto.imageUrls || []),
    ];

    const res = await pool.query(sql, values);
    return new ListingEntity(res.rows[0]);
  }
}
