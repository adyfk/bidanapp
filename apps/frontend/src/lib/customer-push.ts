'use client';

import {
  type CustomerPushSubscriptionState,
  createBidanappApiClient,
  deleteCustomerPushSubscriptionState,
  saveCustomerPushSubscriptionState,
} from '@bidanapp/sdk';
import { getBackendApiBaseUrl } from '@/lib/backend';
import { PUBLIC_ENV } from '@/lib/env';

export const customerPushReceivedEventName = 'bidanapp:push-received';

const promptStorageKey = 'bidanapp:customer-push-prompted';
const client = createBidanappApiClient(getBackendApiBaseUrl());

const isPushSupported = () =>
  typeof window !== 'undefined' &&
  window.isSecureContext &&
  'Notification' in window &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  Boolean(PUBLIC_ENV.webPushPublicKey);

const normalizeLocale = (locale: string) => (locale === 'en' ? 'en' : 'id');

export const shouldEnableCustomerPushOnPath = (pathname: string | null | undefined) => {
  const value = pathname ?? '';
  return value.includes('/appointments') || value.includes('/activity/') || value.includes('/notifications');
};

export const subscribeCustomerPushMessages = (listener: (payload: unknown) => void) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handler = (event: Event) => {
    listener((event as CustomEvent).detail);
  };
  window.addEventListener(customerPushReceivedEventName, handler);

  return () => {
    window.removeEventListener(customerPushReceivedEventName, handler);
  };
};

export const dispatchCustomerPushMessage = (payload: unknown) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent(customerPushReceivedEventName, { detail: payload }));
};

export const syncCustomerPushSubscription = async (locale: string) => {
  if (!isPushSupported()) {
    return undefined;
  }

  const permission = await ensureNotificationPermission();
  if (permission !== 'granted') {
    return undefined;
  }

  const registration = await navigator.serviceWorker.ready;
  const existingSubscription = await registration.pushManager.getSubscription();
  const subscription =
    existingSubscription ||
    (await registration.pushManager.subscribe({
      applicationServerKey: base64UrlToUint8Array(PUBLIC_ENV.webPushPublicKey),
      userVisibleOnly: true,
    }));

  const payload = serializeCustomerPushSubscription(subscription, normalizeLocale(locale));
  return await saveCustomerPushSubscriptionState(client, payload);
};

export const cleanupCustomerPushSubscription = async () => {
  if (!isPushSupported()) {
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    return;
  }

  try {
    await deleteCustomerPushSubscriptionState(client, serializeCustomerPushSubscription(subscription, 'id'));
  } catch {
    // best effort cleanup before logout
  }

  try {
    await subscription.unsubscribe();
  } catch {
    // best effort cleanup before logout
  }
};

async function ensureNotificationPermission() {
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }

  if (typeof window !== 'undefined' && window.localStorage.getItem(promptStorageKey) === '1') {
    return Notification.permission;
  }

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(promptStorageKey, '1');
  }

  return Notification.requestPermission();
}

function serializeCustomerPushSubscription(
  subscription: PushSubscription,
  locale: string,
): CustomerPushSubscriptionState {
  const json = subscription.toJSON();
  const auth = json.keys?.auth ?? '';
  const p256dh = json.keys?.p256dh ?? '';

  if (!json.endpoint || !auth || !p256dh) {
    throw new Error('Push subscription is missing required keys.');
  }

  return {
    endpoint: json.endpoint,
    keys: {
      auth,
      p256dh,
    },
    locale,
    userAgent: typeof navigator === 'undefined' ? '' : navigator.userAgent,
  };
}

function base64UrlToUint8Array(value: string) {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawValue = window.atob(base64);
  return Uint8Array.from(rawValue, (character) => character.charCodeAt(0));
}
