import {
  type AdminAuthCreateSessionInput,
  type AdminAuthSession,
  type AdminAuthSessionUpdateInput,
  type AdminCustomer,
  type AdminOpsOrder,
  type AdminOverview,
  type AdminStudioSnapshot,
  type CreateAdminPayoutInput,
  type CreateAdminRefundInput,
  createAdminAuthSession,
  createAdminPayout,
  createAdminRefund,
  deleteAdminAuthSession,
  fetchAdminAuthSession,
  fetchAdminCustomers,
  fetchAdminOrders,
  fetchAdminOverview,
  fetchAdminPayouts,
  fetchAdminRefunds,
  fetchAdminStudio,
  fetchAdminSupportTickets,
  fetchPlatformProfessionalApplications,
  type PayoutRecord,
  type ProfessionalApplicationReviewItem,
  type RefundRecord,
  type ReviewProfessionalApplicationInput,
  reviewPlatformProfessionalApplication,
  triageAdminSupportTicket,
  type UpdateAdminOrderInput,
  type UpdatePayoutStatusInput,
  type UpdateRefundStatusInput,
  updateAdminOrder,
  updateAdminPayout,
  updateAdminRefund,
} from '@marketplace/sdk';

export interface AdminConsoleController {
  createPayout: typeof createAdminPayout;
  createRefund: typeof createAdminRefund;
  deleteSession: typeof deleteAdminAuthSession;
  fetchCustomers: typeof fetchAdminCustomers;
  fetchSession: typeof fetchAdminAuthSession;
  fetchOverview: typeof fetchAdminOverview;
  fetchOrders: typeof fetchAdminOrders;
  fetchPayouts: typeof fetchAdminPayouts;
  fetchProfessionals: typeof fetchPlatformProfessionalApplications;
  fetchRefunds: typeof fetchAdminRefunds;
  fetchSupport: typeof fetchAdminSupportTickets;
  fetchStudio: typeof fetchAdminStudio;
  reviewProfessional: typeof reviewPlatformProfessionalApplication;
  triageSupport: typeof triageAdminSupportTicket;
  updateOrder: typeof updateAdminOrder;
  updatePayout: typeof updateAdminPayout;
  updateRefund: typeof updateAdminRefund;
}

export interface AdminQueueSnapshot {
  customerCount: number;
  orderCount: number;
  payoutCount: number;
  pendingApplications: number;
  refundCount: number;
  supportCount: number;
}

export function mapAdminQueueSnapshot(input: {
  customers?: AdminCustomer[];
  orders?: AdminOpsOrder[];
  payouts?: PayoutRecord[];
  professionals?: ProfessionalApplicationReviewItem[];
  refunds?: RefundRecord[];
  support?: Array<{ id: string }>;
}): AdminQueueSnapshot {
  return {
    customerCount: input.customers?.length ?? 0,
    orderCount: input.orders?.length ?? 0,
    payoutCount: input.payouts?.length ?? 0,
    pendingApplications:
      input.professionals?.filter((item) => item.reviewStatus === 'pending_review' || item.reviewStatus === 'submitted')
        .length ?? 0,
    refundCount: input.refunds?.length ?? 0,
    supportCount: input.support?.length ?? 0,
  };
}

export function createAdminConsoleController(): AdminConsoleController {
  return {
    createPayout: createAdminPayout,
    createRefund: createAdminRefund,
    deleteSession: deleteAdminAuthSession,
    fetchCustomers: fetchAdminCustomers,
    fetchOrders: fetchAdminOrders,
    fetchOverview: fetchAdminOverview,
    fetchPayouts: fetchAdminPayouts,
    fetchProfessionals: fetchPlatformProfessionalApplications,
    fetchRefunds: fetchAdminRefunds,
    fetchSession: fetchAdminAuthSession,
    fetchStudio: fetchAdminStudio,
    fetchSupport: fetchAdminSupportTickets,
    reviewProfessional: reviewPlatformProfessionalApplication,
    triageSupport: triageAdminSupportTicket,
    updateOrder: updateAdminOrder,
    updatePayout: updateAdminPayout,
    updateRefund: updateAdminRefund,
  };
}

export type {
  AdminAuthCreateSessionInput,
  AdminAuthSession,
  AdminAuthSessionUpdateInput,
  AdminCustomer,
  AdminOpsOrder,
  AdminOverview,
  AdminStudioSnapshot,
  CreateAdminPayoutInput,
  CreateAdminRefundInput,
  PayoutRecord,
  ProfessionalApplicationReviewItem,
  RefundRecord,
  ReviewProfessionalApplicationInput,
  UpdateAdminOrderInput,
  UpdatePayoutStatusInput,
  UpdateRefundStatusInput,
};
export {
  createAdminAuthSession,
  createAdminPayout,
  createAdminRefund,
  deleteAdminAuthSession,
  fetchAdminAuthSession,
  fetchAdminCustomers,
  fetchAdminOrders,
  fetchAdminOverview,
  fetchAdminPayouts,
  fetchAdminRefunds,
  fetchAdminStudio,
  fetchAdminSupportTickets,
  fetchPlatformProfessionalApplications,
  reviewPlatformProfessionalApplication,
  triageAdminSupportTicket,
  updateAdminOrder,
  updateAdminPayout,
  updateAdminRefund,
};
