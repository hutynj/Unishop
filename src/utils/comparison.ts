import type { PerformanceMetrics, Product } from '../types/unishop';

export const MAX_COMPARE_ITEMS = 4;

export const COMPARISON_COLORS = [
  '#2563EB', // Cobalt Blue
  '#EA580C', // Warm Amber/Orange
  '#059669', // Emerald
  '#9333EA', // Violet
] as const;

export const TECHNICAL_CATEGORIES = new Set([
  'Audio',
  'Gaming',
  'Electrónica',
  'Accesorios',
  'Informática',
]);

export const PERFORMANCE_METRIC_META: {
  key: keyof PerformanceMetrics;
  label: string;
  shortLabel: string;
}[] = [
  { key: 'potencia', label: 'Potencia / Rendimiento', shortLabel: 'Potencia' },
  { key: 'autonomia', label: 'Autonomía / Eficiencia', shortLabel: 'Autonomía' },
  { key: 'portabilidad', label: 'Portabilidad / Ergonomía', shortLabel: 'Portabilidad' },
  { key: 'calidadPrecio', label: 'Relación Calidad-Precio', shortLabel: 'Calidad/Precio' },
  { key: 'construccion', label: 'Materiales y Acabado', shortLabel: 'Acabado' },
];

export interface HistoricalPriceSummary {
  min: number;
  max: number;
  diffFromMin: number;
  diffFromMinPct: number;
  isAtHistoricalMin: boolean;
}

export interface ComparisonWinners {
  lowestPriceIds: Set<string>;
  lowestTotalPriceIds: Set<string>;
  highestDiscountIds: Set<string>;
  highestRatingIds: Set<string>;
  mostReviewsIds: Set<string>;
  highestStockIds: Set<string>;
}

export interface ValueComparisonRow {
  productId: string;
  calidadPrecioScore: number;
  ratingScore: number;
  popularityScore: number;
  savingsScore: number;
  discountPct: number;
}

export function isTechnicalComparison(products: Product[]): boolean {
  if (products.length === 0) return false;
  const techCount = products.filter((p) => TECHNICAL_CATEGORIES.has(p.category)).length;
  return techCount >= Math.ceil(products.length / 2);
}

export function getDiscountPercentage(product: Product): number {
  if (product.originalPrice <= product.price || product.originalPrice <= 0) {
    return 0;
  }
  return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
}

export function getHistoricalPriceStats(product: Product): HistoricalPriceSummary {
  const prices = (product.priceHistory ?? []).map((pt) => pt.price);
  const allPrices = [...prices, product.price];
  const min = Math.min(...allPrices);
  const max = Math.max(...allPrices);
  const diffFromMin = Math.round((product.price - min) * 100) / 100;
  const diffFromMinPct = min > 0 ? Math.round(((product.price - min) / min) * 1000) / 10 : 0;

  return {
    min,
    max,
    diffFromMin,
    diffFromMinPct,
    isAtHistoricalMin: diffFromMin <= 0.01,
  };
}

export function getComparisonWinners(products: Product[]): ComparisonWinners {
  if (products.length === 0) {
    return {
      lowestPriceIds: new Set(),
      lowestTotalPriceIds: new Set(),
      highestDiscountIds: new Set(),
      highestRatingIds: new Set(),
      mostReviewsIds: new Set(),
      highestStockIds: new Set(),
    };
  }

  const minPrice = Math.min(...products.map((p) => p.price));
  const minTotal = Math.min(...products.map((p) => p.price + p.shippingCost));
  const maxDiscount = Math.max(...products.map((p) => getDiscountPercentage(p)));
  const maxRating = Math.max(...products.map((p) => p.rating));
  const maxReviews = Math.max(...products.map((p) => p.reviewCount ?? 0));
  const maxStock = Math.max(...products.map((p) => p.stock));

  return {
    lowestPriceIds: new Set(products.filter((p) => p.price === minPrice).map((p) => p.id)),
    lowestTotalPriceIds: new Set(
      products
        .filter((p) => Math.round((p.price + p.shippingCost) * 100) === Math.round(minTotal * 100))
        .map((p) => p.id)
    ),
    highestDiscountIds: new Set(
      maxDiscount > 0
        ? products.filter((p) => getDiscountPercentage(p) === maxDiscount).map((p) => p.id)
        : []
    ),
    highestRatingIds: new Set(products.filter((p) => p.rating === maxRating).map((p) => p.id)),
    mostReviewsIds: new Set(
      products.filter((p) => (p.reviewCount ?? 0) === maxReviews).map((p) => p.id)
    ),
    highestStockIds: new Set(products.filter((p) => p.stock === maxStock).map((p) => p.id)),
  };
}

export function collectUnifiedSpecKeys(products: Product[]): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();

  for (const product of products) {
    const specs = product.specs ?? {};
    for (const key of Object.keys(specs)) {
      if (!seen.has(key)) {
        seen.add(key);
        keys.push(key);
      }
    }
  }

  return keys;
}

export function computeValueComparisonMetrics(products: Product[]): ValueComparisonRow[] {
  const maxReviews = Math.max(...products.map((p) => p.reviewCount ?? 1), 1);

  return products.map((product) => {
    const discountPct = getDiscountPercentage(product);
    const calidadPrecioScore = product.performanceMetrics?.calidadPrecio ?? 80;
    const ratingScore = Math.round((product.rating / 5) * 100);
    const popularityScore = Math.max(
      20,
      Math.round(((product.reviewCount ?? 0) / maxReviews) * 100)
    );
    const savingsScore = Math.min(100, Math.round(discountPct * 1.6));

    return {
      productId: product.id,
      calidadPrecioScore,
      ratingScore,
      popularityScore,
      savingsScore,
      discountPct,
    };
  });
}

export function toggleProductInCompareList(
  currentIds: string[],
  productId: string,
  maxItems: number = MAX_COMPARE_ITEMS
): { nextIds: string[]; limitReached: boolean } {
  if (currentIds.includes(productId)) {
    return {
      nextIds: currentIds.filter((id) => id !== productId),
      limitReached: false,
    };
  }
  if (currentIds.length >= maxItems) {
    return {
      nextIds: currentIds,
      limitReached: true,
    };
  }
  return {
    nextIds: [...currentIds, productId],
    limitReached: false,
  };
}
