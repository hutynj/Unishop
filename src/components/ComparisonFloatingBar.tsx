import React from 'react';
import { GitCompareArrows, Trash2, X } from 'lucide-react';
import type { Product } from '../types/unishop';
import { COMPARISON_COLORS, MAX_COMPARE_ITEMS } from '../utils/comparison';
import { formatCurrency } from '../utils/commerce';

interface ComparisonFloatingBarProps {
  products: Product[];
  isDrawerOpen: boolean;
  onRemoveProduct: (productId: string) => void;
  onClearAll: () => void;
  onOpenDrawer: () => void;
}

export const ComparisonFloatingBar: React.FC<ComparisonFloatingBarProps> = ({
  products,
  isDrawerOpen,
  onRemoveProduct,
  onClearAll,
  onOpenDrawer,
}) => {
  if (products.length === 0 || isDrawerOpen) return null;

  const canCompare = products.length >= 2;

  return (
    <div
      data-testid="comparison-floating-bar"
      role="region"
      aria-label="Barra de comparación rápida"
      className="fixed bottom-3 left-1/2 z-40 w-[calc(100%-1rem)] sm:w-[calc(100%-1.5rem)] max-w-4xl -translate-x-1/2 rounded-2xl border border-slate-200 bg-white/95 px-2.5 py-2 sm:px-3.5 sm:py-2.5 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95"
    >
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        {/* Selected Thumbnails */}
        <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2 overflow-x-auto">
          <div className="hidden sm:flex flex-col shrink-0 pr-1">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
              Comparador
            </span>
            <span className="tabular-price text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
              {products.length}/{MAX_COMPARE_ITEMS} selecc.
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {products.map((product, index) => {
              const color = COMPARISON_COLORS[index % COMPARISON_COLORS.length];
              return (
                <div
                  key={product.id}
                  data-testid={`compare-chip-${product.id}`}
                  className="relative flex items-center gap-1.5 sm:gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1 pr-1.5 sm:pr-2 dark:border-slate-700 dark:bg-slate-800 shrink-0"
                >
                  <span
                    className="h-5 sm:h-6 w-1 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                    aria-hidden="true"
                  />
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    referrerPolicy="no-referrer"
                    className="h-7 w-7 sm:h-8 sm:w-8 rounded-md bg-white object-cover dark:bg-slate-900 shrink-0"
                  />
                  <div className="hidden md:block max-w-[115px] min-w-0">
                    <p className="truncate text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                      {product.brand} {product.model}
                    </p>
                    <p className="tabular-price font-mono text-[10px] text-slate-500 dark:text-slate-400">
                      {formatCurrency(product.price, product.currency)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveProduct(product.id)}
                    aria-label={`Quitar ${product.title} de la comparación`}
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-800 dark:hover:bg-slate-700 dark:hover:text-slate-100 cursor-pointer shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            data-testid="compare-clear-btn"
            onClick={onClearAll}
            aria-label="Limpiar selección de comparación"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 sm:px-2.5 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Limpiar</span>
          </button>

          <button
            type="button"
            data-testid="compare-open-drawer-btn"
            disabled={!canCompare}
            onClick={onOpenDrawer}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 sm:px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              canCompare
                ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'
            }`}
          >
            <GitCompareArrows className="h-3.5 w-3.5" />
            <span>
              {canCompare
                ? `Comparar ahora (${products.length})`
                : 'Elige 1 más (min. 2)'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
