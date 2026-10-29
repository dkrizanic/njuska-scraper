import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  estimateMonthlyRevenue,
  calculateArbitrageMetrics,
} from '../services/arbitrage.service';

describe('Arbitrage Service Unit Tests', () => {
  describe('estimateMonthlyRevenue', () => {
    it('applies low tier for properties up to 40m2', () => {
      assert.strictEqual(estimateMonthlyRevenue(30), 1100);
      assert.strictEqual(estimateMonthlyRevenue(40), 1100);
    });

    it('applies medium tier for properties between 41m2 and 65m2', () => {
      assert.strictEqual(estimateMonthlyRevenue(45), 1500);
      assert.strictEqual(estimateMonthlyRevenue(65), 1500);
    });

    it('applies large tier for properties between 66m2 and 90m2', () => {
      assert.strictEqual(estimateMonthlyRevenue(70), 1900);
      assert.strictEqual(estimateMonthlyRevenue(90), 1900);
    });

    it('applies executive tier for properties above 90m2', () => {
      assert.strictEqual(estimateMonthlyRevenue(95), 2500);
      assert.strictEqual(estimateMonthlyRevenue(150), 2500);
    });

    it('handles zero or negative area gracefully', () => {
      assert.strictEqual(estimateMonthlyRevenue(0), 1100);
      assert.strictEqual(estimateMonthlyRevenue(-10), 1100);
    });
  });

  describe('calculateArbitrageMetrics', () => {
    it('calculates discount percentage and monthly profit correctly', () => {
      const priceEur = 600;
      const livingAreaM2 = 50;
      const neighborhoodAvgPm2 = 18.0;
      const pricePerM2Eur = 12.0;

      const metrics = calculateArbitrageMetrics(priceEur, livingAreaM2, neighborhoodAvgPm2, pricePerM2Eur);

      assert.strictEqual(metrics.estimatedMonthlyRevenue, 1500);
      assert.strictEqual(metrics.estimatedMonthlyProfit, 900);
      assert.strictEqual(metrics.discountPercentage, 33.3);
    });

    it('handles zero neighborhood average without dividing by zero', () => {
      const metrics = calculateArbitrageMetrics(500, 50, 0, 10);
      assert.strictEqual(metrics.discountPercentage, 0);
      assert.strictEqual(metrics.estimatedMonthlyProfit, 1000);
    });

    it('handles negative profit when price exceeds estimated revenue', () => {
      const metrics = calculateArbitrageMetrics(2000, 50, 20, 20);
      assert.strictEqual(metrics.estimatedMonthlyProfit, -500);
    });
  });
});
