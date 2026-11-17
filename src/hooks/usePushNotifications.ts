import { useCallback, useEffect, useState } from 'react';
import type { PushNotificationState, PushPermissionStatus } from '../types/unishop';
import {
  dispatchNativePushNotification,
  getPushPermissionStatus,
  isPushNotificationSupported,
  requestPushPermission,
} from '../services/notificationService';

const PUSH_ENABLED_KEY = 'unishop_push_enabled_v1';

function readInitialEnabled(): boolean {
  try {
    const stored = window.localStorage.getItem(PUSH_ENABLED_KEY);
    return stored === null ? true : stored === 'true';
  } catch {
    return true;
  }
}

export interface PriceDropPushParams {
  productId: string;
  productTitle: string;
  previousPrice: number;
  newPrice: number;
  platformLabel: string;
  imageUrl: string;
  onFocusProduct: (productId: string) => void;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>(() => ({
    supported: isPushNotificationSupported(),
    permission: getPushPermissionStatus(),
    enabled: readInitialEnabled(),
    lastSentAt: null,
    lastProductTitle: null,
  }));

  useEffect(() => {
    try {
      window.localStorage.setItem(PUSH_ENABLED_KEY, String(state.enabled));
    } catch {
      // Ignore storage errors
    }
  }, [state.enabled]);

  // Keep permission state synced if user changes browser permissions externally
  useEffect(() => {
    const syncPermission = () => {
      setState((prev) => ({
        ...prev,
        supported: isPushNotificationSupported(),
        permission: getPushPermissionStatus(),
      }));
    };
    window.addEventListener('focus', syncPermission);
    return () => window.removeEventListener('focus', syncPermission);
  }, []);

  const requestPermission = useCallback(async (): Promise<PushPermissionStatus> => {
    const permission = await requestPushPermission();
    setState((prev) => ({
      ...prev,
      supported: isPushNotificationSupported(),
      permission,
      enabled: permission === 'granted' ? true : prev.enabled,
    }));
    return permission;
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    setState((prev) => ({ ...prev, enabled }));
  }, []);

  const sendPriceDropPush = useCallback(
    (params: PriceDropPushParams): boolean => {
      const currentPermission = getPushPermissionStatus();
      if (!state.enabled || currentPermission !== 'granted') {
        return false;
      }

      const formatEuro = (val: number) =>
        new Intl.NumberFormat('es-ES', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 2,
        }).format(val);

      const delivered = dispatchNativePushNotification({
        title: `¡Bajada de precio! ${params.productTitle}`,
        body: `De ${formatEuro(params.previousPrice)} a ${formatEuro(params.newPrice)} en ${params.platformLabel}. Haz clic para ver detalles.`,
        icon: params.imageUrl,
        tag: `unishop-drop-${params.productId}`,
        onClick: () => params.onFocusProduct(params.productId),
      });

      if (delivered) {
        setState((prev) => ({
          ...prev,
          permission: currentPermission,
          lastSentAt: new Date().toISOString(),
          lastProductTitle: params.productTitle,
        }));
      }

      return delivered;
    },
    [state.enabled]
  );

  return {
    pushState: state,
    requestPermission,
    setEnabled,
    sendPriceDropPush,
  };
}
