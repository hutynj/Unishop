import React from 'react';
import { Bookmark, Play, Trash2 } from 'lucide-react';
import type { SavedSearch } from '../types/unishop';
import { STORE_META } from '../utils/commerce';

interface SavedSearchesPanelProps {
  searches: SavedSearch[];
  onApplySearch: (saved: SavedSearch) => void;
  onDeleteSearch: (id: string) => void;
}

export const SavedSearchesPanel: React.FC<SavedSearchesPanelProps> = ({
  searches,
  onApplySearch,
  onDeleteSearch,
}) => {
  return (
    <section aria-labelledby="saved-searches-heading" className="space-y-6">
      <div className="border-b border-slate-200 pb-5 dark:border-slate-800">
        <h1
          id="saved-searches-heading"
          className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
        >
          Búsquedas Guardadas y Alertas
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Reactiva tus combinaciones de filtros y plataformas en un clic (`busquedas_guardadas`).
        </p>
      </div>

      {searches.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <Bookmark className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
          <h2 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">
            No tienes búsquedas guardadas
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Aplica tus filtros favoritos en el catálogo y pulsa «Guardar búsqueda» para monitorizar precios.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {searches.map((saved) => (
            <div
              key={saved.id}
              className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {saved.name}
                </h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    Tiendas: {saved.filters.stores.map((s) => STORE_META[s].label).join(', ')}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    Estado:{' '}
                    {saved.filters.condition === 'all'
                      ? 'Todos'
                      : saved.filters.condition === 'new'
                        ? 'Nuevo'
                        : 'Segunda mano / Reacondicionado'}
                  </span>
                  {(saved.filters.minPrice || saved.filters.maxPrice) && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-price">
                        Precio: {saved.filters.minPrice || '0'}€ – {saved.filters.maxPrice || '∞'}€
                      </span>
                    </>
                  )}
                  <span aria-hidden="true">·</span>
                  <span className="tabular-price">{saved.resultCount} resultados</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onApplySearch(saved)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 whitespace-nowrap cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5" />
                  Ejecutar búsqueda
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteSearch(saved.id)}
                  aria-label={`Eliminar búsqueda guardada ${saved.name}`}
                  className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-slate-700 dark:text-slate-400 dark:hover:border-red-800 dark:hover:bg-red-950/50 dark:hover:text-red-400 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
