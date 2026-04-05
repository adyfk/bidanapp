'use client';

import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useEffect } from 'react';
import {
  customerPushReceivedEventName,
  dispatchCustomerPushMessage,
  shouldEnableCustomerPushOnPath,
  syncCustomerPushSubscription,
} from '@/lib/customer-push';
import { useCustomerAuthSession } from '@/lib/use-customer-auth-session';

export const CustomerPushBootstrap = () => {
  const locale = useLocale();
  const pathname = usePathname();
  const customerAuth = useCustomerAuthSession();

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    void navigator.serviceWorker.register('/sw.js').catch(() => {
      // The app still works without push; keep registration best effort.
    });

    const handleMessage = (event: MessageEvent<{ payload?: unknown; type?: string }>) => {
      if (event.data?.type !== 'bidanapp:push-received' && event.data?.type !== 'bidanapp:push-clicked') {
        return;
      }

      dispatchCustomerPushMessage(event.data?.payload ?? null);
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  useEffect(() => {
    if (
      !customerAuth.hasHydrated ||
      !customerAuth.isAuthenticated ||
      !customerAuth.session.consumerId ||
      !shouldEnableCustomerPushOnPath(pathname)
    ) {
      return;
    }

    void syncCustomerPushSubscription(locale).catch(() => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(customerPushReceivedEventName, { detail: null }));
      }
    });
  }, [customerAuth.hasHydrated, customerAuth.isAuthenticated, customerAuth.session.consumerId, locale, pathname]);

  return null;
};
