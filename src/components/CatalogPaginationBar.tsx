import React from 'react';
import { ChevronLeft, ChevronRight, Layers } from 'lucide-react';

interface CatalogPaginationBarProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
  onShowAllPages: () => void;
}

export const CatalogPaginationBar: React.FC<CatalogPaginationBarProps> = ({
  currentPage,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  onPageChange,
  onShowAllPages,
}) => {
  if (totalPages <= 1) return null;

  const pageNumbers = Array.from({ length: totalPages }, (_, idx) => idx + 1);

  return (
    <nav
      data-testid="catalog-pagination"
      aria-label="Paginación del catálogo"
      className="mt-7 flex flex-col items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row dark:border-slate-800 dark:bg-slate-900"
    >
      <p className="tabular-price text-xs text-slate-600 dark:text-slate-400">
        Mostrando <strong className="text-slate-900 dark:text-slate-100">{startIndex}–{endIndex}</strong> de{' '}
        <strong className="text-slate-900 dark:text-slate-100">{totalItems}</strong> productos · Página{' '}
        <span className="font-semibold text-slate-900 dark:text-slate-100">{currentPage}</span> de{' '}
        <span className="font-semibold text-slate-900 dark:text-slate-100">{totalPages}</span>
      </p>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Página anterior"
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        {pageNumbers.map((page) => {
          const isActive = page === currentPage;
          return (
            <button
              key={page}
              type="button"
              data-testid={`pagination-page-${page}`}
              aria-label={`Ir a la página ${page}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onPageChange(page)}
              className={`tabular-price inline-flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2.5 text-xs font-semibold transition-colors cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-blue-600'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {page}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Página siguiente"
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
        >
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          data-testid="pagination-show-all-btn"
          onClick={onShowAllPages}
          className="ml-1 inline-flex h-8 items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-800/70 dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-900/50 whitespace-nowrap cursor-pointer"
        >
          <Layers className="h-3.5 w-3.5" />
          Ver todas ({totalItems})
        </button>
      </div>
    </nav>
  );
};
