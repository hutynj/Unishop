import React, { useMemo, useState } from 'react';
import { Activity, Award, TrendingDown } from 'lucide-react';
import type { Product } from '../types/unishop';
import {
  COMPARISON_COLORS,
  computeValueComparisonMetrics,
  getHistoricalPriceStats,
  isTechnicalComparison,
  PERFORMANCE_METRIC_META,
} from '../utils/comparison';
import { formatCurrency, STORE_META } from '../utils/commerce';

interface ComparisonChartsProps {
  products: Product[];
}

export const ComparisonCharts: React.FC<ComparisonChartsProps> = ({ products }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const isTechnical = useMemo(() => isTechnicalComparison(products), [products]);

  // Overlaid Price History geometry
  const priceSeries = useMemo(
    () =>
      products.map((product, idx) => ({
        product,
        color: COMPARISON_COLORS[idx % COMPARISON_COLORS.length],
        points: product.priceHistory ?? [],
        stats: getHistoricalPriceStats(product),
      })),
    [products]
  );

  const allPriceValues = useMemo(
    () => priceSeries.flatMap((s) => s.points.map((pt) => pt.price)),
    [priceSeries]
  );

  const minPriceY = useMemo(() => {
    if (allPriceValues.length === 0) return 0;
    return Math.max(0, Math.floor(Math.min(...allPriceValues) * 0.9));
  }, [allPriceValues]);

  const maxPriceY = useMemo(() => {
    if (allPriceValues.length === 0) return 100;
    return Math.ceil(Math.max(...allPriceValues) * 1.06);
  }, [allPriceValues]);

  const maxPointsCount = Math.max(...priceSeries.map((s) => s.points.length), 2);
  const primaryPoints = priceSeries[0]?.points ?? [];

  // Line chart SVG constants
  const lineW = 580;
  const lineH = 190;
  const padL = 58;
  const padR = 20;
  const padT = 14;
  const padB = 28;
  const plotW = lineW - padL - padR;
  const plotH = lineH - padT - padB;

  const getLineX = (index: number, total: number) => {
    const denom = Math.max(total - 1, 1);
    return padL + (index / denom) * plotW;
  };

  const getLineY = (price: number) => {
    const span = Math.max(maxPriceY - minPriceY, 1);
    const ratio = (price - minPriceY) / span;
    return padT + plotH - ratio * plotH;
  };

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) =>
    Math.round(minPriceY + (maxPriceY - minPriceY) * t)
  );

  // Radar chart geometry (5 axes, 0-100)
  const radarSize = 270;
  const radarCx = radarSize / 2;
  const radarCy = radarSize / 2;
  const radarRadius = 86;
  const axesCount = PERFORMANCE_METRIC_META.length;

  const getRadarCoord = (axisIndex: number, score: number) => {
    const angle = -Math.PI / 2 + (axisIndex * 2 * Math.PI) / axesCount;
    const r = (Math.max(0, Math.min(100, score)) / 100) * radarRadius;
    return {
      x: radarCx + r * Math.cos(angle),
      y: radarCy + r * Math.sin(angle),
    };
  };

  const valueRows = useMemo(() => computeValueComparisonMetrics(products), [products]);

  const activeHoverDate =
    hoveredIdx !== null && primaryPoints[hoveredIdx]
      ? primaryPoints[hoveredIdx].date
      : null;

  return (
    <div className="space-y-6">
      {/* Shared Color Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-xs dark:border-slate-800 dark:bg-slate-950/60">
        {priceSeries.map(({ product, color }) => (
          <div key={product.id} className="flex items-center gap-2 min-w-0">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: color }}
              aria-hidden="true"
            />
            <span className="max-w-[200px] truncate font-semibold text-slate-800 dark:text-slate-200">
              {product.brand} {product.model}
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              ({STORE_META[product.store].label})
            </span>
          </div>
        ))}
      </div>

      {/* 1. Overlaid Price Fluctuation Chart */}
      <section
        aria-label="Gráfica superpuesta de fluctuación de precios"
        className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-slate-100">
              <TrendingDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Fluctuación Superpuesta de Precios
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Comparativa temporal del historial de precios entre los artículos seleccionados
            </p>
          </div>
          {activeHoverDate && (
            <span className="tabular-price font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
              Fecha: {activeHoverDate}
            </span>
          )}
        </div>

        {/* Hover Readout Strip */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 min-h-[22px] text-xs">
          {hoveredIdx !== null ? (
            priceSeries.map(({ product, color, points }) => {
              const pt = points[hoveredIdx] ?? points[points.length - 1];
              if (!pt) return null;
              return (
                <span key={product.id} className="inline-flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: color }}
                    aria-hidden="true"
                  />
                  <span className="text-slate-600 dark:text-slate-300">
                    {product.brand} {product.model}:
                  </span>
                  <strong className="tabular-price font-mono text-slate-950 dark:text-white">
                    {formatCurrency(pt.price)}
                  </strong>
                </span>
              );
            })
          ) : (
            <span className="text-slate-400 dark:text-slate-500">
              Pasa el ratón por cualquier punto de la gráfica para comparar precios por fecha
            </span>
          )}
        </div>

        <div className="mt-2 overflow-x-auto">
          <svg
            data-testid="comparison-price-chart"
            viewBox={`0 0 ${lineW} ${lineH}`}
            className="w-full min-w-[440px] select-none"
            role="img"
            aria-label="Gráfica superpuesta de precios históricos"
          >
            {yTicks.map((tick) => {
              const y = getLineY(tick);
              return (
                <g key={tick}>
                  <line
                    x1={padL}
                    y1={y}
                    x2={lineW - padR}
                    y2={y}
                    stroke="currentColor"
                    className="text-slate-200 dark:text-slate-800"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={padL - 8}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-slate-400 font-mono text-[10px] dark:fill-slate-500"
                  >
                    {tick}€
                  </text>
                </g>
              );
            })}

            {/* Vertical hover guideline */}
            {hoveredIdx !== null && (
              <line
                x1={getLineX(hoveredIdx, maxPointsCount)}
                y1={padT}
                x2={getLineX(hoveredIdx, maxPointsCount)}
                y2={lineH - padB}
                stroke="currentColor"
                className="text-slate-300 dark:text-slate-700"
                strokeWidth="1"
              />
            )}

            {/* Series paths & points */}
            {priceSeries.map(({ product, color, points }) => {
              if (points.length === 0) return null;
              const d = points
                .map((pt, idx) => {
                  const x = getLineX(idx, points.length);
                  const y = getLineY(pt.price);
                  return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                })
                .join(' ');

              return (
                <g key={product.id}>
                  <path
                    d={d}
                    fill="none"
                    stroke={color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {points.map((pt, idx) => {
                    const cx = getLineX(idx, points.length);
                    const cy = getLineY(pt.price);
                    const isHovered = hoveredIdx === idx;
                    return (
                      <circle
                        key={`${product.id}-${pt.date}-${idx}`}
                        cx={cx}
                        cy={cy}
                        r={isHovered ? 5 : 3.5}
                        fill={color}
                        stroke="white"
                        strokeWidth="1.5"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredIdx(idx)}
                        onMouseLeave={() => setHoveredIdx(null)}
                      />
                    );
                  })}
                </g>
              );
            })}

            {/* X-axis dates */}
            {primaryPoints.map((pt, idx) => {
              const showLabel =
                idx === 0 ||
                idx === primaryPoints.length - 1 ||
                idx === Math.floor(primaryPoints.length / 2);
              if (!showLabel) return null;
              const x = getLineX(idx, primaryPoints.length);
              return (
                <text
                  key={`${pt.date}-${idx}`}
                  x={x}
                  y={lineH - 8}
                  textAnchor="middle"
                  className="fill-slate-400 font-mono text-[10px] dark:fill-slate-500"
                >
                  {pt.date.slice(5)}
                </text>
              );
            })}
          </svg>
        </div>
      </section>

      {/* 2. Conditional Performance / Quality-Price Benchmark */}
      {isTechnical ? (
        <section
          data-testid="comparison-benchmark-radar"
          aria-label="Gráfica comparativa de rendimiento técnico"
          className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="mb-4">
            <h3 className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-slate-100">
              <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Benchmark de Rendimiento Técnico (0–100)
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Comparativa normalizada en potencia, autonomía, portabilidad, relación calidad-precio y acabado
            </p>
          </div>

          <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-12">
            {/* Radar SVG */}
            <div className="flex justify-center md:col-span-5">
              <svg
                viewBox={`0 0 ${radarSize} ${radarSize}`}
                className="h-64 w-64 select-none"
                role="img"
                aria-label="Gráfica radar de métricas técnicas"
              >
                {/* Concentric pentagon rings */}
                {[25, 50, 75, 100].map((level) => {
                  const pts = PERFORMANCE_METRIC_META.map((_, i) => {
                    const c = getRadarCoord(i, level);
                    return `${c.x.toFixed(1)},${c.y.toFixed(1)}`;
                  }).join(' ');
                  return (
                    <polygon
                      key={level}
                      points={pts}
                      fill="none"
                      stroke="currentColor"
                      className="text-slate-200 dark:text-slate-800"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Spokes + Axis Labels */}
                {PERFORMANCE_METRIC_META.map((axis, i) => {
                  const edge = getRadarCoord(i, 100);
                  const labelPos = getRadarCoord(i, 122);
                  return (
                    <g key={axis.key}>
                      <line
                        x1={radarCx}
                        y1={radarCy}
                        x2={edge.x}
                        y2={edge.y}
                        stroke="currentColor"
                        className="text-slate-200 dark:text-slate-800"
                        strokeWidth="1"
                      />
                      <text
                        x={labelPos.x}
                        y={labelPos.y + 3}
                        textAnchor="middle"
                        className="fill-slate-600 text-[10px] font-semibold dark:fill-slate-400"
                      >
                        {axis.shortLabel}
                      </text>
                    </g>
                  );
                })}

                {/* Product Polygons */}
                {products.map((product, idx) => {
                  const color = COMPARISON_COLORS[idx % COMPARISON_COLORS.length];
                  const polygonPoints = PERFORMANCE_METRIC_META.map((axis, i) => {
                    const val = product.performanceMetrics?.[axis.key] ?? 75;
                    const c = getRadarCoord(i, val);
                    return `${c.x.toFixed(1)},${c.y.toFixed(1)}`;
                  }).join(' ');

                  return (
                    <polygon
                      key={product.id}
                      points={polygonPoints}
                      fill={color}
                      fillOpacity={0.14}
                      stroke={color}
                      strokeWidth="2"
                    />
                  );
                })}
              </svg>
            </div>

            {/* Grouped Metric Breakdown Bars */}
            <div className="space-y-3 md:col-span-7">
              {PERFORMANCE_METRIC_META.map((axis) => (
                <div key={axis.key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span>{axis.label}</span>
                  </div>
                  <div className="space-y-1">
                    {products.map((product, idx) => {
                      const color = COMPARISON_COLORS[idx % COMPARISON_COLORS.length];
                      const val = product.performanceMetrics?.[axis.key] ?? 75;
                      return (
                        <div key={`${product.id}-${axis.key}`} className="flex items-center gap-2">
                          <span className="w-28 truncate text-[11px] text-slate-500 dark:text-slate-400">
                            {product.brand} {product.model}
                          </span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{ width: `${val}%`, backgroundColor: color }}
                            />
                          </div>
                          <span className="tabular-price font-mono w-9 text-right text-[11px] font-bold text-slate-800 dark:text-slate-200">
                            {val}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section
          data-testid="comparison-value-chart"
          aria-label="Comparativa de relación calidad, precio y valoraciones"
          className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="mb-4">
            <h3 className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-slate-100">
              <Award className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Relación Calidad / Precio / Valoraciones
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Comparativa visual basada en calidad-precio, valoración de usuarios, volumen de reseñas y ahorro vs PVP
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(
              [
                {
                  title: 'Calidad / Precio (0–100)',
                  getScore: (r: (typeof valueRows)[number]) => r.calidadPrecioScore,
                  getLabel: (r: (typeof valueRows)[number]) => `${r.calidadPrecioScore}/100`,
                },
                {
                  title: 'Valoración Media (★)',
                  getScore: (r: (typeof valueRows)[number]) => r.ratingScore,
                  getLabel: (_r: (typeof valueRows)[number], p: Product) =>
                    `${p.rating.toFixed(1)} ★`,
                },
                {
                  title: 'Popularidad (Reseñas)',
                  getScore: (r: (typeof valueRows)[number]) => r.popularityScore,
                  getLabel: (_r: (typeof valueRows)[number], p: Product) =>
                    `${p.reviewCount.toLocaleString('es-ES')}`,
                },
                {
                  title: 'Ahorro vs PVP Original',
                  getScore: (r: (typeof valueRows)[number]) => r.savingsScore,
                  getLabel: (r: (typeof valueRows)[number]) => `-${r.discountPct}%`,
                },
              ] as const
            ).map((metric) => (
              <div
                key={metric.title}
                className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/50"
              >
                <p className="mb-2.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  {metric.title}
                </p>
                <div className="space-y-2">
                  {products.map((product, idx) => {
                    const row = valueRows[idx];
                    const color = COMPARISON_COLORS[idx % COMPARISON_COLORS.length];
                    const score = metric.getScore(row);
                    return (
                      <div key={`${metric.title}-${product.id}`} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                            {product.brand} {product.model}
                          </span>
                          <span className="tabular-price font-mono font-bold text-slate-900 dark:text-slate-100 shrink-0">
                            {metric.getLabel(row, product)}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${score}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
