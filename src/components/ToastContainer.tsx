import React from 'react';
import { AlertCircle, CheckCircle2, TrendingDown, X } from 'lucide-react';
import type { StoreId } from '../types/unishop';
import { formatCurrency, STORE_META } from '../utils/commerce';

export interface ToastItem {
  id: string;
  variant: 'price_drop' | 'info' | 'warning';
  title: string;
  message: string;
  store?: StoreId;
  previousPrice?: number;
  newPrice?: number;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
  offsetForFloatingBar?: boolean;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
  offsetForFloatingBar = false,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      data-testid="toast-container"
      className={`fixed right-4 z-[60] flex w-full max-w-sm flex-col gap-2.5 px-4 sm:px-0 transition-all ${
        offsetForFloatingBar ? 'bottom-24' : 'bottom-4'
      }`}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              {toast.variant === 'price_drop' ? (
                <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : toast.variant === 'warning' ? (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
              )}
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {toast.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {toast.message}
                </p>
                {toast.previousPrice !== undefined && toast.newPrice !== undefined && (
                  <p className="mt-1.5 text-xs">
                    <span className="tabular-price font-mono text-slate-400 line-through">
                      {formatCurrency(toast.previousPrice)}
                    </span>{' '}
                    <span className="tabular-price font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(toast.newPrice)}
                    </span>
                    {toast.store && (
                      <span className="text-slate-500 dark:text-slate-400">
                        {' '}· en {STORE_META[toast.store].label}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Cerrar notificación"
              className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
