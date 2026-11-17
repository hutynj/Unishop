import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import type { Product } from '../types/unishop';

interface AiAnalysisResult {
  bestPickId: string;
  bestPickTitle: string;
  summary: string;
  tips: string[];
  poweredBy: string;
}

interface AiAssistantBarProps {
  visibleProducts: Product[];
  query: string;
  onHighlightProduct: (productId: string | null) => void;
}

export const AiAssistantBar: React.FC<AiAssistantBarProps> = ({
  visibleProducts,
  query,
  onHighlightProduct,
}) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AiAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    if (visibleProducts.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: visibleProducts,
          query,
        }),
      });
      if (!res.ok) {
        throw new Error('No se pudo analizar las ofertas visibles.');
      }
      const data = (await res.json()) as AiAnalysisResult;
      setAnalysis(data);
      onHighlightProduct(data.bestPickId);
    } catch {
      setError('No se pudo completar la comparativa en este momento.');
    } finally {
      setLoading(false);
    }
  };

  const closeAnalysis = () => {
    setAnalysis(null);
    setError(null);
    onHighlightProduct(null);
  };

  if (visibleProducts.length === 0) return null;

  return (
    <div className="mb-5">
      {!analysis ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              Comparador Inteligente:
            </span>{' '}
            Analiza precio total con envío, estado y plazo de entrega entre las{' '}
            <span className="tabular-price font-semibold text-slate-900 dark:text-slate-100">
              {visibleProducts.length}
            </span>{' '}
            ofertas visibles.
          </div>
          <button
            type="button"
            onClick={runAnalysis}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-60 dark:border-blue-800/70 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900/60 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {loading ? 'Analizando ofertas...' : 'Comparar ofertas'}
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 dark:border-blue-800/70 dark:bg-blue-950/30">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-blue-800 dark:text-blue-300">
                Recomendación destacada: {analysis.bestPickTitle}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                {analysis.summary}
              </p>
              {analysis.tips.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                  {analysis.tips.map((tip, idx) => (
                    <li key={idx}>• {tip}</li>
                  ))}
                </ul>
              )}
            </div>
            <button
              type="button"
              onClick={closeAnalysis}
              aria-label="Cerrar análisis comparativo"
              className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
};
