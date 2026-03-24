import type { BidanappApiClient, BidanappComponents } from '../client';

export type AppointmentRecordUpsertInput = BidanappComponents['schemas']['AppointmentRecordUpsertData'];
export type ProfessionalPortalRequestsState = BidanappComponents['schemas']['ProfessionalPortalRequestsData'];

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
