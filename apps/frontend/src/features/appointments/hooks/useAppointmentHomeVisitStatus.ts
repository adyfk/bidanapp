'use client';

import type { AppointmentHomeVisitStatus } from '@bidanapp/sdk';
import { useEffect, useState } from 'react';
import { loadCustomerHomeVisitStatusFromApi } from '@/lib/appointment-travel-api';
import { subscribeCustomerPushMessages } from '@/lib/customer-push';

const departedRefreshIntervalMs = 30_000;
const pendingDepartureRefreshIntervalMs = 5_000;

export const useAppointmentHomeVisitStatus = (appointmentId: string, enabled: boolean) => {
  const [status, setStatus] = useState<AppointmentHomeVisitStatus | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled || !appointmentId) {
      setStatus(null);
      setIsLoading(false);
      return;
    }

    let isDisposed = false;
    let intervalId = 0;
    const refreshIntervalMs = status?.hasDeparted ? departedRefreshIntervalMs : pendingDepartureRefreshIntervalMs;

    const sync = async () => {
      const nextStatus = await loadCustomerHomeVisitStatusFromApi(appointmentId);
      if (isDisposed) {
        return;
      }

      setStatus(nextStatus ?? null);
      setIsLoading(false);
    };

    setIsLoading(true);
    void sync();
    intervalId = window.setInterval(() => {
      void sync();
    }, refreshIntervalMs);

    const handleFocus = () => {
      void sync();
    };

    window.addEventListener('focus', handleFocus);
    const unsubscribePush = subscribeCustomerPushMessages(() => {
      void sync();
    });

    return () => {
      isDisposed = true;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      unsubscribePush();
    };
  }, [appointmentId, enabled, status?.hasDeparted]);

  return {
    isLoading,
    status,
  };
};
