import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// 1. KPI Overview & Platform Stats
app.get('/api/stats', async (_req: Request, res: Response) => {
  try {
    const totalQuery = await pool.query('SELECT COUNT(*) as total FROM listings');
    const withPriceQuery = await pool.query('SELECT COUNT(*) as count FROM listings WHERE price_eur IS NOT NULL');
    const rentalsQuery = await pool.query("SELECT COUNT(*) as count FROM listings WHERE category_name ILIKE '%najam%' OR url ILIKE '%iznajmljivanje%'");
    const salesQuery = await pool.query("SELECT COUNT(*) as count FROM listings WHERE category_name ILIKE '%prodaja%' OR url ILIKE '%prodaja%'");
    const detailedQuery = await pool.query('SELECT COUNT(*) as count FROM listings WHERE details_scraped = true');
    const sellersQuery = await pool.query('SELECT COUNT(*) as count FROM sellers');
    const viewsQuery = await pool.query('SELECT SUM(views_count) as total_views, AVG(views_count) as avg_views FROM listings WHERE views_count IS NOT NULL');
    const avgSaleQuery = await pool.query("SELECT AVG(price_eur) as avg_price, AVG(price_per_m2_eur) as avg_pm2 FROM listings WHERE (category_name ILIKE '%prodaja%' OR url ILIKE '%prodaja%') AND price_eur >= 10000");
    const avgRentQuery = await pool.query("SELECT AVG(price_eur) as avg_rent, AVG(price_per_m2_eur) as avg_rent_pm2 FROM listings WHERE (category_name ILIKE '%najam%' OR url ILIKE '%iznajmljivanje%') AND price_eur < 10000");

    res.json({
      totalListings: parseInt(totalQuery.rows[0].total),
      withPrice: parseInt(withPriceQuery.rows[0].count),
      rentalsCount: parseInt(rentalsQuery.rows[0].count),
      salesCount: parseInt(salesQuery.rows[0].count),
      detailedCount: parseInt(detailedQuery.rows[0].count),
      sellersCount: parseInt(sellersQuery.rows[0].count),
      totalViews: parseInt(viewsQuery.rows[0].total_views || 0),
      avgViews: Math.round(parseFloat(viewsQuery.rows[0].avg_views || 0)),
      avgSalePrice: Math.round(parseFloat(avgSaleQuery.rows[0].avg_price || 0)),
      avgSalePm2: Math.round(parseFloat(avgSaleQuery.rows[0].avg_pm2 || 0)),
      avgRentPrice: Math.round(parseFloat(avgRentQuery.rows[0].avg_rent || 0)),
      avgRentPm2: Math.round(parseFloat(avgRentQuery.rows[0].avg_rent_pm2 || 0)),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Filterable Listings Search
app.get('/api/listings', async (req: Request, res: Response) => {
  try {
    const { category, neighborhood, sellerType, minPrice, maxPrice, query, sort = 'newest', limit = 50, offset = 0 } = req.query;

    let conditions: string[] = [];
    let values: any[] = [];
    let valIdx = 1;

    if (category === 'rent') {
      conditions.push(`(category_name ILIKE '%najam%' OR url ILIKE '%iznajmljivanje%')`);
    } else if (category === 'sale') {
      conditions.push(`(category_name ILIKE '%prodaja%' OR url ILIKE '%prodaja%')`);
    }

    if (neighborhood) {
      conditions.push(`neighborhood ILIKE $${valIdx++}`);
      values.push(`%${neighborhood}%`);
    }

    if (sellerType) {
      conditions.push(`seller_type = $${valIdx++}`);
      values.push(sellerType);
    }

    if (minPrice) {
      conditions.push(`price_eur >= $${valIdx++}`);
      values.push(parseFloat(minPrice as string));
    }

    if (maxPrice) {
      conditions.push(`price_eur <= $${valIdx++}`);
      values.push(parseFloat(maxPrice as string));
    }

    if (query) {
      conditions.push(`(title ILIKE $${valIdx} OR description ILIKE $${valIdx} OR neighborhood ILIKE $${valIdx} OR seller_name ILIKE $${valIdx})`);
      values.push(`%${query}%`);
      valIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    let orderBy = 'ORDER BY last_seen_at DESC';
    if (sort === 'views_desc') orderBy = 'ORDER BY views_count DESC NULLS LAST';
    if (sort === 'price_asc') orderBy = 'ORDER BY price_eur ASC NULLS LAST';
    if (sort === 'price_desc') orderBy = 'ORDER BY price_eur DESC NULLS LAST';
    if (sort === 'pm2_asc') orderBy = 'ORDER BY price_per_m2_eur ASC NULLS LAST';
    if (sort === 'pm2_desc') orderBy = 'ORDER BY price_per_m2_eur DESC NULLS LAST';
    if (sort === 'area_asc') orderBy = 'ORDER BY living_area_m2 ASC NULLS LAST';
    if (sort === 'area_desc') orderBy = 'ORDER BY living_area_m2 DESC NULLS LAST';

    const sql = `
      SELECT id, njuskalo_id, url, title, category_name, ad_tier, price_eur, price_per_m2_eur,
             living_area_m2, location_summary, county, city, neighborhood, property_type,
             rooms, floor, energy_class, views_count, seller_name, seller_type,
             details_scraped, first_seen_at, last_seen_at, published_at, image_urls
      FROM listings
      ${whereClause}
      ${orderBy}
      LIMIT $${valIdx++} OFFSET $${valIdx++}
    `;

    values.push(parseInt(limit as string), parseInt(offset as string));
    const result = await pool.query(sql, values);

    // Get total count for pagination
    const countSql = `SELECT COUNT(*) FROM listings ${whereClause}`;
    const totalCount = await pool.query(countSql, values.slice(0, valIdx - 3));

    res.json({
      total: parseInt(totalCount.rows[0].count),
      items: result.rows,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Sublease / Rental Arbitrage Opportunities
// Finds apartments for rent, particularly from private owners (korisnik), with low €/m² compared to neighborhood average
app.get('/api/rental-arbitrage', async (_req: Request, res: Response) => {
  try {
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
             ROUND(nb.avg_rent_pm2::numeric, 2) as neighborhood_avg_pm2,
             ROUND(((nb.avg_rent_pm2 - l.price_per_m2_eur) / nb.avg_rent_pm2 * 100)::numeric, 1) as discount_percentage,
             -- Estimated sublease potential: daily short-term rate (estimated 45€ to 110€ depending on m2 and location) * 20 days occupancy
             ROUND((CASE 
                WHEN l.living_area_m2 <= 40 THEN 55 * 20
                WHEN l.living_area_m2 <= 65 THEN 75 * 20
                WHEN l.living_area_m2 <= 90 THEN 95 * 20
                ELSE 125 * 20
             END) - l.price_eur) as estimated_monthly_profit
      FROM listings l
      JOIN nb_averages nb ON l.neighborhood = nb.neighborhood
      WHERE (l.category_name ILIKE '%najam%' OR l.url ILIKE '%iznajmljivanje%')
        AND l.price_per_m2_eur IS NOT NULL
        AND l.price_per_m2_eur < nb.avg_rent_pm2
      ORDER BY discount_percentage DESC, estimated_monthly_profit DESC
      LIMIT 30;
    `;
    const result = await pool.query(sql);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Neighborhood Averages & Marketing Analytics
app.get('/api/analytics/neighborhoods', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
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
    const result = await pool.query(sql);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Seller & Platform Traffic Breakdown
app.get('/api/analytics/sellers', async (_req: Request, res: Response) => {
  try {
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

    const [typesRes, topRes] = await Promise.all([
      pool.query(byTypeSql),
      pool.query(topSellersSql),
    ]);

    res.json({
      sellerTypes: typesRes.rows,
      topSellers: topRes.rows,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Price History & Changes
app.get('/api/analytics/price-changes', async (_req: Request, res: Response) => {
  try {
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
    const result = await pool.query(sql);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✔ Njuškalo Analytics Express API running on http://localhost:${PORT}`);
});
