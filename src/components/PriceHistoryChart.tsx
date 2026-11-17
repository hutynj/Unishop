import React, { useMemo, useState } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import type { PricePoint, Product } from '../types/unishop';
import { formatCurrency, STORE_META } from '../utils/commerce';

interface PriceHistoryChartProps {
  product: Product;
  comparableProducts?: Product[];
}

interface SeriesItem {
  id: string;
  label: string;
  color: string;
  points: PricePoint[];
}

export const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({
  product,
  comparableProducts = [],
}) => {
  const otherMatches = useMemo(
    () =>
      comparableProducts.filter(
        (p) =>
          p.id !== product.id &&
          p.brand.toLowerCase() === product.brand.toLowerCase() &&
          p.model.toLowerCase() === product.model.toLowerCase()
      ),
    [comparableProducts, product.id, product.brand, product.model]
  );

  const [comparePlatforms, setComparePlatforms] = useState(otherMatches.length > 0);
  const [hoveredPoint, setHoveredPoint] = useState<{
    seriesLabel: string;
    color: string;
    point: PricePoint;
  } | null>(null);

  const seriesList: SeriesItem[] = useMemo(() => {
    const primary: SeriesItem = {
      id: product.id,
      label: STORE_META[product.store].label,
      color: STORE_META[product.store].accentHex,
      points: product.priceHistory,
    };

    if (!comparePlatforms || otherMatches.length === 0) {
      return [primary];
    }

    const others: SeriesItem[] = otherMatches.map((other) => ({
      id: other.id,
      label: `${STORE_META[other.store].label} (${other.condition === 'new' ? 'Nuevo' : '2ª mano/Reac.'})`,
      color: STORE_META[other.store].accentHex,
      points: other.priceHistory,
    }));

    return [primary, ...others];
  }, [product, comparePlatforms, otherMatches]);

  const allPoints = useMemo(
    () => seriesList.flatMap((s) => s.points),
    [seriesList]
  );

  const stats = useMemo(() => {
    const prices = product.priceHistory.map((p) => p.price);
    const minPrice = Math.min(...prices, product.price);
    const maxPrice = Math.max(...prices, product.price);
    const firstPrice = prices[0] ?? product.price;
    const diffPct = firstPrice > 0 ? ((product.price - firstPrice) / firstPrice) * 100 : 0;
    return { minPrice, maxPrice, diffPct };
  }, [product]);

  // SVG dimensions
  const width = 560;
  const height = 220;
  const padLeft = 56;
  const padRight = 18;
  const padTop = 18;
  const padBottom = 34;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const minY = useMemo(() => {
    const rawMin = Math.min(...allPoints.map((p) => p.price));
    return Math.max(0, Math.floor(rawMin * 0.9));
  }, [allPoints]);

  const maxY = useMemo(() => {
    const rawMax = Math.max(...allPoints.map((p) => p.price));
    return Math.ceil(rawMax * 1.08);
  }, [allPoints]);

  const maxLen = Math.max(...seriesList.map((s) => s.points.length), 2);

  const getX = (index: number, len: number) => {
    const denom = Math.max(len - 1, 1);
    return padLeft + (index / denom) * plotW;
  };

  const getY = (price: number) => {
    const span = Math.max(maxY - minY, 1);
    const ratio = (price - minY) / span;
    return padTop + plotH - ratio * plotH;
  };

  const yTicks = useMemo(() => {
    const steps = 4;
    const arr: number[] = [];
    for (let i = 0; i <= steps; i++) {
      arr.push(minY + ((maxY - minY) * i) / steps);
    }
    return arr;
  }, [minY, maxY]);

  const primaryPoints = product.priceHistory;
  const xLabelIndices = useMemo(() => {
    if (primaryPoints.length <= 4) {
      return primaryPoints.map((_, idx) => idx);
    }
    return [
      0,
      Math.floor((primaryPoints.length - 1) / 2),
      primaryPoints.length - 1,
    ];
  }, [primaryPoints]);

  return (
    <div
      data-testid="price-history-chart"
      className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/60"
    >
      {/* Header & Platform Comparison Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Historial de Fluctuación de Precios
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Evolución de los últimos {product.priceHistory.length} registros
          </p>
        </div>

        {otherMatches.length > 0 && (
          <div className="inline-flex rounded-lg bg-slate-200/70 p-0.5 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setComparePlatforms(false)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                !comparePlatforms
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              Esta tienda
            </button>
            <button
              type="button"
              onClick={() => setComparePlatforms(true)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                comparePlatforms
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              Comparar ({otherMatches.length + 1} tiendas)
            </button>
          </div>
        )}
      </div>

      {/* KPI Metrics Row */}
      <div className="mt-3 grid grid-cols-3 gap-2 border-y border-slate-200/80 py-2.5 text-xs dark:border-slate-800">
        <div>
          <span className="text-slate-500 dark:text-slate-400">Mínimo</span>
          <p className="tabular-price font-mono font-bold text-emerald-700 dark:text-emerald-400">
            {formatCurrency(stats.minPrice)}
          </p>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">Máximo</span>
          <p className="tabular-price font-mono font-bold text-slate-900 dark:text-slate-100">
            {formatCurrency(stats.maxPrice)}
          </p>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">Variación</span>
          <p
            className={`inline-flex items-center gap-1 tabular-price font-mono font-bold ${
              stats.diffPct <= 0
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-amber-700 dark:text-amber-400'
            }`}
          >
            {stats.diffPct <= 0 ? (
              <TrendingDown className="h-3.5 w-3.5" />
            ) : (
              <TrendingUp className="h-3.5 w-3.5" />
            )}
            {stats.diffPct > 0 ? `+${stats.diffPct.toFixed(1)}%` : `${stats.diffPct.toFixed(1)}%`}
          </p>
        </div>
      </div>

      {/* Hover / Active Point Readout */}
      <div className="mt-2.5 flex min-h-[1.25rem] items-center justify-between text-xs">
        {hoveredPoint ? (
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: hoveredPoint.color }}
            />
            <span className="font-semibold">{hoveredPoint.seriesLabel}:</span>
            <span className="tabular-price font-mono font-bold">
              {formatCurrency(hoveredPoint.point.price)}
            </span>
            <span className="text-slate-400">({hoveredPoint.point.date})</span>
          </div>
        ) : (
          <span className="text-slate-400 dark:text-slate-500">
            Pasa el ratón por cualquier punto para ver fecha y precio exacto
          </span>
        )}
      </div>

      {/* Interactive SVG Line Chart */}
      <div className="mt-1 w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`Gráfica de historial de precios de ${product.title}`}
          className="h-52 w-full select-none"
        >
          {/* Horizontal Grid Lines & Y-Axis Labels */}
          {yTicks.map((tick, idx) => {
            const y = getY(tick);
            return (
              <g key={idx}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  className="stroke-slate-200 dark:stroke-slate-800"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 font-mono text-[10px] dark:fill-slate-500"
                >
                  {Math.round(tick)}€
                </text>
              </g>
            );
          })}

          {/* X-Axis Date Labels */}
          {xLabelIndices.map((idx) => {
            const pt = primaryPoints[idx];
            if (!pt) return null;
            const x = getX(idx, primaryPoints.length);
            return (
              <text
                key={`${pt.date}-${idx}`}
                x={x}
                y={height - 10}
                textAnchor={idx === 0 ? 'start' : idx === primaryPoints.length - 1 ? 'end' : 'middle'}
                className="fill-slate-400 font-mono text-[10px] dark:fill-slate-500"
              >
                {pt.date.slice(5)}
              </text>
            );
          })}

          {/* Series Polylines & Data Points */}
          {seriesList.map((series) => {
            const coords = series.points.map((pt, idx) => ({
              x: getX(idx, Math.max(series.points.length, maxLen === series.points.length ? maxLen : series.points.length)),
              y: getY(pt.price),
              pt,
            }));

            const pathD = coords
              .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
              .join(' ');

            return (
              <g key={series.id}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={series.color}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {coords.map((c, idx) => (
                  <g key={`${series.id}-${idx}`}>
                    <circle
                      cx={c.x}
                      cy={c.y}
                      r={4.2}
                      fill={series.color}
                      className="stroke-white dark:stroke-slate-900 cursor-pointer"
                      strokeWidth={1.5}
                      onMouseEnter={() =>
                        setHoveredPoint({
                          seriesLabel: series.label,
                          color: series.color,
                          point: c.pt,
                        })
                      }
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  </g>
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Series Legend */}
      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs">
        {seriesList.map((series) => (
          <div key={series.id} className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: series.color }}
            />
            <span className="font-medium">{series.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
