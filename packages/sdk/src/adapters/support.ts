import type { MarketplaceApiClient, MarketplaceComponents } from '../client';

export type CreateSupportTicketInput = MarketplaceComponents['schemas']['CreateSupportTicketRequest'];
export type SupportTicket = MarketplaceComponents['schemas']['SupportTicket'];
export type TriageSupportTicketInput = MarketplaceComponents['schemas']['TriageSupportTicketRequest'];

export async function fetchViewerSupportTickets(
  client: MarketplaceApiClient,
  platformId: string,
): Promise<{ tickets: SupportTicket[] }> {
  const result = await client.GET('/support/tickets', {
    params: {
      query: {
        platform_id: platformId,
      },
    },
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load viewer support tickets');
  }

  return {
    tickets: result.data.data.tickets ?? [],
  };
}

export async function createViewerSupportTicket(
  client: MarketplaceApiClient,
  input: CreateSupportTicketInput,
): Promise<SupportTicket> {
  const result = await client.POST('/support/tickets', {
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to create viewer support ticket');
  }

  return result.data.data;
}

export async function fetchViewerSupportTicket(client: MarketplaceApiClient, ticketId: string): Promise<SupportTicket> {
  const result = await client.GET('/support/tickets/{ticket_id}', {
    params: {
      path: {
        ticket_id: ticketId,
      },
    },
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load viewer support ticket');
  }

  return result.data.data;
}

export async function fetchAdminSupportTickets(
  client: MarketplaceApiClient,
  platformId: string,
): Promise<{ tickets: SupportTicket[] }> {
  const result = await client.GET('/admin/support/tickets', {
    params: {
      query: {
        platform_id: platformId,
      },
    },
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load admin support tickets');
  }

  return {
    tickets: result.data.data.tickets ?? [],
  };
}

export async function triageAdminSupportTicket(
  client: MarketplaceApiClient,
  ticketId: string,
  input: TriageSupportTicketInput,
): Promise<SupportTicket> {
  const result = await client.POST('/admin/support/tickets/{ticket_id}/triage', {
    params: {
      path: {
        ticket_id: ticketId,
      },
    },
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to triage admin support ticket');
  }

  return result.data.data;
}
