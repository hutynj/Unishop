import React from 'react';
import {
  Bell,
  BellRing,
  Link2,
  ShoppingCart,
  Star,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import type { Product, StoreId } from '../types/unishop';
import { formatCurrency, getConditionLabel, STORE_META } from '../utils/commerce';
import { PriceHistoryChart } from './PriceHistoryChart';
import { StoreBadge } from './StoreBadge';

interface ProductDetailModalProps {
  product: Product | null;
  allProducts: Product[];
  isStoreConnected: boolean;
  isAlertEnabled: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  onQuickBuy: (product: Product) => void;
  onTogglePriceAlert: (product: Product) => void;
  onSimulateProductPriceChange: (productId: string, direction: 'down' | 'up') => void;
  onRequestConnectStore: (store: StoreId) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  allProducts,
  isStoreConnected,
  isAlertEnabled,
  onClose,
  onAddToCart,
  onQuickBuy,
  onTogglePriceAlert,
  onSimulateProductPriceChange,
  onRequestConnectStore,
}) => {
  if (!product) return null;

  const discountPct =
    product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 dark:bg-black/75"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-detail-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <StoreBadge store={product.store} size="sm" />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {product.category} · {getConditionLabel(product.condition)}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar detalle del producto"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            {/* Image */}
            <div className="md:col-span-5">
              <div className="aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800">
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="tabular-price">{product.rating.toFixed(1)}</span> ·{' '}
                  {product.sellerName}
                </span>
                <span className="tabular-price">
                  {product.stock === 1 ? 'Última unidad' : `${product.stock} en stock`}
                </span>
              </div>
            </div>

            {/* Info & Actions */}
            <div className="flex flex-col justify-between md:col-span-7">
              <div>
                <h2
                  id="product-detail-title"
                  className="text-xl font-bold leading-snug text-slate-950 dark:text-white"
                >
                  {product.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {product.description}
                </p>

                <div className="mt-4 flex flex-wrap items-baseline gap-3">
                  <span
                    data-testid="detail-modal-price"
                    className="tabular-price font-mono text-2xl font-bold text-slate-950 dark:text-white"
                  >
                    {formatCurrency(product.price, product.currency)}
                  </span>
                  {product.originalPrice > product.price && (
                    <span className="tabular-price font-mono text-sm text-slate-400 line-through">
                      {formatCurrency(product.originalPrice, product.currency)}
                    </span>
                  )}
                  {discountPct > 0 && (
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      -{discountPct}% vs PVP
                    </span>
                  )}
                </div>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {product.shippingCost === 0
                    ? 'Envío gratis'
                    : `Envío est. ${formatCurrency(product.shippingCost)}`}{' '}
                  · {product.estimatedDelivery}
                </p>
              </div>

              <div className="mt-5 space-y-2.5">
                {isStoreConnected ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onAddToCart(product)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 whitespace-nowrap cursor-pointer"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      Añadir al carrito
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onQuickBuy(product);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 whitespace-nowrap cursor-pointer"
                    >
                      <Zap className="h-3.5 w-3.5" />
                      Finalizar compra
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onRequestConnectStore(product.store);
                    }}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-300 cursor-pointer"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    Vincular {STORE_META[product.store].label} para comprar o alertar
                  </button>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    aria-pressed={isAlertEnabled}
                    onClick={() => onTogglePriceAlert(product)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                      isAlertEnabled
                        ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    {isAlertEnabled ? (
                      <>
                        <BellRing className="h-3.5 w-3.5" />
                        Alerta activa
                      </>
                    ) : (
                      <>
                        <Bell className="h-3.5 w-3.5" />
                        Vigilar bajada de precio
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    data-testid="simulate-detail-price-drop"
                    onClick={() => onSimulateProductPriceChange(product.id, 'down')}
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 dark:border-emerald-800/70 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50 cursor-pointer"
                  >
                    <TrendingDown className="h-3.5 w-3.5" />
                    Simular bajada (-12%)
                  </button>

                  <button
                    type="button"
                    data-testid="simulate-detail-price-up"
                    onClick={() => onSimulateProductPriceChange(product.id, 'up')}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                    Simular subida (+8%)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Price Fluctuation Chart */}
          <PriceHistoryChart product={product} comparableProducts={allProducts} />
        </div>
      </div>
    </div>
  );
};
