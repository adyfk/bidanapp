import type { BidanappApiClient, BidanappComponents } from '../client';

export type AppointmentRecordUpsertInput = BidanappComponents['schemas']['AppointmentRecordUpsertData'];
export type AppointmentDepartInput = BidanappComponents['schemas']['AppointmentDepartInputData'];
export type AppointmentHomeVisitStatus = BidanappComponents['schemas']['AppointmentHomeVisitStatusData'];
export type ProfessionalPortalRequestsState = BidanappComponents['schemas']['ProfessionalPortalRequestsData'];
export type AppointmentActionInput = BidanappComponents['schemas']['AppointmentActionInputData'];
export type AppointmentCommand = BidanappComponents['schemas']['AppointmentCommandData'];
export type CreateAppointmentInput = BidanappComponents['schemas']['CreateAppointmentInputData'];
export type CreateAppointmentChangeRequestInput = BidanappComponents['schemas']['CreateChangeRequestInputData'];
export type CreatePaymentRequestInput = BidanappComponents['schemas']['CreatePaymentRequestInputData'];

export async function upsertAppointmentRecord(
  client: BidanappApiClient,
  appointmentId: string,
  input: AppointmentRecordUpsertInput,
): Promise<ProfessionalPortalRequestsState> {
  const result = await client.PUT('/appointments/{appointment_id}', {
    params: {
      path: {
        appointment_id: appointmentId,
      },
    },
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to upsert appointment record');
  }

  return result.data.data;
}

export async function departHomeVisitAppointment(
  client: BidanappApiClient,
  appointmentId: string,
  input: AppointmentDepartInput,
): Promise<AppointmentHomeVisitStatus> {
  const result = await client.POST('/appointments/{appointment_id}/depart', {
    body: input,
    params: {
      path: {
        appointment_id: appointmentId,
      },
    },
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to mark home-visit appointment as departed');
  }

  return result.data.data;
}

export async function fetchCustomerAppointmentHomeVisitStatus(
  client: BidanappApiClient,
  appointmentId: string,
): Promise<AppointmentHomeVisitStatus> {
  const result = await client.GET('/customers/appointments/{appointment_id}/home-visit-status', {
    params: {
      path: {
        appointment_id: appointmentId,
      },
    },
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load customer home-visit status');
  }

  return result.data.data;
}

export async function fetchProfessionalAppointmentHomeVisitStatus(
  client: BidanappApiClient,
  appointmentId: string,
): Promise<AppointmentHomeVisitStatus> {
  const result = await client.GET('/professionals/appointments/{appointment_id}/home-visit-status', {
    params: {
      path: {
        appointment_id: appointmentId,
      },
    },
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load professional home-visit status');
  }

  return result.data.data;
}

export async function fetchCustomerAppointments(
  client: BidanappApiClient,
): Promise<BidanappComponents['schemas']['AppointmentData']> {
  const result = await client.GET('/customers/appointments', {});

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load customer appointments');
  }

  return result.data.data;
}

export async function fetchProfessionalAppointments(
  client: BidanappApiClient,
): Promise<BidanappComponents['schemas']['AppointmentData']> {
  const result = await client.GET('/professionals/appointments', {});

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load professional appointments');
  }

  return result.data.data;
}

export async function createCustomerAppointment(
  client: BidanappApiClient,
  input: CreateAppointmentInput,
): Promise<AppointmentCommand> {
  const result = await client.POST('/customers/appointments', {
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to create customer appointment');
  }

  return result.data.data;
}

export async function approveAppointment(
  client: BidanappApiClient,
  appointmentId: string,
  input: AppointmentActionInput,
): Promise<AppointmentCommand> {
  const result = await client.POST('/professionals/appointments/{appointment_id}/approve', {
    body: input,
    params: {
      path: {
        appointment_id: appointmentId,
      },
    },
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to approve appointment');
  }

  return result.data.data;
}

export async function rejectAppointment(
  client: BidanappApiClient,
  appointmentId: string,
  input: AppointmentActionInput,
): Promise<AppointmentCommand> {
  const result = await client.POST('/professionals/appointments/{appointment_id}/reject', {
    body: input,
    params: {
      path: {
        appointment_id: appointmentId,
      },
    },
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to reject appointment');
  }

  return result.data.data;
}

export async function cancelProfessionalAppointment(
  client: BidanappApiClient,
  appointmentId: string,
  input: AppointmentActionInput,
): Promise<AppointmentCommand> {
  const result = await client.POST('/professionals/appointments/{appointment_id}/cancel', {
    body: input,
    params: {
      path: {
        appointment_id: appointmentId,
      },
    },
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to cancel appointment as professional');
  }

  return result.data.data;
}

export async function cancelCustomerAppointment(
  client: BidanappApiClient,
  appointmentId: string,
  input: AppointmentActionInput,
): Promise<AppointmentCommand> {
  const result = await client.POST('/customers/appointments/{appointment_id}/cancel', {
    body: input,
    params: {
      path: {
        appointment_id: appointmentId,
      },
    },
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to cancel appointment');
  }

  return result.data.data;
}

export async function createAppointmentPaymentRequest(
  client: BidanappApiClient,
  appointmentId: string,
  input: CreatePaymentRequestInput,
): Promise<AppointmentCommand> {
  const result = await client.POST('/customers/appointments/{appointment_id}/payment-requests', {
    body: input,
    params: {
      path: {
        appointment_id: appointmentId,
      },
    },
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to create appointment payment request');
  }

  return result.data.data;
}

export async function completeTestPaymentRequest(
  client: BidanappApiClient,
  paymentRequestId: string,
): Promise<AppointmentCommand> {
  const result = await client.POST('/customers/payments/requests/{payment_request_id}/complete-test', {
    params: {
      path: {
        payment_request_id: paymentRequestId,
      },
    },
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to complete test payment request');
  }

  return result.data.data;
}

export async function startAppointmentService(
  client: BidanappApiClient,
  appointmentId: string,
  input: AppointmentActionInput,
): Promise<AppointmentCommand> {
  const result = await client.POST('/professionals/appointments/{appointment_id}/start-service', {
    body: input,
    params: {
      path: {
        appointment_id: appointmentId,
      },
    },
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to start appointment service');
  }

  return result.data.data;
}

export async function completeAppointment(
  client: BidanappApiClient,
  appointmentId: string,
  input: AppointmentActionInput,
): Promise<AppointmentCommand> {
  const result = await client.POST('/professionals/appointments/{appointment_id}/complete', {
    body: input,
    params: {
      path: {
        appointment_id: appointmentId,
      },
    },
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to complete appointment');
  }

  return result.data.data;
}

export async function createAppointmentChangeRequest(
  client: BidanappApiClient,
  appointmentId: string,
  input: CreateAppointmentChangeRequestInput,
): Promise<AppointmentCommand> {
  const result = await client.POST('/appointments/{appointment_id}/change-requests', {
    body: input,
    params: {
      path: {
        appointment_id: appointmentId,
      },
    },
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to create appointment change request');
  }

  return result.data.data;
}
