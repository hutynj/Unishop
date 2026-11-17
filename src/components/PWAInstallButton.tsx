import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Download className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
        Instalar PWA
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowGuide(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Smartphone className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
        Instalar App
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 dark:bg-black/70"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-guide-title"
        >
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <h3
                id="pwa-guide-title"
                className="text-base font-bold text-slate-900 dark:text-slate-100"
              >
                Instalar UniShop como App
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Cerrar guía de instalación"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {isIOS ? (
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                1. Pulsa el botón <strong>Compartir</strong> en la barra inferior de Safari.
                <br />
                2. Selecciona <strong>Añadir a pantalla de inicio</strong> para usar UniShop en modo independiente.
              </p>
            ) : (
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Abre el menú de tu navegador (Chrome, Edge o Safari) y selecciona{' '}
                <strong>Instalar UniShop</strong> o <strong>Añadir a pantalla de inicio</strong> para acceso directo sin conexión.
              </p>
            )}
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
