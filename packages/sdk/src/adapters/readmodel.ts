import type { BidanappApiClient, BidanappComponents } from '../client';

export type CatalogReadModel = BidanappComponents['schemas']['CatalogData'];
export type AppointmentReadModel = BidanappComponents['schemas']['AppointmentData'];

export async function fetchCatalogReadModel(client: BidanappApiClient): Promise<CatalogReadModel> {
  const result = await client.GET('/catalog');

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load catalog read model');
  }

  return result.data.data;
}

export async function fetchAppointmentReadModel(client: BidanappApiClient): Promise<AppointmentReadModel> {
  const result = await client.GET('/appointments');

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load appointment read model');
  }

  return result.data.data;
}
