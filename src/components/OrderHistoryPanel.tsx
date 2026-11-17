import React from 'react';
import { PackageCheck, ShoppingBag } from 'lucide-react';
import type { Order } from '../types/unishop';
import { formatCurrency } from '../utils/commerce';
import { StoreBadge } from './StoreBadge';

interface OrderHistoryPanelProps {
  orders: Order[];
  onExploreCatalog: () => void;
}

export const OrderHistoryPanel: React.FC<OrderHistoryPanelProps> = ({
  orders,
  onExploreCatalog,
}) => {
  return (
    <section aria-labelledby="order-history-heading" className="space-y-6">
      <div className="border-b border-slate-200 pb-5 dark:border-slate-800">
        <h1
          id="order-history-heading"
          className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
        >
          Historial de Pedidos
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Registro persistente de compras confirmadas en tus plataformas conectadas.
        </p>
      </div>

      {orders.length === 0 ? (
        <div
          data-testid="order-history-empty"
          className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-base font-bold text-slate-900 dark:text-slate-100">
            Aún no has realizado ningún pedido
          </h2>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-500 dark:text-slate-400">
            Explora el catálogo unificado de Amazon, Vinted, Wallapop, AliExpress y eBay y completa tu primera compra para ver el recibo detallado aquí.
          </p>
          <button
            type="button"
            onClick={onExploreCatalog}
            className="mt-5 rounded-lg bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 cursor-pointer"
          >
            Explorar catálogo
          </button>
        </div>
      ) : (
        <div data-testid="order-history-list" className="space-y-5">
          {orders.map((order) => (
            <article
              key={order.id}
              data-testid={`order-card-${order.id}`}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            >
              {/* Order Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/70 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Pedido: </span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                      {order.id}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Fecha: </span>
                    <time
                      dateTime={order.createdAt}
                      className="font-medium text-slate-800 dark:text-slate-200"
                    >
                      {new Date(order.createdAt).toLocaleString('es-ES', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </time>
                  </div>
                  <span className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
                    <PackageCheck className="h-3.5 w-3.5" />
                    {order.checkoutMode === 'guided' ? 'Checkout Guiado' : 'Compra rápida'}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Total pagado: </span>
                  <span className="tabular-price font-mono text-base font-bold text-slate-950 dark:text-white">
                    {formatCurrency(order.totalPaid)}
                  </span>
                </div>
              </div>

              {/* Order Items */}
              <div className="divide-y divide-slate-100 px-5 dark:divide-slate-800">
                {order.items.map((item, idx) => (
                  <div
                    key={`${order.id}-${item.productId}-${idx}`}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3.5">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="h-14 w-16 shrink-0 rounded-lg bg-slate-100 object-cover dark:bg-slate-800"
                      />
                      <div className="min-w-0">
                        <div className="mb-1">
                          <StoreBadge store={item.store} size="sm" />
                        </div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {item.title}
                        </p>
                        <p className="mt-0.5 tabular-price text-xs text-slate-500 dark:text-slate-400">
                          Cantidad: {item.quantity} · Precio unitario: {formatCurrency(item.unitPrice)}
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <p className="tabular-price font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(item.lineTotal)}
                      </p>
                      <p className="tabular-price text-[11px] text-slate-500 dark:text-slate-400">
                        {item.shippingCost === 0
                          ? 'Envío gratis'
                          : `Envío ${formatCurrency(item.shippingCost)}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary Footer */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/40 px-5 py-2.5 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
                <span>
                  Subtotal artículos:{' '}
                  <strong className="tabular-price font-mono text-slate-700 dark:text-slate-300">
                    {formatCurrency(order.itemsSubtotal)}
                  </strong>{' '}
                  · Envíos:{' '}
                  <strong className="tabular-price font-mono text-slate-700 dark:text-slate-300">
                    {order.shippingTotal === 0 ? 'Gratis' : formatCurrency(order.shippingTotal)}
                  </strong>
                  {order.paymentSummary && (
                    <>
                      {' · Pago: '}
                      <strong className="text-slate-700 dark:text-slate-300">
                        {order.paymentSummary}
                      </strong>
                    </>
                  )}
                </span>
                <span>{order.stores.length} plataforma(s)</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
