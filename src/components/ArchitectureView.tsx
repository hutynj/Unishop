import React, { useState } from 'react';
import { Check, Copy, Database, GitFork, Layers, ShieldCheck } from 'lucide-react';
import schemaSql from '../../db/schema.sql?raw';

const ARCHITECTURE_LAYERS = [
  {
    index: '01',
    title: 'API Gateway & Orquestación Concurrente',
    description:
      'El endpoint /api/search recibe consulta, rango de precios y tiendas activas, y lanza un fan-out paralelo mediante Promise.allSettled con AbortController (timeout por tienda de 2.5s) para evitar bloqueos en la interfaz.',
    icon: GitFork,
  },
  {
    index: '02',
    title: 'Adaptadores Híbridos (APIs Oficiales + Extensión)',
    description:
      'Amazon (PA-API 5.0), eBay (Browse API) y AliExpress operan vía OAuth 2.0 oficial. Vinted y Wallapop sincronizan tokens cifrados AES-256-GCM mediante una extensión compañera y proxies rotativos que respetan rate limits.',
    icon: Layers,
  },
  {
    index: '03',
    title: 'Normalización Canónica y Caché TTL',
    description:
      'Cada adaptador mapea respuestas heterogéneas al DTO unificado Product (precio, envío, estado, marca, modelo). Redis cachea búsquedas repetidas 90s–300s reduciendo peticiones externas en >70%.',
    icon: Database,
  },
  {
    index: '04',
    title: 'Checkout Híbrido y Persistencia RLS',
    description:
      'Las tablas usuarios, cuentas_vinculadas, items_carrito y busquedas_guardadas están protegidas con Row Level Security en PostgreSQL/Supabase. Los pagos múltiples ejecutan el asistente guiado tienda a tienda.',
    icon: ShieldCheck,
  },
];

export const ArchitectureView: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(schemaSql);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section aria-labelledby="arch-heading" className="space-y-8">
      <div className="border-b border-slate-200 pb-5 dark:border-slate-800">
        <h1
          id="arch-heading"
          className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
        >
          Arquitectura del Sistema y Esquema SQL
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Diseño técnico del agregador concurrente multi-marketplace y modelo relacional PostgreSQL / Supabase.
        </p>
      </div>

      {/* 4 Architecture Layers */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {ARCHITECTURE_LAYERS.map((layer) => {
          const Icon = layer.icon;
          return (
            <div
              key={layer.index}
              className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-mono text-xs font-medium text-slate-400 dark:text-slate-500">
                    {layer.index}.
                  </span>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {layer.title}
                  </h2>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {layer.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* SQL Schema Deliverable */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-950/60">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Esquema PostgreSQL / Supabase (db/schema.sql)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tablas: usuarios · cuentas_vinculadas · items_carrito · busquedas_guardadas
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopySql}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 whitespace-nowrap cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                SQL copiado
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copiar esquema SQL
              </>
            )}
          </button>
        </div>
        <pre className="max-h-[420px] overflow-auto bg-slate-950 p-5 font-mono text-xs leading-relaxed text-slate-200">
          <code>{schemaSql}</code>
        </pre>
      </div>
    </section>
  );
};
