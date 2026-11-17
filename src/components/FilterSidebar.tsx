import React from 'react';
import { RotateCcw } from 'lucide-react';
import type {
  ConditionFilter,
  LinkedAccount,
  Product,
  SearchFilters,
  SortOrder,
  StoreId,
} from '../types/unishop';
import { ALL_STORES, STORE_META } from '../utils/commerce';
import { StoreLogoMark } from './StoreBadge';

interface FilterSidebarProps {
  filters: SearchFilters;
  allProducts: Product[];
  linkedAccounts: LinkedAccount[];
  onChange: (next: SearchFilters) => void;
  onReset: () => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  allProducts,
  linkedAccounts,
  onChange,
  onReset,
}) => {
  const brandModelOptions = Array.from(
    new Set(allProducts.map((p) => `${p.brand} ${p.model}`))
  ).sort();

  const categoryOptions = Array.from(
    new Set(allProducts.map((p) => p.category))
  ).sort();

  const toggleStore = (store: StoreId) => {
    const exists = filters.stores.includes(store);
    const nextStores = exists
      ? filters.stores.filter((s) => s !== store)
      : [...filters.stores, store];
    onChange({ ...filters, stores: nextStores });
  };

  const countByStore = (store: StoreId) =>
    allProducts.filter((p) => p.store === store).length;

  const isStoreConnected = (store: StoreId) =>
    linkedAccounts.find((a) => a.store === store)?.connected ?? false;

  return (
    <aside
      aria-label="Filtros avanzados del catálogo"
      className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 dark:border-slate-800">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Filtros avanzados</h2>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RotateCcw className="h-3 w-3" />
          Limpiar
        </button>
      </div>

      {/* Categoría */}
      <div className="mt-4">
        <label htmlFor="filter-category" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Categoría
        </label>
        <select
          id="filter-category"
          value={filters.category}
          onChange={(e) => onChange({ ...filters, category: e.target.value })}
          className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-800"
        >
          <option value="all">Todas las categorías</option>
          {categoryOptions.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Ordenar por precio */}
      <div className="mt-4">
        <label htmlFor="filter-sort" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Ordenar por precio
        </label>
        <select
          id="filter-sort"
          value={filters.sortBy}
          onChange={(e) => onChange({ ...filters, sortBy: e.target.value as SortOrder })}
          className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-800"
        >
          <option value="relevance">Relevancia</option>
          <option value="price_asc">Precio: de menor a mayor</option>
          <option value="price_desc">Precio: de mayor a menor</option>
        </select>
      </div>

      {/* Estado del producto */}
      <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
        <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Estado del producto
        </span>
        <div className="mt-2 grid grid-cols-1 gap-1.5" role="radiogroup" aria-label="Estado del producto">
          {(
            [
              { value: 'all', label: 'Todos los estados' },
              { value: 'new', label: 'Nuevo' },
              { value: 'secondhand', label: 'Segunda mano / Reacondicionado' },
            ] as { value: ConditionFilter; label: string }[]
          ).map((option) => {
            const active = filters.condition === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange({ ...filters, condition: option.value })}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white dark:bg-blue-600'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tiendas */}
      <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tiendas</span>
          <label className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.onlyConnectedStores}
              onChange={(e) =>
                onChange({ ...filters, onlyConnectedStores: e.target.checked })
              }
              className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-600 dark:border-slate-600 dark:bg-slate-800"
            />
            Solo conectadas
          </label>
        </div>

        <div className="mt-2.5 space-y-2">
          {ALL_STORES.map((store) => {
            const checked = filters.stores.includes(store);
            const connected = isStoreConnected(store);
            return (
              <label
                key={store}
                className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/70 cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleStore(store)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 dark:border-slate-600 dark:bg-slate-800"
                  />
                  <StoreLogoMark store={store} className="h-4 w-4" />
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                    {STORE_META[store].label}
                  </span>
                </span>
                <span
                  className={`tabular-price text-[11px] ${
                    connected
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-amber-700 dark:text-amber-400'
                  }`}
                >
                  {connected ? 'Sync' : 'Sin vincular'} · {countByStore(store)}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Rango de precios */}
      <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
        <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Rango de precios (€)
        </span>
        <div className="mt-2 grid grid-cols-2 gap-2.5">
          <div>
            <label htmlFor="filter-min-price" className="sr-only">
              Precio mínimo
            </label>
            <input
              id="filter-min-price"
              type="number"
              min={0}
              placeholder="Mín €"
              value={filters.minPrice}
              onChange={(e) => onChange({ ...filters, minPrice: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs tabular-price text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>
          <div>
            <label htmlFor="filter-max-price" className="sr-only">
              Precio máximo
            </label>
            <input
              id="filter-max-price"
              type="number"
              min={0}
              placeholder="Máx €"
              value={filters.maxPrice}
              onChange={(e) => onChange({ ...filters, maxPrice: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs tabular-price text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>
        </div>
      </div>

      {/* Filtro por modelo / marca exacta */}
      <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
        <label htmlFor="filter-brand-model" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Marca / Modelo exacto
        </label>
        <select
          id="filter-brand-model"
          value={filters.brandModel}
          onChange={(e) => onChange({ ...filters, brandModel: e.target.value })}
          className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="">Todos los modelos</option>
          {brandModelOptions.map((bm) => (
            <option key={bm} value={bm}>
              {bm}
            </option>
          ))}
        </select>
      </div>
    </aside>
  );
};
