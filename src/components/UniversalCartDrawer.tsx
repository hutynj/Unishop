import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  BellRing,
  Minus,
  Plus,
  RefreshCw,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import type { CartItem, LinkedAccount, PriceAlert, Product, StoreId } from '../types/unishop';
import {
  calculateCartTotals,
  formatCurrency,
  getConditionLabel,
  groupCartByStore,
  isStoreConnected,
  STORE_META,
} from '../utils/commerce';
import { StoreBadge } from './StoreBadge';

interface UniversalCartDrawerProps {
  isOpen: boolean;
  items: CartItem[];
  accounts: LinkedAccount[];
  priceAlerts: PriceAlert[];
  onClose: () => void;
  onUpdateQuantity: (itemId: string, nextQty: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onTogglePriceAlert: (product: Product) => void;
  onSimulatePriceDrop: () => void;
  onStartCheckout: (itemsToCheckout: CartItem[]) => void;
  onRequestConnectStore: (store: StoreId) => void;
}

export const UniversalCartDrawer: React.FC<UniversalCartDrawerProps> = ({
  isOpen,
  items,
  accounts,
  priceAlerts,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onTogglePriceAlert,
  onSimulatePriceDrop,
  onStartCheckout,
  onRequestConnectStore,
}) => {
  const [viewMode, setViewMode] = useState<'grouped' | 'mixed'>('grouped');

  if (!isOpen) return null;

  const totals = calculateCartTotals(items);
  const storeGroups = groupCartByStore(items);
  const hasDisconnectedItems = items.some((item) => !isStoreConnected(item.product.store, accounts));
  const activeAlertsCount = priceAlerts.filter((a) => a.enabled).length;

  const isAlertEnabled = (productId: string) =>
    priceAlerts.some((a) => a.productId === productId && a.enabled);

  const renderCartRow = (item: CartItem, showStoreBadge: boolean) => {
    const alertActive = isAlertEnabled(item.product.id);
    const connected = isStoreConnected(item.product.store, accounts);

    return (
      <div
        key={item.id}
        data-testid={`cart-item-${item.product.id}`}
        className="flex items-start gap-3.5 border-b border-slate-100 py-3.5 last:border-b-0 dark:border-slate-800"
      >
        <img
          src={item.product.imageUrl}
          alt={item.product.title}
          referrerPolicy="no-referrer"
          className="h-16 w-20 shrink-0 rounded-lg bg-slate-100 object-cover dark:bg-slate-800"
        />
        <div className="min-w-0 flex-1">
          {showStoreBadge && (
            <div className="mb-1">
              <StoreBadge store={item.product.store} size="sm" />
            </div>
          )}
          <p className="line-clamp-2 text-sm font-medium leading-snug text-slate-900 dark:text-slate-100">
            {item.product.title}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {getConditionLabel(item.product.condition)} ·{' '}
            {item.product.shippingCost === 0
              ? 'Envío gratis'
              : `Envío ${formatCurrency(item.product.shippingCost)}`}
          </p>

          {!connected && (
            <button
              type="button"
              onClick={() => onRequestConnectStore(item.product.store)}
              className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:underline dark:text-amber-400 cursor-pointer"
            >
              <AlertTriangle className="h-3 w-3" />
              Cuenta {STORE_META[item.product.store].label} desconectada · Vincular para pagar/alertar
            </button>
          )}

          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                  aria-label={`Disminuir cantidad de ${item.product.title}`}
                  className="flex h-7 w-7 items-center justify-center text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white cursor-pointer"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="tabular-price px-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  aria-label={`Aumentar cantidad de ${item.product.title}`}
                  className="flex h-7 w-7 items-center justify-center text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>

              <button
                type="button"
                aria-pressed={alertActive}
                onClick={() => onTogglePriceAlert(item.product)}
                aria-label={
                  alertActive
                    ? `Desactivar alerta de precio para ${item.product.title}`
                    : `Activar alerta de precio para ${item.product.title}`
                }
                className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                  alertActive
                    ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {alertActive ? (
                  <>
                    <BellRing className="h-3 w-3" />
                    Alerta activa
                  </>
                ) : (
                  <>
                    <Bell className="h-3 w-3" />
                    Alerta
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="tabular-price font-mono text-sm font-semibold text-slate-950 dark:text-white">
                {formatCurrency(item.product.price * item.quantity)}
              </span>
              <button
                type="button"
                onClick={() => onRemoveItem(item.id)}
                aria-label={`Eliminar ${item.product.title} del carrito`}
                className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-800 dark:hover:text-red-400 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/45 dark:bg-black/65"
      role="dialog"
      aria-modal="true"
      aria-labelledby="universal-cart-title"
    >
      <div className="flex h-full w-full max-w-lg flex-col bg-white shadow-2xl dark:border-l dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div>
            <h2
              id="universal-cart-title"
              className="text-lg font-bold text-slate-900 dark:text-slate-100"
            >
              Carrito Universal
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {totals.totalQuantity} artículo(s) en {totals.storeCount} tienda(s) ·{' '}
              {activeAlertsCount} alerta(s)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar carrito universal"
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* View Mode & Price Simulation Toolbar */}
        {items.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/70 px-6 py-2.5 dark:border-slate-800 dark:bg-slate-950/50">
            <div className="inline-flex rounded-lg bg-slate-200/70 p-0.5 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('grouped')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  viewMode === 'grouped'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                Agrupado por tienda
              </button>
              <button
                type="button"
                onClick={() => setViewMode('mixed')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  viewMode === 'mixed'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                Lista mezclada
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onSimulatePriceDrop}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 whitespace-nowrap cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                Simular actualización de precios
              </button>
              <button
                type="button"
                onClick={onClearCart}
                className="text-xs font-medium text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Vaciar
              </button>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
                Tu carrito universal está vacío
              </h3>
              <p className="mt-1.5 max-w-xs text-sm text-slate-500 dark:text-slate-400">
                Añade productos de Amazon, Vinted, Wallapop, AliExpress o eBay para gestionarlos, activar alertas de bajada de precio y pagarlos desde aquí.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-5 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 cursor-pointer"
              >
                Explorar catálogo
              </button>
            </div>
          ) : viewMode === 'grouped' ? (
            <div className="space-y-6">
              {storeGroups.map((group) => {
                const groupConnected = isStoreConnected(group.store, accounts);
                return (
                  <section
                    key={group.store}
                    className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/40"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                      <StoreBadge store={group.store} size="md" />
                      {groupConnected ? (
                        <button
                          type="button"
                          onClick={() => onStartCheckout(group.items)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Comprar solo esta tienda →
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onRequestConnectStore(group.store)}
                          className="text-xs font-semibold text-amber-700 hover:underline dark:text-amber-400 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Vincular para comprar →
                        </button>
                      )}
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {group.items.map((item) => renderCartRow(item, false))}
                    </div>

                    <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>Subtotal {group.storeLabel}</span>
                        <span className="tabular-price font-mono">
                          {formatCurrency(group.itemsSubtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>Envío estimado</span>
                        <span className="tabular-price font-mono">
                          {group.shippingTotal === 0
                            ? 'Gratis'
                            : formatCurrency(group.shippingTotal)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                        <span>Subtotal tienda</span>
                        <span className="tabular-price font-mono">
                          {formatCurrency(group.storeTotal)}
                        </span>
                      </div>
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((item) => renderCartRow(item, true))}
            </div>
          )}
        </div>

        {/* Sticky Summary Footer */}
        {items.length > 0 && (
          <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/70">
            {hasDisconnectedItems && (
              <p className="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                Tienes productos de una plataforma desconectada. Vincula tu cuenta antes de confirmar la compra.
              </p>
            )}

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal productos</span>
                <span className="tabular-price font-mono font-medium text-slate-900 dark:text-slate-200">
                  {formatCurrency(totals.itemsSubtotal)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Envíos consolidados estimados</span>
                <span className="tabular-price font-mono font-medium text-slate-900 dark:text-slate-200">
                  {totals.shippingTotal === 0
                    ? 'Gratis'
                    : formatCurrency(totals.shippingTotal)}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2.5 text-base font-bold text-slate-950 dark:border-slate-800 dark:text-white">
                <span>Total global estimado</span>
                <span data-testid="cart-grand-total" className="tabular-price font-mono">
                  {formatCurrency(totals.grandTotal)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onStartCheckout(items)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 cursor-pointer"
            >
              <span>
                {totals.storeCount > 1
                  ? `Finalizar Compra (${totals.storeCount} tiendas)`
                  : 'Finalizar Compra'}
              </span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
