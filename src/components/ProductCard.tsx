import React, { useState } from 'react';
import {
  BarChart3,
  Check,
  GitCompareArrows,
  Link2,
  Package,
  ShoppingCart,
  Star,
  Zap,
} from 'lucide-react';
import type { Product, StoreId } from '../types/unishop';
import { formatCurrency, getConditionLabel, STORE_META } from '../utils/commerce';
import { StoreBadge } from './StoreBadge';

interface ProductCardProps {
  product: Product;
  isStoreConnected: boolean;
  onAddToCart: (product: Product) => void;
  onQuickBuy: (product: Product) => void;
  onOpenDetail: (product: Product) => void;
  onRequestConnectStore: (store: StoreId) => void;
  isHighlighted?: boolean;
  isSelectedForCompare?: boolean;
  compareLimitReached?: boolean;
  onToggleCompare?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isStoreConnected,
  onAddToCart,
  onQuickBuy,
  onOpenDetail,
  onRequestConnectStore,
  isHighlighted = false,
  isSelectedForCompare = false,
  compareLimitReached = false,
  onToggleCompare,
}) => {
  const [imgError, setImgError] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = () => {
    if (!isStoreConnected) {
      onRequestConnectStore(product.store);
      return;
    }
    onAddToCart(product);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1400);
  };

  const handleQuickBuyClick = () => {
    if (!isStoreConnected) {
      onRequestConnectStore(product.store);
      return;
    }
    onQuickBuy(product);
  };

  const shippingText =
    product.shippingCost === 0
      ? 'Envío gratis'
      : `Envío est. ${formatCurrency(product.shippingCost, product.currency)}`;

  return (
    <article
      data-testid={`product-card-${product.id}`}
      className={`group flex flex-col justify-between overflow-hidden rounded-xl border bg-white transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900 ${
        isSelectedForCompare || isHighlighted
          ? 'border-blue-500 ring-1 ring-blue-500/35'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      <div>
        <button
          type="button"
          onClick={() => onOpenDetail(product)}
          aria-label={`Ver detalles e historial de precios de ${product.title}`}
          className="relative block aspect-[4/3] w-full overflow-hidden bg-slate-100 text-left dark:bg-slate-800 cursor-pointer"
        >
          {!imgError ? (
            <img
              src={product.imageUrl}
              alt={product.title}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 to-slate-200 p-4 text-center dark:from-slate-800 dark:to-slate-900">
              <Package className="h-8 w-8 text-slate-400 dark:text-slate-500" />
              <span className="line-clamp-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                {product.title}
              </span>
            </div>
          )}
        </button>

        <div className="p-4">
          <div className="flex items-center justify-between gap-2">
            <StoreBadge store={product.store} size="sm" />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
              {getConditionLabel(product.condition)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onOpenDetail(product)}
            className="mt-2.5 block w-full text-left cursor-pointer"
          >
            <h3 className="line-clamp-2 min-h-[2.75rem] text-[15px] font-semibold leading-snug text-slate-900 transition-colors hover:text-blue-600 dark:text-slate-100 dark:hover:text-blue-400">
              {product.title}
            </h3>
          </button>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span>{product.category}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-0.5 text-slate-700 dark:text-slate-300">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="tabular-price">{product.rating.toFixed(1)}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-price">
              {product.stock === 1 ? 'Última unidad' : `${product.stock} disp.`}
            </span>
          </div>

          {!isStoreConnected && (
            <p className="mt-2 text-[11px] font-medium text-amber-700 dark:text-amber-400">
              Cuenta {STORE_META[product.store].label} sin vincular · Conéctala para comprar
            </p>
          )}
        </div>
      </div>

      <div className="border-t border-slate-100 px-4 pb-4 pt-3 dark:border-slate-800">
        <div>
          <button
            type="button"
            onClick={() => onOpenDetail(product)}
            aria-label={`Ver historial de precios de ${product.title}`}
            className="flex items-baseline gap-2 text-left hover:opacity-80 cursor-pointer"
          >
            <span className="tabular-price font-mono text-lg font-semibold tracking-tight text-slate-950 dark:text-white">
              {formatCurrency(product.price, product.currency)}
            </span>
            {(product.previousPrice ?? product.originalPrice) > product.price && (
              <span className="tabular-price font-mono text-xs text-slate-400 line-through">
                {formatCurrency(product.previousPrice ?? product.originalPrice, product.currency)}
              </span>
            )}
          </button>
          <p className="mt-0.5 tabular-price text-xs text-slate-500 dark:text-slate-400">
            {shippingText} · {product.estimatedDelivery}
          </p>
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onOpenDetail(product)}
            title="Ver gráfica de fluctuación de precios"
            aria-label={`Ver gráfica de precios de ${product.title}`}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/60 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Historial
          </button>

          {onToggleCompare && (
            <button
              type="button"
              data-testid={`compare-toggle-${product.id}`}
              aria-pressed={isSelectedForCompare}
              aria-label={
                isSelectedForCompare
                  ? `Quitar ${product.title} de la comparación`
                  : `Comparar ${product.title}`
              }
              title={
                !isSelectedForCompare && compareLimitReached
                  ? 'Máximo 4 productos en comparación'
                  : isSelectedForCompare
                    ? 'Quitar de la comparación'
                    : 'Añadir a Comparación Rápida'
              }
              onClick={() => onToggleCompare(product)}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isSelectedForCompare
                  ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-300'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {isSelectedForCompare ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Comparando
                </>
              ) : (
                <>
                  <GitCompareArrows className="h-3.5 w-3.5" />
                  Comparar
                </>
              )}
            </button>
          )}
        </div>

        <div className="mt-3.5 flex items-center gap-2">
          {isStoreConnected ? (
            <button
              type="button"
              onClick={handleAdd}
              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3.5 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                justAdded
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500'
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Añadido
                </>
              ) : (
                <>
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Añadir al carrito universal
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onRequestConnectStore(product.store)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/70 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Link2 className="h-3.5 w-3.5" />
              Vincular {STORE_META[product.store].label}
            </button>
          )}

          <button
            type="button"
            onClick={handleQuickBuyClick}
            title={
              isStoreConnected
                ? `Finalizar compra directa en ${STORE_META[product.store].label}`
                : `Vincula ${STORE_META[product.store].label} para compra rápida`
            }
            aria-label={`Compra rápida de ${product.title}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 shrink-0 cursor-pointer"
          >
            <Zap className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
};
