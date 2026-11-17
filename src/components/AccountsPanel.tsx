import React, { useState } from 'react';
import { CheckCircle2, CircleOff, KeyRound, Link2, RefreshCw, Unlink } from 'lucide-react';
import type { LinkedAccount, StoreId } from '../types/unishop';
import { STORE_META } from '../utils/commerce';
import { StoreLogoMark } from './StoreBadge';

interface AccountsPanelProps {
  accounts: LinkedAccount[];
  preselectedStore?: StoreId | null;
  onClearPreselectedStore?: () => void;
  onConnect: (store: StoreId, handle: string) => void;
  onDisconnect: (store: StoreId) => void;
  onSyncAll: () => void;
}

export const AccountsPanel: React.FC<AccountsPanelProps> = ({
  accounts,
  preselectedStore = null,
  onClearPreselectedStore,
  onConnect,
  onDisconnect,
  onSyncAll,
}) => {
  const [editingStore, setEditingStore] = useState<StoreId | null>(preselectedStore);
  const [handleInput, setHandleInput] = useState('');
  const [validationError, setValidationError] = useState('');

  React.useEffect(() => {
    if (preselectedStore) {
      setEditingStore(preselectedStore);
      setHandleInput('');
      setValidationError('');
    }
  }, [preselectedStore]);

  const connectedCount = accounts.filter((a) => a.connected).length;

  const startConnect = (store: StoreId) => {
    setEditingStore(store);
    setHandleInput('');
    setValidationError('');
  };

  const confirmConnect = (e: React.FormEvent, store: StoreId) => {
    e.preventDefault();
    const cleaned = handleInput.trim();
    if (cleaned.length < 3) {
      setValidationError('Introduce un email o usuario válido (mínimo 3 caracteres).');
      return;
    }
    onConnect(store, cleaned);
    setEditingStore(null);
    setHandleInput('');
    setValidationError('');
    onClearPreselectedStore?.();
  };

  return (
    <section aria-labelledby="accounts-heading" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <h1
            id="accounts-heading"
            className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
          >
            Cuentas Vinculadas y Sincronización
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {connectedCount} de {accounts.length} plataformas conectadas. Debes vincular una plataforma para sincronizar productos, comprar o recibir alertas de precios.
          </p>
        </div>

        <button
          type="button"
          onClick={onSyncAll}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Sincronizar sesiones ahora
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {accounts.map((acc) => {
          const meta = STORE_META[acc.store];
          const isEditing = editingStore === acc.store;
          const isHighlighted = preselectedStore === acc.store && !acc.connected;

          return (
            <div
              key={acc.store}
              data-testid={`account-card-${acc.store}`}
              className={`flex flex-col justify-between rounded-xl border bg-white p-5 dark:bg-slate-900 ${
                isHighlighted
                  ? 'border-blue-500 ring-1 ring-blue-500/30'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <StoreLogoMark store={acc.store} className="h-9 w-9" />
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {meta.label}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {meta.authMethodLabel}
                      </p>
                    </div>
                  </div>

                  {/* Explicit text + icon status indicator (no hue-only, no pulsing dots) */}
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0 ${
                      acc.connected
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {acc.connected ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        Conectado
                      </>
                    ) : (
                      <>
                        <CircleOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        Desconectado
                      </>
                    )}
                  </span>
                </div>

                <div className="mt-4 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                  <p>
                    Cuenta:{' '}
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {acc.connected && acc.accountHandle ? acc.accountHandle : 'Sin vincular'}
                    </span>
                  </p>
                  <p>
                    Estado de sincronización:{' '}
                    <span className="text-slate-700 dark:text-slate-300">{acc.syncNote}</span>
                  </p>
                  {acc.lastSyncedAt && (
                    <p className="text-slate-400 dark:text-slate-500">
                      Última sincronización: {new Date(acc.lastSyncedAt).toLocaleString('es-ES')}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
                {isEditing ? (
                  <form onSubmit={(e) => confirmConnect(e, acc.store)} className="space-y-2.5">
                    <label
                      htmlFor={`connect-input-${acc.store}`}
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      {acc.authMethod === 'oauth2'
                        ? `Email o token de tu cuenta ${meta.label} (OAuth 2.0)`
                        : `Usuario o Token de extensión ${meta.label}`}
                    </label>
                    <input
                      id={`connect-input-${acc.store}`}
                      type="text"
                      value={handleInput}
                      onChange={(e) => setHandleInput(e.target.value)}
                      placeholder={
                        acc.authMethod === 'oauth2' ? 'usuario@correo.com' : '@tu_usuario'
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                    />
                    {validationError && (
                      <p className="text-xs font-medium text-red-600 dark:text-red-400">
                        {validationError}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                        Autorizar y vincular
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingStore(null);
                          onClearPreselectedStore?.();
                        }}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : acc.connected ? (
                  <button
                    type="button"
                    onClick={() => onDisconnect(acc.store)}
                    aria-label={`Desconectar ${meta.label}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-red-800 dark:hover:bg-red-950/50 dark:hover:text-red-400 cursor-pointer"
                  >
                    <Unlink className="h-3.5 w-3.5" />
                    Desconectar {meta.label}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => startConnect(acc.store)}
                    aria-label={`Conectar ${meta.label}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 cursor-pointer"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    Conectar {meta.label}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
