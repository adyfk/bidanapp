'use client';

import type {
  AppointmentActionInput,
  AppointmentCommand,
  AppointmentReadModel,
  CreateAppointmentChangeRequestInput,
  CreateAppointmentInput,
  CreatePaymentRequestInput,
} from '@bidanapp/sdk';
import {
  approveAppointment,
  cancelCustomerAppointment,
  cancelProfessionalAppointment,
  completeAppointment,
  completeTestPaymentRequest,
  createAppointmentChangeRequest,
  createAppointmentPaymentRequest,
  createBidanappApiClient,
  createCustomerAppointment,
  fetchCustomerAppointments,
  fetchProfessionalAppointments,
  rejectAppointment,
  startAppointmentService,
} from '@bidanapp/sdk';
import { getBackendApiBaseUrl } from '@/lib/backend';

const client = createBidanappApiClient(getBackendApiBaseUrl());
const requestTimeoutMs = 3000;

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number) =>
  new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => reject(new Error('Appointment action timed out')), timeoutMs);

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

const ensureBrowser = () => {
  if (typeof window === 'undefined') {
    throw new Error('Appointment action is only available in the browser.');
  }
};

export const createCustomerAppointmentWithApi = async (input: CreateAppointmentInput): Promise<AppointmentCommand> => {
  ensureBrowser();
  return withTimeout(createCustomerAppointment(client, input), requestTimeoutMs);
};

export const fetchCustomerAppointmentsWithApi = async (): Promise<AppointmentReadModel> => {
  ensureBrowser();
  return withTimeout(fetchCustomerAppointments(client), requestTimeoutMs);
};

export const fetchProfessionalAppointmentsWithApi = async (): Promise<AppointmentReadModel> => {
  ensureBrowser();
  return withTimeout(fetchProfessionalAppointments(client), requestTimeoutMs);
};

export const approveAppointmentWithApi = async (
  appointmentId: string,
  input: AppointmentActionInput,
): Promise<AppointmentCommand> => {
  ensureBrowser();
  return withTimeout(approveAppointment(client, appointmentId, input), requestTimeoutMs);
};

export const rejectAppointmentWithApi = async (
  appointmentId: string,
  input: AppointmentActionInput,
): Promise<AppointmentCommand> => {
  ensureBrowser();
  return withTimeout(rejectAppointment(client, appointmentId, input), requestTimeoutMs);
};

export const cancelCustomerAppointmentWithApi = async (
  appointmentId: string,
  input: AppointmentActionInput,
): Promise<AppointmentCommand> => {
  ensureBrowser();
  return withTimeout(cancelCustomerAppointment(client, appointmentId, input), requestTimeoutMs);
};

export const cancelProfessionalAppointmentWithApi = async (
  appointmentId: string,
  input: AppointmentActionInput,
): Promise<AppointmentCommand> => {
  ensureBrowser();
  return withTimeout(cancelProfessionalAppointment(client, appointmentId, input), requestTimeoutMs);
};

export const createAppointmentPaymentRequestWithApi = async (
  appointmentId: string,
  input: CreatePaymentRequestInput,
): Promise<AppointmentCommand> => {
  ensureBrowser();
  return withTimeout(createAppointmentPaymentRequest(client, appointmentId, input), requestTimeoutMs);
};

export const completeTestPaymentRequestWithApi = async (paymentRequestId: string): Promise<AppointmentCommand> => {
  ensureBrowser();
  return withTimeout(completeTestPaymentRequest(client, paymentRequestId), requestTimeoutMs);
};

export const startAppointmentServiceWithApi = async (
  appointmentId: string,
  input: AppointmentActionInput,
): Promise<AppointmentCommand> => {
  ensureBrowser();
  return withTimeout(startAppointmentService(client, appointmentId, input), requestTimeoutMs);
};

export const completeAppointmentWithApi = async (
  appointmentId: string,
  input: AppointmentActionInput,
): Promise<AppointmentCommand> => {
  ensureBrowser();
  return withTimeout(completeAppointment(client, appointmentId, input), requestTimeoutMs);
};

export const createAppointmentChangeRequestWithApi = async (
  appointmentId: string,
  input: CreateAppointmentChangeRequestInput,
): Promise<AppointmentCommand> => {
  ensureBrowser();
  return withTimeout(createAppointmentChangeRequest(client, appointmentId, input), requestTimeoutMs);
};
