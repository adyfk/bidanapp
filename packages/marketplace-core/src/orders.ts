import {
  type CreateOrderPaymentSessionInput,
  type CreatePlatformOrderInput,
  type CustomerPlatformOrder,
  createOrderPaymentSession,
  createPlatformOrder,
  fetchCustomerPlatformOrder,
  fetchCustomerPlatformOrders,
  fetchPlatformOfferings,
  type OrderPaymentSession,
  type PaymentWebhookInput,
  type PlatformOffering,
  postPaymentWebhook,
} from '@marketplace/sdk';
import { orderStatusLabel, paymentStatusLabel } from './formatters';

export interface OrderTimelineVM {
  createdAtLabel: string;
  id: string;
  paymentStatusLabel: string;
  statusLabel: string;
  title: string;
}

export interface OrderFlowController {
  createOrder: typeof createPlatformOrder;
  createPaymentSession: typeof createOrderPaymentSession;
  fetchOrder: typeof fetchCustomerPlatformOrder;
  fetchOrders: typeof fetchCustomerPlatformOrders;
  fetchOfferings: typeof fetchPlatformOfferings;
  settlePayment: typeof postPaymentWebhook;
}

export function mapOrderToTimelineVM(order: CustomerPlatformOrder, locale: string): OrderTimelineVM {
  return {
    createdAtLabel: locale === 'en' ? 'Recent order' : 'Order terbaru',
    id: order.id,
    paymentStatusLabel: paymentStatusLabel(order.paymentStatus, locale),
    statusLabel: orderStatusLabel(order.status, locale),
    title: order.offeringTitle,
  };
}

export function createOrderFlowController(): OrderFlowController {
  return {
    createOrder: createPlatformOrder,
    createPaymentSession: createOrderPaymentSession,
    fetchOrder: fetchCustomerPlatformOrder,
    fetchOrders: fetchCustomerPlatformOrders,
    fetchOfferings: fetchPlatformOfferings,
    settlePayment: postPaymentWebhook,
  };
}

export type {
  CreateOrderPaymentSessionInput,
  CreatePlatformOrderInput,
  CustomerPlatformOrder,
  OrderPaymentSession,
  PaymentWebhookInput,
  PlatformOffering,
};
export {
  createOrderPaymentSession,
  createPlatformOrder,
  fetchCustomerPlatformOrder,
  fetchCustomerPlatformOrders,
  fetchPlatformOfferings,
  postPaymentWebhook,
};
