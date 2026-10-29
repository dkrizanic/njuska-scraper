import { pool } from '../config/db';
import { IStatsRepository } from '../interfaces/repositories/stats.repository.interface';

export class StatsRepository implements IStatsRepository {
  public async getAggregateStats(): Promise<Record<string, any>> {
    const [
      totalQuery,
      withPriceQuery,
      rentalsQuery,
      salesQuery,
      detailedQuery,
      sellersQuery,
      viewsQuery,
      avgSaleQuery,
      avgRentQuery,
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM listings'),
      pool.query('SELECT COUNT(*) as count FROM listings WHERE price_eur IS NOT NULL'),
      pool.query("SELECT COUNT(*) as count FROM listings WHERE category_name ILIKE '%najam%' OR url ILIKE '%iznajmljivanje%'"),
      pool.query("SELECT COUNT(*) as count FROM listings WHERE category_name ILIKE '%prodaja%' OR url ILIKE '%prodaja%'"),
      pool.query('SELECT COUNT(*) as count FROM listings WHERE details_scraped = true'),
      pool.query('SELECT COUNT(*) as count FROM sellers'),
      pool.query('SELECT SUM(views_count) as total_views, AVG(views_count) as avg_views FROM listings WHERE views_count IS NOT NULL'),
      pool.query("SELECT AVG(price_eur) as avg_price, AVG(price_per_m2_eur) as avg_pm2 FROM listings WHERE (category_name ILIKE '%prodaja%' OR url ILIKE '%prodaja%') AND price_eur >= 10000"),
      pool.query("SELECT AVG(price_eur) as avg_rent, AVG(price_per_m2_eur) as avg_rent_pm2 FROM listings WHERE (category_name ILIKE '%najam%' OR url ILIKE '%iznajmljivanje%') AND price_eur < 10000"),
    ]);

    return {
      totalListings: parseInt(totalQuery.rows[0].total, 10),
      withPrice: parseInt(withPriceQuery.rows[0].count, 10),
      rentalsCount: parseInt(rentalsQuery.rows[0].count, 10),
      salesCount: parseInt(salesQuery.rows[0].count, 10),
      detailedCount: parseInt(detailedQuery.rows[0].count, 10),
      sellersCount: parseInt(sellersQuery.rows[0].count, 10),
      totalViews: parseInt(viewsQuery.rows[0].total_views || '0', 10),
      avgViews: Math.round(parseFloat(viewsQuery.rows[0].avg_views || '0')),
      avgSalePrice: Math.round(parseFloat(avgSaleQuery.rows[0].avg_price || '0')),
      avgSalePm2: Math.round(parseFloat(avgSaleQuery.rows[0].avg_pm2 || '0')),
      avgRentPrice: Math.round(parseFloat(avgRentQuery.rows[0].avg_rent || '0')),
      avgRentPm2: Math.round(parseFloat(avgRentQuery.rows[0].avg_rent_pm2 || '0')),
    };
  }
}
