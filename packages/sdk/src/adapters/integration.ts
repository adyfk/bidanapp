import type { BidanappApiClient } from '../client';

export type IntegrationSnapshot = {
  chatThreadCount: number;
  healthSummary: string;
  professionalsCount: number;
};

export async function fetchBackendIntegrationSnapshot(client: BidanappApiClient): Promise<IntegrationSnapshot> {
  const [healthResult, professionalsResult, chatResult] = await Promise.all([
    client.GET('/health'),
    client.GET('/professionals'),
    client.GET('/chat'),
  ]);

  if (healthResult.error || professionalsResult.error || chatResult.error) {
    throw new Error('Failed to load integration snapshot');
  }

  const directThreads = chatResult.data?.data.directThreads ?? [];
  const appointmentThreads = chatResult.data?.data.appointmentThreads ?? [];

  return {
    healthSummary: `${healthResult.data?.data.status ?? 'unknown'} · ${healthResult.data?.data.service ?? 'api'} · ${
      healthResult.data?.data.version ?? 'n/a'
    }`,
    professionalsCount: professionalsResult.data?.data?.length ?? 0,
    chatThreadCount: directThreads.length + appointmentThreads.length,
  };
}
