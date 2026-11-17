import test from 'node:test';
import assert from 'node:assert/strict';
import mockProducts from '../data/mockProducts.json';
import type { Product } from '../types/unishop';
import {
  collectUnifiedSpecKeys,
  computeValueComparisonMetrics,
  getComparisonWinners,
  getDiscountPercentage,
  getHistoricalPriceStats,
  isTechnicalComparison,
  MAX_COMPARE_ITEMS,
  toggleProductInCompareList,
} from './comparison';

const products = mockProducts as unknown as Product[];

test('all 50 catalog items include valid reviewCount, specs, and 0-100 performanceMetrics', () => {
  assert.equal(products.length, 50);
  for (const p of products) {
    assert.ok(p.reviewCount > 0, `Missing reviewCount on ${p.id}`);
    assert.ok(p.specs && Object.keys(p.specs).length >= 4, `Insufficient specs on ${p.id}`);
    const metrics = p.performanceMetrics;
    assert.ok(metrics, `Missing performanceMetrics on ${p.id}`);
    for (const val of Object.values(metrics)) {
      assert.ok(val >= 0 && val <= 100, `Metric out of 0..100 range on ${p.id}: ${val}`);
    }
  }
});

test('toggleProductInCompareList toggles cleanly and enforces MAX_COMPARE_ITEMS = 4', () => {
  let list: string[] = [];
  for (const id of ['p1', 'p2', 'p3', 'p4']) {
    const res = toggleProductInCompareList(list, id);
    assert.equal(res.limitReached, false);
    list = res.nextIds;
  }
  assert.equal(list.length, MAX_COMPARE_ITEMS);

  const fifth = toggleProductInCompareList(list, 'p5');
  assert.equal(fifth.limitReached, true);
  assert.equal(fifth.nextIds.length, 4);

  const removed = toggleProductInCompareList(list, 'p2');
  assert.equal(removed.limitReached, false);
  assert.deepEqual(removed.nextIds, ['p1', 'p3', 'p4']);
});

test('getComparisonWinners identifies lowest total price, highest rating, reviews, and stock', () => {
  const sonyAmz = products.find((p) => p.id === 'unishop-amz-001')!;
  const sonyEby = products.find((p) => p.id === 'unishop-eby-011')!;
  const winners = getComparisonWinners([sonyAmz, sonyEby]);

  assert.equal(winners.lowestPriceIds.has(sonyEby.id), true);
  assert.equal(winners.lowestTotalPriceIds.has(sonyEby.id), true);
  assert.equal(winners.highestRatingIds.has(sonyAmz.id), true);
  assert.equal(winners.mostReviewsIds.has(sonyAmz.id), true);
  assert.equal(winners.highestStockIds.has(sonyAmz.id), true);
});

test('isTechnicalComparison distinguishes technical categories vs Hogar/Moda', () => {
  const macbook = products.find((p) => p.id === 'unishop-eby-005')!;
  const ipad = products.find((p) => p.id === 'unishop-vin-020')!;
  assert.equal(isTechnicalComparison([macbook, ipad]), true);

  const delonghi = products.find((p) => p.id === 'unishop-amz-007')!;
  const dyson = products.find((p) => p.id === 'unishop-eby-017')!;
  assert.equal(isTechnicalComparison([delonghi, dyson]), false);

  const valueRows = computeValueComparisonMetrics([delonghi, dyson]);
  assert.equal(valueRows.length, 2);
  assert.ok(valueRows[0].calidadPrecioScore > 0);
});

test('collectUnifiedSpecKeys, discount, and historical min diff compute accurately', () => {
  const macbook = products.find((p) => p.id === 'unishop-eby-005')!;
  const ipad = products.find((p) => p.id === 'unishop-vin-020')!;
  const keys = collectUnifiedSpecKeys([macbook, ipad]);

  assert.ok(keys.includes('Procesador'));
  assert.ok(keys.includes('RAM'));
  assert.ok(keys.includes('Almacenamiento'));
  assert.ok(keys.includes('Pantalla'));

  assert.equal(getDiscountPercentage(macbook), 34);
  const hist = getHistoricalPriceStats(macbook);
  assert.equal(hist.min, 789);
  assert.equal(hist.isAtHistoricalMin, true);
});
