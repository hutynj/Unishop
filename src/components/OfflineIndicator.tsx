import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-medium text-amber-900 shadow-md dark:border-amber-700/70 dark:bg-amber-950/90 dark:text-amber-200"
    >
      <WifiOff className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
      <span>Sin conexión — Mostrando catálogo en caché</span>
    </div>
  );
};
