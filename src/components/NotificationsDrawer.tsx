import React, { useState } from 'react';
import {
  Bell,
  BellOff,
  BellRing,
  CheckCheck,
  Clock,
  RefreshCw,
  Trash2,
  TrendingDown,
  X,
} from 'lucide-react';
import type { Notification, PushNotificationState } from '../types/unishop';
import { formatCurrency } from '../utils/commerce';
import { StoreBadge } from './StoreBadge';

interface NotificationsDrawerProps {
  isOpen: boolean;
  notifications: Notification[];
  activeAlertsCount: number;
  pushState: PushNotificationState;
  onRequestPushPermission: () => Promise<unknown>;
  onTogglePushEnabled: (enabled: boolean) => void;
  onClose: () => void;
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
  onSimulatePriceDrop: (delayMs?: number) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  notifications,
  activeAlertsCount,
  pushState,
  onRequestPushPermission,
  onTogglePushEnabled,
  onClose,
  onMarkAllRead,
  onMarkRead,
  onClearAll,
  onSimulatePriceDrop,
}) => {
  const [delayedTest, setDelayedTest] = useState(false);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const permissionLabel =
    pushState.permission === 'granted'
      ? 'Concedido (granted)'
      : pushState.permission === 'denied'
        ? 'Bloqueado (denied)'
        : pushState.permission === 'default'
          ? 'Pendiente (default)'
          : 'No soportado';

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/45 dark:bg-black/65"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notifications-drawer-title"
    >
      <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl dark:border-l dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div>
            <h2
              id="notifications-drawer-title"
              className="text-lg font-bold text-slate-900 dark:text-slate-100"
            >
              Actividad y Alertas
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {unreadCount} sin leer · {activeAlertsCount} alerta(s) de precio activas
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel de actividad"
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Native Web Notifications API Panel */}
        <div
          data-testid="push-permission-panel"
          className="border-b border-slate-200 bg-slate-50/80 px-6 py-3.5 dark:border-slate-800 dark:bg-slate-950/70"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {pushState.permission === 'granted' && pushState.enabled ? (
                <BellRing className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <BellOff className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" />
              )}
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Notificaciones Push Nativas
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Estado:{' '}
                  <span
                    data-testid="push-permission-status"
                    className={`font-semibold ${
                      pushState.permission === 'granted'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : pushState.permission === 'denied'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {permissionLabel}
                  </span>
                </p>
              </div>
            </div>

            {pushState.supported && pushState.permission === 'default' && (
              <button
                type="button"
                data-testid="request-push-permission-btn"
                onClick={() => void onRequestPushPermission()}
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 whitespace-nowrap cursor-pointer"
              >
                Permitir Push
              </button>
            )}

            {pushState.supported && pushState.permission === 'granted' && (
              <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pushState.enabled}
                  onChange={(e) => onTogglePushEnabled(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Activas
              </label>
            )}
          </div>

          {pushState.permission === 'denied' && (
            <p className="mt-2 text-[11px] text-amber-700 dark:text-amber-400">
              Has bloqueado las notificaciones en el navegador. Actívalas en la configuración del sitio o usa los avisos internos de la app.
            </p>
          )}
        </div>

        {/* Simulation & Bulk Actions Bar */}
        <div className="space-y-2 border-b border-slate-100 bg-slate-50 px-6 py-3 dark:border-slate-800 dark:bg-slate-950/40">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => onSimulatePriceDrop(delayedTest ? 4000 : 0)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 whitespace-nowrap cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {delayedTest ? 'Simular bajada en 4s' : 'Simular bajada de precios'}
            </button>

            <div className="flex items-center gap-3 text-xs">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={onMarkAllRead}
                  className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 cursor-pointer"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Marcar leídas
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={onClearAll}
                  className="inline-flex items-center gap-1 font-medium text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Limpiar
                </button>
              )}
            </div>
          </div>

          <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={delayedTest}
              onChange={(e) => setDelayedTest(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <Clock className="h-3 w-3" />
            <span>Retardo de 4 segundos (permite minimizar el navegador)</span>
          </label>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {notifications.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                <Bell className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-slate-100">
                Sin notificaciones todavía
              </h3>
              <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Activa la campana de alerta en cualquier producto del carrito y pulsa «Simular actualización de precios» para detectar bajadas en tus tiendas conectadas.
              </p>
            </div>
          ) : (
            <div data-testid="notifications-list" className="space-y-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => !notif.read && onMarkRead(notif.id)}
                  className={`rounded-xl border p-4 transition-colors ${
                    notif.read
                      ? 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                      : 'border-blue-200 bg-blue-50/50 dark:border-blue-800/70 dark:bg-blue-950/30 cursor-pointer'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {notif.type === 'price_drop' && (
                        <TrendingDown className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      )}
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {notif.title}
                      </span>
                    </div>
                    {!notif.read && (
                      <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 shrink-0">
                        Nueva
                      </span>
                    )}
                  </div>

                  {notif.store && (
                    <div className="mt-2">
                      <StoreBadge store={notif.store} size="sm" />
                    </div>
                  )}

                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {notif.message}
                  </p>

                  {notif.previousPrice !== undefined && notif.newPrice !== undefined && (
                    <div className="mt-2.5 flex items-baseline gap-2.5 text-xs">
                      <span className="tabular-price font-mono text-slate-400 line-through">
                        {formatCurrency(notif.previousPrice)}
                      </span>
                      <span className="tabular-price font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {formatCurrency(notif.newPrice)}
                      </span>
                    </div>
                  )}

                  <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
                    {new Date(notif.createdAt).toLocaleString('es-ES', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
