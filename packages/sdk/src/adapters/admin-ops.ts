import type { MarketplaceApiClient, MarketplaceComponents } from '../client';

export type AdminCustomer = MarketplaceComponents['schemas']['AdminCustomer'];
export type AdminOpsOrder = MarketplaceComponents['schemas']['AdminOrder'];
export type AdminOverview = MarketplaceComponents['schemas']['AdminOverview'];
export type AdminStudioSnapshot = MarketplaceComponents['schemas']['AdminStudioSnapshot'];
export type CreateAdminPayoutInput = MarketplaceComponents['schemas']['CreateAdminPayoutRequest'];
export type CreateAdminRefundInput = MarketplaceComponents['schemas']['CreateAdminRefundRequest'];
export type PayoutRecord = MarketplaceComponents['schemas']['PayoutRecord'];
export type RefundRecord = MarketplaceComponents['schemas']['RefundRecord'];
export type UpdateAdminOrderInput = MarketplaceComponents['schemas']['UpdateAdminOrderRequest'];
export type UpdatePayoutStatusInput = MarketplaceComponents['schemas']['UpdatePayoutStatusRequest'];
export type UpdateRefundStatusInput = MarketplaceComponents['schemas']['UpdateRefundStatusRequest'];

export async function fetchAdminOverview(client: MarketplaceApiClient, platformId: string): Promise<AdminOverview> {
  const result = await client.GET('/admin/overview', {
    params: {
      query: {
        platform_id: platformId,
      },
    },
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load admin overview');
  }

  return result.data.data;
}

export async function fetchAdminCustomers(
  client: MarketplaceApiClient,
  platformId: string,
): Promise<{ customers: AdminCustomer[] }> {
  const result = await client.GET('/admin/customers', {
    params: {
      query: {
        platform_id: platformId,
      },
    },
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load admin customers');
  }

  return {
    customers: result.data.data.customers ?? [],
  };
}

export async function fetchAdminOrders(
  client: MarketplaceApiClient,
  platformId: string,
): Promise<{ orders: AdminOpsOrder[] }> {
  const result = await client.GET('/admin/orders', {
    params: {
      query: {
        platform_id: platformId,
      },
    },
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load admin orders');
  }

  return {
    orders: result.data.data.orders ?? [],
  };
}

export async function updateAdminOrder(
  client: MarketplaceApiClient,
  orderId: string,
  input: UpdateAdminOrderInput,
): Promise<AdminOpsOrder> {
  const result = await client.POST('/admin/orders/{order_id}/status', {
    params: {
      path: {
        order_id: orderId,
      },
    },
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to update admin order');
  }

  return result.data.data;
}

export async function fetchAdminRefunds(
  client: MarketplaceApiClient,
  platformId: string,
): Promise<{ refunds: RefundRecord[] }> {
  const result = await client.GET('/admin/refunds', {
    params: {
      query: {
        platform_id: platformId,
      },
    },
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load admin refunds');
  }

  return {
    refunds: result.data.data.refunds ?? [],
  };
}

export async function createAdminRefund(
  client: MarketplaceApiClient,
  input: CreateAdminRefundInput,
): Promise<RefundRecord> {
  const result = await client.POST('/admin/refunds', {
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to create admin refund');
  }

  return result.data.data;
}

export async function updateAdminRefund(
  client: MarketplaceApiClient,
  refundId: string,
  input: UpdateRefundStatusInput,
): Promise<RefundRecord> {
  const result = await client.POST('/admin/refunds/{refund_id}/status', {
    params: {
      path: {
        refund_id: refundId,
      },
    },
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to update admin refund');
  }

  return result.data.data;
}

export async function fetchAdminPayouts(
  client: MarketplaceApiClient,
  platformId: string,
): Promise<{ payouts: PayoutRecord[] }> {
  const result = await client.GET('/admin/payouts', {
    params: {
      query: {
        platform_id: platformId,
      },
    },
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load admin payouts');
  }

  return {
    payouts: result.data.data.payouts ?? [],
  };
}

export async function createAdminPayout(
  client: MarketplaceApiClient,
  input: CreateAdminPayoutInput,
): Promise<PayoutRecord> {
  const result = await client.POST('/admin/payouts', {
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to create admin payout');
  }

  return result.data.data;
}

export async function updateAdminPayout(
  client: MarketplaceApiClient,
  payoutId: string,
  input: UpdatePayoutStatusInput,
): Promise<PayoutRecord> {
  const result = await client.POST('/admin/payouts/{payout_id}/status', {
    params: {
      path: {
        payout_id: payoutId,
      },
    },
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to update admin payout');
  }

  return result.data.data;
}

export async function fetchAdminStudio(client: MarketplaceApiClient, platformId: string): Promise<AdminStudioSnapshot> {
  const result = await client.GET('/admin/studio', {
    params: {
      query: {
        platform_id: platformId,
      },
    },
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load admin studio snapshot');
  }

  return result.data.data;
}
