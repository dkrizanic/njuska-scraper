import { pool } from '../config/db';

export interface ListingFilterOptions {
  category?: string;
  neighborhood?: string;
  sellerType?: string;
  minPrice?: number;
  maxPrice?: number;
  query?: string;
  sort?: string;
  limit?: number;
  offset?: number;
}

export interface ListingRecord {
  id: number;
  njuskalo_id: string;
  url: string;
  title: string;
  category_name: string;
  ad_tier: string;
  price_eur: number;
  price_per_m2_eur: number;
  living_area_m2: number;
  location_summary?: string;
  county?: string;
  city?: string;
  neighborhood: string;
  property_type?: string;
  rooms: string;
  floor: string;
  energy_class?: string;
  views_count: number;
  seller_name: string;
  seller_type: string;
  details_scraped: boolean;
  first_seen_at: string;
  last_seen_at: string;
  published_at?: string;
  image_urls: string[];
}

function buildWhereClause(filters: ListingFilterOptions): { conditions: string[]; values: any[] } {
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

function resolveOrderBy(sort?: string): string {
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

export async function findListings(filters: ListingFilterOptions): Promise<{ total: number; items: ListingRecord[] }> {
  const { conditions, values } = buildWhereClause(filters);
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const orderBy = resolveOrderBy(filters.sort);

  const limit = filters.limit && filters.limit > 0 ? filters.limit : 50;
  const offset = filters.offset && filters.offset >= 0 ? filters.offset : 0;

  const countSql = `SELECT COUNT(*) FROM listings ${whereClause}`;
  const countRes = await pool.query(countSql, values);
  const total = parseInt(countRes.rows[0].count, 10);

  const queryValues = [...values, limit, offset];
  const limitIdx = values.length + 1;
  const offsetIdx = values.length + 2;

  const sql = `
    SELECT id, njuskalo_id, url, title, category_name, ad_tier, price_eur, price_per_m2_eur,
           living_area_m2, location_summary, county, city, neighborhood, property_type,
           rooms, floor, energy_class, views_count, seller_name, seller_type,
           details_scraped, first_seen_at, last_seen_at, published_at, image_urls
    FROM listings
    ${whereClause}
    ${orderBy}
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;

  const itemsRes = await pool.query(sql, queryValues);
  return { total, items: itemsRes.rows };
}
