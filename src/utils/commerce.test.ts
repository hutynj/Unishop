import test from 'node:test';
import assert from 'node:assert/strict';
import mockProducts from '../data/mockProducts.json';
import type { CartItem, LinkedAccount, PriceAlert, Product, SearchFilters } from '../types/unishop';
import {
  addMultipleProductsToCart,
  ALL_STORES,
  appendPriceHistoryPoint,
  buildCheckoutPlan,
  buildPaymentSummary,
  buildReceiptText,
  calculateCartTotals,
  createOrderRecord,
  detectPriceDrops,
  filterAndSortProducts,
  groupCartByStore,
  isStoreConnected,
  paginateProducts,
  simulatePriceUpdateForAlerts,
  validatePaymentDetails,
} from './commerce';

const products = mockProducts as unknown as Product[];

const defaultAccounts: LinkedAccount[] = ALL_STORES.map((store) => ({
  store,
  storeLabel: store,
  connected: store !== 'aliexpress',
  authMethod: store === 'vinted' || store === 'wallapop' ? 'extension_token' : 'oauth2',
  accountHandle: store !== 'aliexpress' ? `user_${store}` : null,
  lastSyncedAt: '2026-11-16T08:00:00Z',
  syncNote: 'OK',
}));

const baseFilters: SearchFilters = {
  query: '',
  category: 'all',
  stores: [...ALL_STORES],
  condition: 'all',
  minPrice: '',
  maxPrice: '',
  brandModel: '',
  sortBy: 'relevance',
  onlyConnectedStores: false,
};

test('mockProducts.json contains 50 enriched items (10 per platform) with priceHistory', () => {
  assert.equal(products.length, 50);
  const storeSet = new Set(products.map((p) => p.store));
  assert.equal(storeSet.size, 5);
  for (const store of ALL_STORES) {
    assert.equal(
      products.filter((p) => p.store === store).length,
      10,
      `Expected 10 products for ${store}`
    );
  }

  for (const p of products) {
    assert.ok(p.description.length > 10, `Missing description on ${p.id}`);
    assert.ok(p.originalPrice >= p.price, `Invalid originalPrice on ${p.id}`);
    assert.ok(p.stock >= 1, `Invalid stock on ${p.id}`);
    assert.ok(p.rating >= 4.0 && p.rating <= 5.0, `Invalid rating on ${p.id}`);
    assert.ok(Array.isArray(p.priceHistory) && p.priceHistory.length >= 6, `Insufficient priceHistory on ${p.id}`);
  }
});

test('filterAndSortProducts filters by category, condition, price range, store, and exact model', () => {
  const audioOnly = filterAndSortProducts(
    products,
    { ...baseFilters, category: 'Audio' },
    defaultAccounts
  );
  assert.equal(audioOnly.length, 8);
  assert.ok(audioOnly.every((p) => p.category === 'Audio'));

  const asc = filterAndSortProducts(
    products,
    { ...baseFilters, sortBy: 'price_asc' },
    defaultAccounts
  );
  assert.ok(asc[0].price <= asc[1].price);
  assert.ok(asc[asc.length - 2].price <= asc[asc.length - 1].price);

  const desc = filterAndSortProducts(
    products,
    { ...baseFilters, sortBy: 'price_desc' },
    defaultAccounts
  );
  assert.ok(desc[0].price >= desc[1].price);
  assert.equal(desc[0].model, 'iPhone 15 Pro');

  const connectedOnly = filterAndSortProducts(
    products,
    { ...baseFilters, onlyConnectedStores: true },
    defaultAccounts
  );
  assert.equal(connectedOnly.length, 40);
  assert.ok(connectedOnly.every((p) => p.store !== 'aliexpress'));
});

test('groupCartByStore and calculateCartTotals compute per-store and global totals accurately', () => {
  const sony = products.find((p) => p.id === 'unishop-amz-001')!;
  const carhartt = products.find((p) => p.id === 'unishop-vin-002')!;
  const nike = products.find((p) => p.id === 'unishop-vin-006')!;

  const cart: CartItem[] = [
    { id: 'c1', product: sony, quantity: 1, addedAt: '2026-11-16T08:00:00Z' },
    { id: 'c2', product: carhartt, quantity: 2, addedAt: '2026-11-16T08:01:00Z' },
    { id: 'c3', product: nike, quantity: 1, addedAt: '2026-11-16T08:02:00Z' },
  ];

  const groups = groupCartByStore(cart);
  assert.equal(groups.length, 2);

  const totals = calculateCartTotals(cart);
  assert.equal(totals.itemsSubtotal, 557);
  assert.equal(totals.shippingTotal, 4.99);
  assert.equal(totals.grandTotal, 561.99);
  assert.equal(totals.totalQuantity, 4);
  assert.equal(totals.storeCount, 2);
});

test('createOrderRecord and buildReceiptText generate persisted order and receipt', () => {
  const sony = products.find((p) => p.id === 'unishop-amz-001')!;
  const switchOled = products.find((p) => p.id === 'unishop-wal-003')!;

  const plan = buildCheckoutPlan([
    { id: 'c1', product: sony, quantity: 1, addedAt: '2026-11-16T08:00:00Z' },
    { id: 'c2', product: switchOled, quantity: 1, addedAt: '2026-11-16T08:01:00Z' },
  ]);

  const order = createOrderRecord(plan, plan.steps, '2026-11-16T13:15:00Z', {
    method: 'card',
    summary: 'Visa terminada en 4242',
  });
  assert.ok(order.id.startsWith('ORD-'));
  assert.equal(order.checkoutMode, 'guided');
  assert.equal(order.totalPaid, 520.5);
  assert.equal(order.paymentSummary, 'Visa terminada en 4242');

  const receipt = buildReceiptText(order);
  assert.ok(receipt.includes(order.id));
  assert.ok(receipt.includes('Visa terminada en 4242'));
});

test('detectPriceDrops and simulatePriceUpdateForAlerts append real-time points to priceHistory', () => {
  const sonyAmazon = products.find((p) => p.id === 'unishop-amz-001')!;
  const alerts: PriceAlert[] = [
    {
      productId: sonyAmazon.id,
      productTitle: sonyAmazon.title,
      brand: sonyAmazon.brand,
      model: sonyAmazon.model,
      targetStore: 'amazon',
      trackedPrice: sonyAmazon.price,
      enabled: true,
      updatedAt: '2026-11-16T13:00:00Z',
    },
    {
      productId: 'unishop-ali-004',
      productTitle: 'Keychron K2 Pro',
      brand: 'Keychron',
      model: 'K2 Pro',
      targetStore: 'aliexpress',
      trackedPrice: 78.5,
      enabled: true,
      updatedAt: '2026-11-16T13:00:00Z',
    },
  ];

  const drops = detectPriceDrops(alerts, products, defaultAccounts);
  assert.equal(drops.length, 1);
  assert.equal(drops[0].matchedProduct.store, 'vinted');
  assert.equal(isStoreConnected('aliexpress', defaultAccounts), false);

  const updated = simulatePriceUpdateForAlerts(products, alerts, defaultAccounts, '2026-11-17');
  const ebaySony = updated.find((p) => p.id === 'unishop-eby-011')!;
  assert.ok(ebaySony.price < 249);
  assert.equal(ebaySony.priceHistory.length, 8);
  assert.equal(ebaySony.priceHistory[7].date, '2026-11-17');
  assert.equal(ebaySony.priceHistory[7].price, ebaySony.price);

  const bumped = appendPriceHistoryPoint(sonyAmazon, 260, '2026-11-18');
  assert.equal(bumped.previousPrice, 299);
  assert.equal(bumped.price, 260);
  assert.equal(bumped.priceHistory.length, 8);
});

test('validatePaymentDetails validates card, paypal, and SEPA transfer fields strictly', () => {
  const badCard = validatePaymentDetails({
    method: 'card',
    cardHolder: 'A',
    cardNumber: '4242',
    expiry: '13/20',
    cvv: '1',
  });
  assert.equal(badCard.valid, false);
  assert.ok(badCard.errors.cardHolder);
  assert.ok(badCard.errors.cardNumber);
  assert.ok(badCard.errors.expiry);
  assert.ok(badCard.errors.cvv);

  const validCard = validatePaymentDetails({
    method: 'card',
    cardHolder: 'Carlos Martínez',
    cardNumber: '4242 4242 4242 4242',
    expiry: '08/29',
    cvv: '842',
  });
  assert.equal(validCard.valid, true);
  assert.equal(
    buildPaymentSummary({ method: 'card', cardNumber: '4242 4242 4242 4242' }),
    'Visa terminada en 4242'
  );

  const validPaypal = validatePaymentDetails({
    method: 'paypal',
    paypalEmail: 'carlos@unishop.es',
  });
  assert.equal(validPaypal.valid, true);

  const badTransfer = validatePaymentDetails({
    method: 'transfer',
    cardHolder: 'Carlos',
    iban: 'INVALID',
  });
  assert.equal(badTransfer.valid, false);
  assert.ok(badTransfer.errors.iban);
});

test('paginateProducts and addMultipleProductsToCart handle multi-page catalog and bulk-add cleanly', () => {
  const page2 = paginateProducts(products, 2, 12);
  assert.equal(page2.currentPage, 2);
  assert.equal(page2.totalPages, 5);
  assert.equal(page2.items.length, 12);
  assert.equal(page2.startIndex, 13);
  assert.equal(page2.endIndex, 24);

  const allPages = paginateProducts(products, 3, 'all');
  assert.equal(allPages.totalPages, 1);
  assert.equal(allPages.items.length, 50);

  const bulk = addMultipleProductsToCart([], products, defaultAccounts, '2026-11-16T13:45:00Z');
  assert.equal(bulk.addedUnits, 40);
  assert.equal(bulk.newlyAddedProducts, 40);
  assert.equal(bulk.skippedDisconnectedCount, 10);
  assert.deepEqual(bulk.skippedStores, ['aliexpress']);
  assert.equal(bulk.nextCart.length, 40);
});
