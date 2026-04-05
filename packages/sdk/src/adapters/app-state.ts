import type { BidanappApiClient, BidanappComponents } from '../client';

export type ViewerSessionState = BidanappComponents['schemas']['ViewerSessionData'];
export type CustomerNotificationState = BidanappComponents['schemas']['CustomerNotificationStateData'];
export type CustomerPushSubscriptionState = BidanappComponents['schemas']['CustomerPushSubscriptionData'];
export type ProfessionalNotificationState = BidanappComponents['schemas']['ProfessionalNotificationStateData'];
export type ConsumerPreferencesState = BidanappComponents['schemas']['ConsumerPreferencesData'];
export type AdminSessionState = BidanappComponents['schemas']['AdminSessionData'];
export type SupportTicketCreateInput = BidanappComponents['schemas']['CreateSupportTicketData'];
export type SupportDeskState = BidanappComponents['schemas']['SupportDeskData'];
export type SupportTicketsState = BidanappComponents['schemas']['SupportTicketsData'];
export type AdminConsoleState = BidanappComponents['schemas']['AdminConsoleData'];
export type AdminConsoleTableState = BidanappComponents['schemas']['AdminConsoleTableData'];
export type AdminConsoleTableInput = BidanappComponents['schemas']['AdminConsoleTableUpsertData'];

const adminConsoleTablePath = (tableName: string) => ({
  params: {
    path: {
      table_name: tableName,
    },
  },
});

const professionalQueryParams = (professionalId?: string) => ({
  params: {
    query: professionalId ? { professional_id: professionalId } : {},
  },
});

const consumerPreferencesQueryParams = (consumerId?: string) => ({
  params: {
    ...(consumerId
      ? {
          query: {
            consumer_id: consumerId,
          },
        }
      : {}),
  },
});

export async function fetchViewerSessionState(client: BidanappApiClient): Promise<ViewerSessionState> {
  const result = await client.GET('/viewer/session');

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load viewer session state');
  }

  return result.data.data;
}

export async function saveViewerSessionState(
  client: BidanappApiClient,
  input: ViewerSessionState,
): Promise<ViewerSessionState> {
  const result = await client.PUT('/viewer/session', {
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to persist viewer session state');
  }

  return result.data.data;
}

export async function fetchCustomerNotificationState(client: BidanappApiClient): Promise<CustomerNotificationState> {
  const result = await client.GET('/notifications/customer');

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load customer notification state');
  }

  return result.data.data;
}

export async function saveCustomerNotificationState(
  client: BidanappApiClient,
  input: CustomerNotificationState,
): Promise<CustomerNotificationState> {
  const result = await client.PUT('/notifications/customer', {
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to persist customer notification state');
  }

  return result.data.data;
}

export async function saveCustomerPushSubscriptionState(
  client: BidanappApiClient,
  input: CustomerPushSubscriptionState,
): Promise<CustomerPushSubscriptionState> {
  const result = await client.PUT('/notifications/customer/push-subscription', {
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to persist customer push subscription');
  }

  return result.data.data;
}

export async function deleteCustomerPushSubscriptionState(
  client: BidanappApiClient,
  input: CustomerPushSubscriptionState,
): Promise<void> {
  const result = await client.DELETE('/notifications/customer/push-subscription', {
    body: input,
  });

  if (result.error) {
    throw new Error('Failed to delete customer push subscription');
  }
}

export async function fetchProfessionalNotificationState(
  client: BidanappApiClient,
  professionalId?: string,
): Promise<ProfessionalNotificationState> {
  const result = await client.GET('/notifications/professional', professionalQueryParams(professionalId));

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load professional notification state');
  }

  return result.data.data;
}

export async function saveProfessionalNotificationState(
  client: BidanappApiClient,
  input: ProfessionalNotificationState,
  professionalId?: string,
): Promise<ProfessionalNotificationState> {
  const result = await client.PUT('/notifications/professional', {
    ...professionalQueryParams(professionalId),
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to persist professional notification state');
  }

  return result.data.data;
}

export async function fetchConsumerPreferencesState(
  client: BidanappApiClient,
  consumerId?: string,
): Promise<ConsumerPreferencesState> {
  const result = await client.GET('/consumers/preferences', consumerPreferencesQueryParams(consumerId));

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load consumer preferences state');
  }

  return result.data.data;
}

export async function saveConsumerPreferencesState(
  client: BidanappApiClient,
  input: ConsumerPreferencesState,
  consumerId?: string,
): Promise<ConsumerPreferencesState> {
  const result = await client.PUT('/consumers/preferences', {
    ...consumerPreferencesQueryParams(consumerId),
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to persist consumer preferences state');
  }

  return result.data.data;
}

export async function fetchAdminSessionState(client: BidanappApiClient): Promise<AdminSessionState> {
  const result = await client.GET('/admin/session');

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load admin session state');
  }

  return result.data.data;
}

export async function saveAdminSessionState(
  client: BidanappApiClient,
  input: AdminSessionState,
): Promise<AdminSessionState> {
  const result = await client.PUT('/admin/session', {
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to persist admin session state');
  }

  return result.data.data;
}

export async function fetchCustomerSupportTicketsState(client: BidanappApiClient): Promise<SupportTicketsState> {
  const result = await client.GET('/customers/support/tickets');

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load customer support tickets');
  }

  return result.data.data;
}

export async function createCustomerSupportTicketState(client: BidanappApiClient, input: SupportTicketCreateInput) {
  const result = await client.POST('/customers/support/tickets', {
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to create customer support ticket');
  }

  return result.data.data;
}

export async function fetchProfessionalSupportTicketsState(client: BidanappApiClient): Promise<SupportTicketsState> {
  const result = await client.GET('/professionals/support/tickets');

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load professional support tickets');
  }

  return result.data.data;
}

export async function createProfessionalSupportTicketState(client: BidanappApiClient, input: SupportTicketCreateInput) {
  const result = await client.POST('/professionals/support/tickets', {
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to create professional support ticket');
  }

  return result.data.data;
}

export async function fetchSupportDeskState(client: BidanappApiClient): Promise<SupportDeskState> {
  const result = await client.GET('/admin/support-desk');

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load support desk state');
  }

  return result.data.data;
}

export async function saveSupportDeskState(
  client: BidanappApiClient,
  input: SupportDeskState,
): Promise<SupportDeskState> {
  const result = await client.PUT('/admin/support-desk', {
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to persist support desk state');
  }

  return result.data.data;
}

export async function fetchAdminConsoleState(client: BidanappApiClient): Promise<AdminConsoleState> {
  const result = await client.GET('/admin/console');

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load admin console state');
  }

  return result.data.data;
}

export async function saveAdminConsoleState(
  client: BidanappApiClient,
  input: AdminConsoleState,
): Promise<AdminConsoleState> {
  const result = await client.PUT('/admin/console', {
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to persist admin console state');
  }

  return result.data.data;
}

export async function fetchAdminConsoleTableState(
  client: BidanappApiClient,
  tableName: string,
): Promise<AdminConsoleTableState> {
  const result = await client.GET('/admin/console/tables/{table_name}', adminConsoleTablePath(tableName));

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load admin console table state');
  }

  return result.data.data;
}

export async function saveAdminConsoleTableState(
  client: BidanappApiClient,
  tableName: string,
  input: AdminConsoleTableInput,
): Promise<AdminConsoleTableState> {
  const result = await client.PUT('/admin/console/tables/{table_name}', {
    ...adminConsoleTablePath(tableName),
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to persist admin console table state');
  }

  return result.data.data;
}
