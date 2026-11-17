import React, { useState } from 'react';
import {
  Check,
  GitCompareArrows,
  Link2,
  Package,
  ShoppingCart,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import type { LinkedAccount, Product, StoreId } from '../types/unishop';
import {
  collectUnifiedSpecKeys,
  COMPARISON_COLORS,
  getComparisonWinners,
  getDiscountPercentage,
  getHistoricalPriceStats,
} from '../utils/comparison';
import {
  formatCurrency,
  getConditionLabel,
  isStoreConnected,
  STORE_META,
} from '../utils/commerce';
import { ComparisonCharts } from './ComparisonCharts';
import { StoreBadge } from './StoreBadge';

interface ComparisonDrawerProps {
  isOpen: boolean;
  products: Product[];
  accounts: LinkedAccount[];
  onClose: () => void;
  onRemoveProduct: (productId: string) => void;
  onClearAll: () => void;
  onAddToCart: (product: Product) => void;
  onRequestConnectStore: (store: StoreId) => void;
}

type DrawerViewMode = 'all' | 'table' | 'charts';

export const ComparisonDrawer: React.FC<ComparisonDrawerProps> = ({
  isOpen,
  products,
  accounts,
  onClose,
  onRemoveProduct,
  onClearAll,
  onAddToCart,
  onRequestConnectStore,
}) => {
  const [viewMode, setViewMode] = useState<DrawerViewMode>('all');
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const winners = getComparisonWinners(products);
  const specKeys = collectUnifiedSpecKeys(products);

  const handleQuickAdd = (product: Product) => {
    if (!isStoreConnected(product.store, accounts)) {
      onClose();
      onRequestConnectStore(product.store);
      return;
    }
    onAddToCart(product);
    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    window.setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1300);
  };

  return (
    <div
      data-testid="comparison-drawer"
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/55 dark:bg-black/75"
      role="dialog"
      aria-modal="true"
      aria-labelledby="comparison-drawer-title"
    >
      <div className="flex h-full w-full md:max-w-5xl flex-col bg-white shadow-2xl dark:border-l dark:border-slate-800 dark:bg-slate-900">
        {/* Fixed Header */}
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6 dark:border-slate-800 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2
                id="comparison-drawer-title"
                className="inline-flex items-center gap-2 text-lg font-bold text-slate-950 dark:text-white"
              >
                <GitCompareArrows className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Comparación Rápida ({products.length})
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Los mejores valores en precio, descuento, valoración y stock se destacan en verde.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {products.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onClearAll();
                    onClose();
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 whitespace-nowrap cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Vaciar</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar comparador rápido"
                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Integrated Section Tabs */}
          {products.length >= 2 && (
            <div className="mt-3.5 inline-flex rounded-lg bg-slate-100 p-1 text-xs dark:bg-slate-800/90">
              {(
                [
                  { id: 'all', label: 'Vista completa' },
                  { id: 'table', label: 'Tabla comparativa' },
                  { id: 'charts', label: 'Gráficas analíticas' },
                ] as { id: DrawerViewMode; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  data-testid={`comparison-tab-${tab.id}`}
                  aria-pressed={viewMode === tab.id}
                  onClick={() => setViewMode(tab.id)}
                  className={`rounded-md px-3 py-1.5 font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    viewMode === tab.id
                      ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-700 dark:text-white dark:ring-1 dark:ring-slate-600'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 space-y-7">
          {products.length < 2 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-800 dark:bg-slate-950/50">
              <GitCompareArrows className="h-8 w-8 text-slate-400 dark:text-slate-500" />
              <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-slate-100">
                Selecciona al menos 2 productos para comparar
              </h3>
              <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                Marca el botón «Comparar» en cualquier tarjeta del catálogo (máximo 4 artículos simultáneos).
              </p>
            </div>
          ) : (
            <>
              {/* Tabulated Comparison Table */}
              {(viewMode === 'all' || viewMode === 'table') && (
                <section aria-label="Tabla comparativa de productos">
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table
                      data-testid="comparison-table"
                      className="w-full border-collapse text-left text-xs"
                    >
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-950/70">
                          <th
                            scope="col"
                            className="sticky left-0 z-10 min-w-[140px] bg-slate-50 p-4 align-top font-bold text-slate-700 dark:bg-slate-950 dark:text-slate-300"
                          >
                            Producto y acción
                          </th>
                          {products.map((product, idx) => {
                            const color = COMPARISON_COLORS[idx % COMPARISON_COLORS.length];
                            const connected = isStoreConnected(product.store, accounts);
                            const added = Boolean(addedIds[product.id]);

                            return (
                              <th
                                key={product.id}
                                scope="col"
                                className="min-w-[200px] border-l border-slate-200 p-4 align-top font-normal dark:border-slate-800"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="h-2.5 w-2.5 rounded-full shrink-0"
                                      style={{ backgroundColor: color }}
                                      aria-hidden="true"
                                    />
                                    <StoreBadge store={product.store} size="sm" />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => onRemoveProduct(product.id)}
                                    aria-label={`Quitar ${product.title} del comparador`}
                                    className="rounded p-1 text-slate-400 hover:bg-slate-200/70 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-100 cursor-pointer"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>

                                <div className="mt-3 aspect-[4/3] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800">
                                  {!imgErrors[product.id] ? (
                                    <img
                                      src={product.imageUrl}
                                      alt={product.title}
                                      referrerPolicy="no-referrer"
                                      onError={() =>
                                        setImgErrors((prev) => ({ ...prev, [product.id]: true }))
                                      }
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center p-2">
                                      <Package className="h-6 w-6 text-slate-400" />
                                    </div>
                                  )}
                                </div>

                                <p className="mt-2.5 line-clamp-2 min-h-[2.25rem] text-xs font-bold leading-snug text-slate-900 dark:text-slate-100">
                                  {product.title}
                                </p>
                                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                  {product.category} · {getConditionLabel(product.condition)}
                                </p>

                                <button
                                  type="button"
                                  onClick={() => handleQuickAdd(product)}
                                  className={`mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                                    !connected
                                      ? 'border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-300'
                                      : added
                                        ? 'bg-emerald-700 text-white'
                                        : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500'
                                  }`}
                                >
                                  {!connected ? (
                                    <>
                                      <Link2 className="h-3.5 w-3.5" />
                                      Vincular {STORE_META[product.store].label}
                                    </>
                                  ) : added ? (
                                    <>
                                      <Check className="h-3.5 w-3.5" />
                                      Añadido
                                    </>
                                  ) : (
                                    <>
                                      <ShoppingCart className="h-3.5 w-3.5" />
                                      Añadir al carrito
                                    </>
                                  )}
                                </button>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {/* Section: Precio Actual vs. Original */}
                        <tr className="bg-slate-100/70 dark:bg-slate-800/50">
                          <td
                            colSpan={products.length + 1}
                            className="px-4 py-2 text-[11px] font-bold tracking-wide text-slate-700 dark:text-slate-300"
                          >
                            Precio actual vs. original e histórico
                          </td>
                        </tr>

                        <tr>
                          <th
                            scope="row"
                            className="sticky left-0 bg-white px-4 py-3 font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-400"
                          >
                            Precio actual (+ envío)
                          </th>
                          {products.map((product) => {
                            const isBestTotal = winners.lowestTotalPriceIds.has(product.id);
                            const totalWithShip = product.price + product.shippingCost;
                            return (
                              <td
                                key={product.id}
                                className="border-l border-slate-200 px-4 py-3 dark:border-slate-800"
                              >
                                <div className="flex flex-wrap items-baseline gap-2">
                                  <span className="tabular-price font-mono text-sm font-bold text-slate-950 dark:text-white">
                                    {formatCurrency(product.price, product.currency)}
                                  </span>
                                  {product.originalPrice > product.price && (
                                    <span className="tabular-price font-mono text-[11px] text-slate-400 line-through">
                                      {formatCurrency(product.originalPrice, product.currency)}
                                    </span>
                                  )}
                                </div>
                                <p className="mt-0.5 tabular-price text-[11px] text-slate-500 dark:text-slate-400">
                                  Total c/ envío:{' '}
                                  <strong className="font-mono text-slate-800 dark:text-slate-200">
                                    {formatCurrency(totalWithShip)}
                                  </strong>
                                </p>
                                {isBestTotal && (
                                  <span className="mt-1 inline-block rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                    Mejor precio total
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>

                        <tr>
                          <th
                            scope="row"
                            className="sticky left-0 bg-white px-4 py-3 font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-400"
                          >
                            Descuento vs PVP
                          </th>
                          {products.map((product) => {
                            const discountPct = getDiscountPercentage(product);
                            const isBestDiscount = winners.highestDiscountIds.has(product.id);
                            return (
                              <td
                                key={product.id}
                                className="border-l border-slate-200 px-4 py-3 dark:border-slate-800"
                              >
                                <span className="tabular-price font-mono font-semibold text-slate-900 dark:text-slate-100">
                                  {discountPct > 0 ? `-${discountPct}%` : '0%'}
                                </span>
                                {isBestDiscount && (
                                  <span className="ml-2 inline-block rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                    Mayor dto.
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>

                        <tr>
                          <th
                            scope="row"
                            className="sticky left-0 bg-white px-4 py-3 font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-400"
                          >
                            Vs. mínimo histórico
                          </th>
                          {products.map((product) => {
                            const hist = getHistoricalPriceStats(product);
                            return (
                              <td
                                key={product.id}
                                className="border-l border-slate-200 px-4 py-3 dark:border-slate-800"
                              >
                                <p className="tabular-price font-mono font-medium text-slate-900 dark:text-slate-100">
                                  Mín. {formatCurrency(hist.min)}
                                </p>
                                <p
                                  className={`mt-0.5 text-[11px] font-semibold ${
                                    hist.isAtHistoricalMin
                                      ? 'text-emerald-700 dark:text-emerald-400'
                                      : 'text-slate-500 dark:text-slate-400'
                                  }`}
                                >
                                  {hist.isAtHistoricalMin
                                    ? 'En mínimo histórico'
                                    : `+${formatCurrency(hist.diffFromMin)} (+${hist.diffFromMinPct}%)`}
                                </p>
                              </td>
                            );
                          })}
                        </tr>

                        {/* Section: Rating y Popularidad */}
                        <tr className="bg-slate-100/70 dark:bg-slate-800/50">
                          <td
                            colSpan={products.length + 1}
                            className="px-4 py-2 text-[11px] font-bold tracking-wide text-slate-700 dark:text-slate-300"
                          >
                            Rating, reseñas y disponibilidad
                          </td>
                        </tr>

                        <tr>
                          <th
                            scope="row"
                            className="sticky left-0 bg-white px-4 py-3 font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-400"
                          >
                            Valoración
                          </th>
                          {products.map((product) => {
                            const isBestRating = winners.highestRatingIds.has(product.id);
                            return (
                              <td
                                key={product.id}
                                className="border-l border-slate-200 px-4 py-3 dark:border-slate-800"
                              >
                                <div className="flex items-center gap-1.5">
                                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
                                  <span className="tabular-price font-mono font-bold text-slate-900 dark:text-slate-100">
                                    {product.rating.toFixed(1)} / 5.0
                                  </span>
                                  {isBestRating && (
                                    <span className="inline-block rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                      Top
                                    </span>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>

                        <tr>
                          <th
                            scope="row"
                            className="sticky left-0 bg-white px-4 py-3 font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-400"
                          >
                            Reseñas
                          </th>
                          {products.map((product) => {
                            const isMostReviews = winners.mostReviewsIds.has(product.id);
                            return (
                              <td
                                key={product.id}
                                className="border-l border-slate-200 px-4 py-3 dark:border-slate-800"
                              >
                                <span className="tabular-price font-mono font-semibold text-slate-900 dark:text-slate-100">
                                  {(product.reviewCount ?? 0).toLocaleString('es-ES')} reseñas
                                </span>
                                {isMostReviews && (
                                  <span className="ml-2 inline-block rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                    Más popular
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>

                        <tr>
                          <th
                            scope="row"
                            className="sticky left-0 bg-white px-4 py-3 font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-400"
                          >
                            Stock y entrega
                          </th>
                          {products.map((product) => {
                            const isBestStock = winners.highestStockIds.has(product.id);
                            return (
                              <td
                                key={product.id}
                                className="border-l border-slate-200 px-4 py-3 dark:border-slate-800"
                              >
                                <p className="tabular-price font-semibold text-slate-900 dark:text-slate-100">
                                  {product.stock === 1
                                    ? 'Última unidad'
                                    : `${product.stock} disponibles`}
                                  {isBestStock && product.stock > 1 && (
                                    <span className="ml-2 inline-block rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                      Mayor stock
                                    </span>
                                  )}
                                </p>
                                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                  {product.estimatedDelivery}
                                </p>
                              </td>
                            );
                          })}
                        </tr>

                        {/* Section: Dynamic Technical Specifications */}
                        <tr className="bg-slate-100/70 dark:bg-slate-800/50">
                          <td
                            colSpan={products.length + 1}
                            className="px-4 py-2 text-[11px] font-bold tracking-wide text-slate-700 dark:text-slate-300"
                          >
                            Especificaciones técnicas
                          </td>
                        </tr>

                        {specKeys.map((specKey) => (
                          <tr key={specKey}>
                            <th
                              scope="row"
                              className="sticky left-0 bg-white px-4 py-2.5 font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-400"
                            >
                              {specKey}
                            </th>
                            {products.map((product) => {
                              const rawVal = product.specs?.[specKey];
                              return (
                                <td
                                  key={`${product.id}-${specKey}`}
                                  className="border-l border-slate-200 px-4 py-2.5 text-slate-800 dark:border-slate-800 dark:text-slate-200"
                                >
                                  {rawVal !== undefined ? String(rawVal) : '—'}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* Comparative Price & Performance Charts */}
              {(viewMode === 'all' || viewMode === 'charts') && (
                <ComparisonCharts products={products} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
