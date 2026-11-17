import type { PushPermissionStatus } from '../types/unishop';

export interface NativePushPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  onClick?: () => void;
}

export function isPushNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getPushPermissionStatus(): PushPermissionStatus {
  if (!isPushNotificationSupported()) {
    return 'unsupported';
  }
  return window.Notification.permission as PushPermissionStatus;
}

export async function requestPushPermission(): Promise<PushPermissionStatus> {
  if (!isPushNotificationSupported()) {
    return 'unsupported';
  }
  try {
    const result = await window.Notification.requestPermission();
    return result as PushPermissionStatus;
  } catch {
    return getPushPermissionStatus();
  }
}

export function dispatchNativePushNotification(payload: NativePushPayload): boolean {
  if (!isPushNotificationSupported()) {
    return false;
  }
  if (window.Notification.permission !== 'granted') {
    return false;
  }

  try {
    const notification = new window.Notification(payload.title, {
      body: payload.body,
      icon: payload.icon,
      tag: payload.tag,
    });

    notification.onclick = () => {
      if (typeof window.focus === 'function') {
        window.focus();
      }
      payload.onClick?.();
      notification.close();
    };

    return true;
  } catch {
    return false;
  }
}
