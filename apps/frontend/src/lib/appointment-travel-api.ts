'use client';

import type { AppointmentDepartInput, AppointmentHomeVisitStatus } from '@bidanapp/sdk';
import {
  createBidanappApiClient,
  departHomeVisitAppointment,
  fetchCustomerAppointmentHomeVisitStatus,
  fetchProfessionalAppointmentHomeVisitStatus,
} from '@bidanapp/sdk';
import { getBackendApiBaseUrl } from '@/lib/backend';

const client = createBidanappApiClient(getBackendApiBaseUrl());
const requestTimeoutMs = 2500;
const warnings = new Set<string>();

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number) =>
  new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => reject(new Error('Appointment travel request timed out')), timeoutMs);

    promise.then(
      (value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timeoutId);
        reject(error);
      },
    );
  });

const warnOnce = (message: string) => {
  if (typeof window === 'undefined' || warnings.has(message)) {
    return;
  }

  warnings.add(message);
  console.warn(message);
};

export const loadCustomerHomeVisitStatusFromApi = async (
  appointmentId: string,
): Promise<AppointmentHomeVisitStatus | undefined> => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  try {
    return await withTimeout(fetchCustomerAppointmentHomeVisitStatus(client, appointmentId), requestTimeoutMs);
  } catch {
    warnOnce('[Appointments] Failed to hydrate customer home-visit status from the backend.');
    return undefined;
  }
};

export const loadProfessionalHomeVisitStatusFromApi = async (
  appointmentId: string,
): Promise<AppointmentHomeVisitStatus | undefined> => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  try {
    return await withTimeout(fetchProfessionalAppointmentHomeVisitStatus(client, appointmentId), requestTimeoutMs);
  } catch {
    warnOnce('[Appointments] Failed to hydrate professional home-visit status from the backend.');
    return undefined;
  }
};

export const departHomeVisitAppointmentWithApi = async (
  appointmentId: string,
  input: AppointmentDepartInput,
): Promise<AppointmentHomeVisitStatus> => {
  if (typeof window === 'undefined') {
    throw new Error('Appointment travel is only available in the browser.');
  }

  return withTimeout(departHomeVisitAppointment(client, appointmentId, input), requestTimeoutMs);
};
