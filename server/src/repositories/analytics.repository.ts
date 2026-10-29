import { pool } from '../config/db';
import { IAnalyticsRepository } from '../interfaces/repositories/analytics.repository.interface';

export class AnalyticsRepository implements IAnalyticsRepository {
  public async getNeighborhoodStats(category?: string): Promise<Record<string, any>[]> {
    let catFilter = '';
    if (category === 'rent') {
      catFilter = "AND (category_name ILIKE '%najam%' OR url ILIKE '%iznajmljivanje%')";
    } else if (category === 'sale') {
      catFilter = "AND (category_name ILIKE '%prodaja%' OR url ILIKE '%prodaja%')";
    }

    const sql = `
      SELECT neighborhood,
             COUNT(*) as total_ads,
             ROUND(AVG(price_eur)::numeric, 0) as avg_price,
             ROUND(AVG(price_per_m2_eur)::numeric, 2) as avg_pm2,
             ROUND(AVG(views_count)::numeric, 0) as avg_views,
             SUM(views_count) as total_views
      FROM listings
      WHERE neighborhood IS NOT NULL AND price_per_m2_eur IS NOT NULL ${catFilter}
      GROUP BY neighborhood
      ORDER BY total_ads DESC
      LIMIT 25;
    `;
    const res = await pool.query(sql);
    return res.rows;
  }

  public async getSellerStats(): Promise<{ typeRows: Record<string, any>[]; sellerRows: Record<string, any>[] }> {
    const byTypeSql = `
      SELECT seller_type,
             COUNT(DISTINCT seller_name) as unique_accounts,
             COUNT(*) as active_listings,
             COALESCE(SUM(views_count), 0) as total_views,
             ROUND(AVG(views_count)::numeric, 0) as avg_views,
             ROUND(AVG(price_per_m2_eur)::numeric, 2) as avg_pm2
      FROM listings
      WHERE seller_type IS NOT NULL
      GROUP BY seller_type
      ORDER BY total_views DESC;
    `;

    const topSellersSql = `
      SELECT seller_name, seller_type,
             COUNT(*) as listings_count,
             COALESCE(SUM(views_count), 0) as total_views,
             ROUND(AVG(price_per_m2_eur)::numeric, 2) as avg_pm2
      FROM listings
      WHERE seller_name IS NOT NULL
      GROUP BY seller_name, seller_type
      ORDER BY total_views DESC
      LIMIT 15;
    `;

    const [typeRes, topRes] = await Promise.all([
      pool.query(byTypeSql),
      pool.query(topSellersSql),
    ]);

    return { typeRows: typeRes.rows, sellerRows: topRes.rows };
  }

  public async getPriceChanges(): Promise<Record<string, any>[]> {
    const sql = `
      SELECT l.id, l.njuskalo_id, l.title, l.url, l.neighborhood, l.category_name,
             ph_first.price_eur as initial_price,
             l.price_eur as current_price,
             ROUND((l.price_eur - ph_first.price_eur)::numeric, 2) as diff_eur,
             ROUND(((l.price_eur - ph_first.price_eur) / ph_first.price_eur * 100)::numeric, 1) as diff_pct,
             ph_first.recorded_at as first_recorded,
             l.last_seen_at as last_recorded
      FROM listings l
      JOIN LATERAL (
        SELECT price_eur, recorded_at 
        FROM price_history 
        WHERE listing_id = l.id 
        ORDER BY recorded_at ASC 
        LIMIT 1
      ) ph_first ON true
      WHERE (SELECT COUNT(*) FROM price_history WHERE listing_id = l.id) > 1
      ORDER BY diff_pct ASC
      LIMIT 30;
    `;
    const res = await pool.query(sql);
    return res.rows;
  }

  public async getRawArbitrageListings(): Promise<Record<string, any>[]> {
    const sql = `
      WITH nb_averages AS (
        SELECT neighborhood, AVG(price_per_m2_eur) as avg_rent_pm2, COUNT(*) as nb_count
        FROM listings
        WHERE (category_name ILIKE '%najam%' OR url ILIKE '%iznajmljivanje%')
          AND price_per_m2_eur IS NOT NULL
          AND neighborhood IS NOT NULL
        GROUP BY neighborhood
        HAVING COUNT(*) >= 2
      )
      SELECT l.id, l.njuskalo_id, l.title, l.url, l.neighborhood, l.living_area_m2, l.price_eur,
             l.price_per_m2_eur, l.rooms, l.floor, l.seller_name, l.seller_type, l.views_count,
             l.published_at_raw, l.image_urls,
             ROUND(nb.avg_rent_pm2::numeric, 2) as neighborhood_avg_pm2
      FROM listings l
      JOIN nb_averages nb ON l.neighborhood = nb.neighborhood
      WHERE (l.category_name ILIKE '%najam%' OR l.url ILIKE '%iznajmljivanje%')
        AND l.price_per_m2_eur IS NOT NULL
        AND l.price_per_m2_eur < nb.avg_rent_pm2
      ORDER BY (nb.avg_rent_pm2 - l.price_per_m2_eur) DESC
      LIMIT 50;
    `;
    const res = await pool.query(sql);
    return res.rows;
  }
}
