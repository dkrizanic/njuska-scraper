import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../app';

describe('API Integration Tests', () => {
  it('GET /health returns status ok', async () => {
    const response = await request(app).get('/health');
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.status, 'ok');
    assert.ok(typeof response.body.uptime === 'number');
  });

  it('GET /api/stats returns valid platform aggregates', async () => {
    const response = await request(app).get('/api/stats');
    assert.strictEqual(response.status, 200);
    assert.ok(typeof response.body.totalListings === 'number');
    assert.ok(response.body.totalListings > 0);
    assert.ok(typeof response.body.rentalsCount === 'number');
    assert.ok(typeof response.body.salesCount === 'number');
    assert.ok(typeof response.body.avgSalePm2 === 'number');
  });

  it('GET /api/listings supports pagination and returns listing items', async () => {
    const response = await request(app).get('/api/listings?limit=10&page=1');
    assert.strictEqual(response.status, 200);
    assert.ok(typeof response.body.total === 'number');
    assert.ok(Array.isArray(response.body.items));
    assert.strictEqual(response.body.page, 1);
    assert.strictEqual(response.body.limit, 10);
    assert.ok(response.body.items.length <= 10);
  });

  it('GET /api/listings filters by category', async () => {
    const response = await request(app).get('/api/listings?category=rent&limit=5');
    assert.strictEqual(response.status, 200);
    assert.ok(Array.isArray(response.body.items));
    for (const item of response.body.items) {
      const isRent =
        item.category_name?.toLowerCase().includes('najam') ||
        item.url?.toLowerCase().includes('iznajmljivanje');
      assert.strictEqual(isRent, true);
    }
  });

  it('GET /api/rental-arbitrage returns opportunities sorted by discount', async () => {
    const response = await request(app).get('/api/rental-arbitrage');
    assert.strictEqual(response.status, 200);
    assert.ok(Array.isArray(response.body));
    if (response.body.length > 0) {
      const first = response.body[0];
      assert.ok('discount_percentage' in first);
      assert.ok('estimated_monthly_profit' in first);
      assert.ok('neighborhood_avg_pm2' in first);
    }
  });

  it('GET /api/analytics/neighborhoods returns neighborhood metrics', async () => {
    const response = await request(app).get('/api/analytics/neighborhoods');
    assert.strictEqual(response.status, 200);
    assert.ok(Array.isArray(response.body));
    if (response.body.length > 0) {
      const first = response.body[0];
      assert.ok('neighborhood' in first);
      assert.ok('total_ads' in first);
      assert.ok('avg_pm2' in first);
    }
  });
});
