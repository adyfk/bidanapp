import type { MarketplaceApiClient, MarketplaceComponents } from '../client';

export type CreatePlatformOfferingInput = MarketplaceComponents['schemas']['CreatePlatformOfferingRequest'];
export type CreatePlatformOrderInput = MarketplaceComponents['schemas']['CreatePlatformOrderRequest'];
export type CreateOrderPaymentSessionInput = MarketplaceComponents['schemas']['CreateOrderPaymentSessionRequest'];
export type CustomerPlatformOrder = MarketplaceComponents['schemas']['CustomerPlatformOrder'];
export type OrderPaymentSession = MarketplaceComponents['schemas']['OrderPaymentSession'];
export type PaymentWebhookInput = MarketplaceComponents['schemas']['PaymentWebhookRequest'];
export type PlatformOffering = MarketplaceComponents['schemas']['PlatformOffering'];

export async function fetchPlatformOfferings(
  client: MarketplaceApiClient,
  platformId: string,
): Promise<{ offerings: PlatformOffering[] }> {
  const result = await client.GET('/platforms/{platform_id}/offerings', {
    params: {
      path: {
        platform_id: platformId,
      },
    },
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load platform offerings');
  }

  return {
    offerings: result.data.data.offerings ?? [],
  };
}

export async function fetchProfessionalPlatformOfferings(
  client: MarketplaceApiClient,
  platformId: string,
): Promise<{ offerings: PlatformOffering[] }> {
  const result = await client.GET('/platforms/{platform_id}/professionals/me/offerings', {
    params: {
      path: {
        platform_id: platformId,
      },
    },
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load professional offerings');
  }

  return {
    offerings: result.data.data.offerings ?? [],
  };
}

export async function createProfessionalPlatformOffering(
  client: MarketplaceApiClient,
  platformId: string,
  input: CreatePlatformOfferingInput,
): Promise<PlatformOffering> {
  const result = await client.POST('/platforms/{platform_id}/professionals/me/offerings', {
    params: {
      path: {
        platform_id: platformId,
      },
    },
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to create professional offering');
  }

  return result.data.data;
}

export async function fetchCustomerPlatformOrders(
  client: MarketplaceApiClient,
  platformId: string,
): Promise<{ orders: CustomerPlatformOrder[] }> {
  const result = await client.GET('/platforms/{platform_id}/customers/me/orders', {
    params: {
      path: {
        platform_id: platformId,
      },
    },
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load customer platform orders');
  }

  return {
    orders: result.data.data.orders ?? [],
  };
}

export async function fetchCustomerPlatformOrder(
  client: MarketplaceApiClient,
  platformId: string,
  orderId: string,
): Promise<CustomerPlatformOrder> {
  const result = await client.GET('/platforms/{platform_id}/customers/me/orders/{order_id}', {
    params: {
      path: {
        order_id: orderId,
        platform_id: platformId,
      },
    },
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to load customer platform order');
  }

  return result.data.data;
}

export async function createPlatformOrder(
  client: MarketplaceApiClient,
  platformId: string,
  input: CreatePlatformOrderInput,
): Promise<CustomerPlatformOrder> {
  const result = await client.POST('/platforms/{platform_id}/orders', {
    params: {
      path: {
        platform_id: platformId,
      },
    },
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to create platform order');
  }

  return result.data.data;
}

export async function createOrderPaymentSession(
  client: MarketplaceApiClient,
  orderId: string,
  input: CreateOrderPaymentSessionInput,
): Promise<OrderPaymentSession> {
  const result = await client.POST('/orders/{order_id}/payments/session', {
    params: {
      path: {
        order_id: orderId,
      },
    },
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to create order payment session');
  }

  return result.data.data;
}

export async function postPaymentWebhook(
  client: MarketplaceApiClient,
  provider: string,
  input: PaymentWebhookInput,
): Promise<OrderPaymentSession> {
  const result = await client.POST('/webhooks/payments/{provider}', {
    params: {
      path: {
        provider,
      },
    },
    body: input,
  });

  if (result.error || !result.data?.data) {
    throw new Error('Failed to post payment webhook');
  }

  return result.data.data;
}
