'use client';

import {
  type AdminAuthSession,
  type AdminCustomer,
  type AdminOpsOrder,
  type AdminOverview,
  type AdminQueueSnapshot,
  type AdminStudioSnapshot,
  createAdminAuthSession,
  createAdminPayout,
  createAdminRefund,
  createMarketplaceApiClient,
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
  reviewPlatformProfessionalApplication,
  type SupportTicket,
  triageAdminSupportTicket,
  updateAdminOrder,
  updateAdminPayout,
  updateAdminRefund,
} from '@marketplace/marketplace-core';
import {
  DEFAULT_SERVICE_PLATFORM_ID,
  getServicePlatformConfig,
  listServicePlatforms,
  type ServicePlatformId,
} from '@marketplace/platform-config';
import { MessageBanner, SurfaceCard } from '@marketplace/ui';
import { useEffect, useMemo, useState } from 'react';
import { getApiBaseUrl } from '../../lib/env';
import { type AdminConsoleSection, adminConsoleSections } from '../../screen-config/sections';
import { AdminDashboardHeader } from './parts/dashboard-header';
import { AdminLoginShell } from './parts/login-shell';
import { adminNavVisuals } from './parts/nav-link';
import { AdminSidebar } from './parts/sidebar';
import { CustomersSection } from './sections/customers';
import { OrdersSection } from './sections/orders';
import { OverviewSection } from './sections/overview';
import { PayoutsSection } from './sections/payouts';
import { ProfessionalsSection } from './sections/professionals';
import { RefundsSection } from './sections/refunds';
import { StudioSection } from './sections/studio';
import { SupportSection } from './sections/support';
import { formatAdminCurrency } from './utils';

const apiBaseUrl = getApiBaseUrl();
const client = createMarketplaceApiClient(apiBaseUrl);

const emptyOverview: AdminOverview & AdminQueueSnapshot = {
  activeOrders: 0,
  customerCount: 0,
  openSupportTickets: 0,
  orderCount: 0,
  payoutCount: 0,
  pendingApplications: 0,
  pendingPayouts: 0,
  refundCount: 0,
  supportCount: 0,
  pendingRefunds: 0,
  totalCustomers: 0,
  totalProfessionals: 0,
};

const emptyStudio: AdminStudioSnapshot = {
  grossRevenueAmount: 0,
  paidOrders: 0,
  pendingPayoutAmount: 0,
  pendingRefundAmount: 0,
  supportTickets: 0,
};

export function AdminLandingPage({ section = 'overview' }: { section?: AdminConsoleSection }) {
  const platforms = listServicePlatforms();
  const [session, setSession] = useState<AdminAuthSession | null>(null);
  const [selectedPlatformId, setSelectedPlatformId] = useState<ServicePlatformId>(
    platforms[0]?.id ?? DEFAULT_SERVICE_PLATFORM_ID,
  );
  const [applications, setApplications] = useState<ProfessionalApplicationReviewItem[]>([]);
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [orders, setOrders] = useState<AdminOpsOrder[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [refunds, setRefunds] = useState<RefundRecord[]>([]);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [overview, setOverview] = useState<AdminOverview>(emptyOverview);
  const [studio, setStudio] = useState<AdminStudioSnapshot>(emptyStudio);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [supportForms, setSupportForms] = useState<
    Record<string, { assignToAdminId: string; internalNote: string; publicNote: string; status: string }>
  >({});
  const [refundForm, setRefundForm] = useState({ amount: '0', orderId: '', paymentId: '', reason: '' });
  const [payoutForm, setPayoutForm] = useState({ amount: '0', professionalProfileId: '', provider: 'bank_transfer' });

  const selectedPlatform = useMemo(() => getServicePlatformConfig(selectedPlatformId), [selectedPlatformId]);
  const currentSection = useMemo(
    () => adminConsoleSections.find((item) => item.id === section) ?? adminConsoleSections[1],
    [section],
  );

  const loadSession = async () => {
    try {
      const payload = await fetchAdminAuthSession(client);
      setSession(payload);
      return payload;
    } catch {
      setSession(null);
      return null;
    }
  };

  const loadAll = async (platformId: ServicePlatformId) => {
    setLoading(true);
    try {
      const [
        applicationResult,
        customerResult,
        orderResult,
        supportResult,
        refundResult,
        payoutResult,
        overviewResult,
        studioResult,
      ] = await Promise.allSettled([
        fetchPlatformProfessionalApplications(client, platformId),
        fetchAdminCustomers(client, platformId),
        fetchAdminOrders(client, platformId),
        fetchAdminSupportTickets(client, platformId),
        fetchAdminRefunds(client, platformId),
        fetchAdminPayouts(client, platformId),
        fetchAdminOverview(client, platformId),
        fetchAdminStudio(client, platformId),
      ]);

      setApplications(applicationResult.status === 'fulfilled' ? applicationResult.value.applications : []);
      setCustomers(customerResult.status === 'fulfilled' ? customerResult.value.customers : []);
      setOrders(orderResult.status === 'fulfilled' ? orderResult.value.orders : []);
      setSupportTickets(supportResult.status === 'fulfilled' ? supportResult.value.tickets : []);
      setRefunds(refundResult.status === 'fulfilled' ? refundResult.value.refunds : []);
      setPayouts(payoutResult.status === 'fulfilled' ? payoutResult.value.payouts : []);
      setOverview(overviewResult.status === 'fulfilled' ? overviewResult.value : emptyOverview);
      setStudio(studioResult.status === 'fulfilled' ? studioResult.value : emptyStudio);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gagal memuat dashboard admin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isActive = true;

    const bootstrap = async () => {
      const payload = await loadSession();
      if (!isActive) {
        return;
      }
      if (payload?.isAuthenticated) {
        await loadAll(selectedPlatformId);
      } else {
        setLoading(false);
      }
    };

    void bootstrap();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (session?.isAuthenticated) {
      void loadAll(selectedPlatformId);
    }
  }, [selectedPlatformId, session?.isAuthenticated]);

  const handleLogin = async () => {
    try {
      setBusy(true);
      setMessage('');
      const payload = await createAdminAuthSession(client, loginForm);
      setSession(payload);
      await loadAll(selectedPlatformId);
      if (typeof window !== 'undefined') {
        window.location.assign('/overview');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Login admin gagal.');
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    try {
      setBusy(true);
      setMessage('');
      const payload = await deleteAdminAuthSession(client);
      setSession(payload);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Logout admin gagal.');
    } finally {
      setBusy(false);
    }
  };

  const handleReview = async (applicationId: string, decision: 'approved' | 'changes_requested' | 'rejected') => {
    try {
      setBusy(true);
      setMessage('');
      const updated = await reviewPlatformProfessionalApplication(client, selectedPlatformId, applicationId, {
        decision,
        reviewNotes: reviewNotes[applicationId] || '',
      });
      setApplications((current) => current.map((item) => (item.applicationId === applicationId ? updated : item)));
      await loadAll(selectedPlatformId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gagal menyimpan review profesional.');
    } finally {
      setBusy(false);
    }
  };

  const handleOrderStatus = async (orderId: string, status: string, paymentStatus?: string) => {
    try {
      setBusy(true);
      setMessage('');
      await updateAdminOrder(client, orderId, {
        paymentStatus,
        status,
      });
      await loadAll(selectedPlatformId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gagal memperbarui status order.');
    } finally {
      setBusy(false);
    }
  };

  const handleSupportTriage = async (ticketId: string) => {
    try {
      setBusy(true);
      setMessage('');
      const form = supportForms[ticketId] || { assignToAdminId: '', internalNote: '', publicNote: '', status: '' };
      await triageAdminSupportTicket(client, ticketId, {
        assignToAdminId: form.assignToAdminId || undefined,
        internalNote: form.internalNote || undefined,
        publicNote: form.publicNote || undefined,
        status: form.status || undefined,
      });
      await loadAll(selectedPlatformId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gagal melakukan triage ticket.');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateRefund = async () => {
    try {
      setBusy(true);
      setMessage('');
      await createAdminRefund(client, {
        amount: Number(refundForm.amount || 0),
        orderId: refundForm.orderId,
        paymentId: refundForm.paymentId || undefined,
        reason: refundForm.reason || undefined,
      });
      setRefundForm({ amount: '0', orderId: '', paymentId: '', reason: '' });
      await loadAll(selectedPlatformId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gagal membuat refund.');
    } finally {
      setBusy(false);
    }
  };

  const handleRefundStatus = async (refundId: string, status: string) => {
    try {
      setBusy(true);
      setMessage('');
      await updateAdminRefund(client, refundId, { status });
      await loadAll(selectedPlatformId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gagal memperbarui refund.');
    } finally {
      setBusy(false);
    }
  };

  const handleCreatePayout = async () => {
    try {
      setBusy(true);
      setMessage('');
      const resolvedProvider =
        !payoutForm.provider.trim() || payoutForm.provider === 'bank_transfer' ? 'manual_test' : payoutForm.provider;
      await createAdminPayout(client, {
        amount: Number(payoutForm.amount || 0),
        professionalProfileId: payoutForm.professionalProfileId,
        provider: resolvedProvider,
      });
      setPayoutForm({ amount: '0', professionalProfileId: '', provider: 'bank_transfer' });
      await loadAll(selectedPlatformId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gagal membuat payout.');
    } finally {
      setBusy(false);
    }
  };

  const handlePayoutStatus = async (payoutId: string, status: string) => {
    try {
      setBusy(true);
      setMessage('');
      await updateAdminPayout(client, payoutId, {
        providerReference: status === 'paid' ? `bank-${Date.now()}` : undefined,
        status,
      });
      await loadAll(selectedPlatformId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gagal memperbarui payout.');
    } finally {
      setBusy(false);
    }
  };

  const pendingCount = applications.filter((application) => application.applicationStatus === 'submitted').length;
  const activeSectionId = (currentSection.id === 'login' ? 'overview' : currentSection.id) as Exclude<
    AdminConsoleSection,
    'login'
  >;
  const currentNavVisual = adminNavVisuals[activeSectionId];
  const navMetricLabel = (sectionId: Exclude<AdminConsoleSection, 'login'>) => {
    if (sectionId === 'customers') {
      return `${customers.length} customer`;
    }
    if (sectionId === 'professionals') {
      return `${pendingCount} review`;
    }
    if (sectionId === 'orders') {
      return `${orders.length} order`;
    }
    if (sectionId === 'support') {
      return `${supportTickets.length} ticket`;
    }
    if (sectionId === 'refunds') {
      return `${refunds.length} refund`;
    }
    if (sectionId === 'payouts') {
      return `${payouts.length} payout`;
    }
    if (sectionId === 'studio') {
      return `${studio.paidOrders} paid`;
    }
    return `${overview.activeOrders} aktif`;
  };
  const quickActions = [
    {
      description: 'Buka helpdesk untuk meninjau assignment, refund, dan ticket yang masih aktif.',
      href: '/support',
      label: 'Support Queue',
      metric: `${supportTickets.length} aktif`,
      tone: 'rose' as const,
    },
    {
      description: 'Masuk ke antrean review untuk menindaklanjuti profesional yang masih menunggu verifikasi.',
      href: '/professionals',
      label: 'Approval Queue',
      metric: `${pendingCount} review`,
      tone: 'sky' as const,
    },
    {
      description: 'Pantau transaksi aktif, pembayaran tertahan, dan status fulfillment dari order desk.',
      href: '/orders',
      label: 'Order Desk',
      metric: `${orders.length} order`,
      tone: 'amber' as const,
    },
  ];
  const navItems = adminConsoleSections
    .filter((item) => item.id !== 'login')
    .map((item) => ({
      href: item.href,
      id: item.id as Exclude<AdminConsoleSection, 'login'>,
      label: item.label,
      metricLabel: navMetricLabel(item.id as Exclude<AdminConsoleSection, 'login'>),
    }));

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.22)_0%,transparent_24%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.12)_0%,transparent_24%),linear-gradient(180deg,#edf3f9_0%,#f7fafc_24%,#f6f8fb_100%)] text-slate-900">
      {!session?.isAuthenticated || currentSection.id === 'login' ? (
        <AdminLoginShell
          busy={busy}
          currentSectionLabel={currentSection.id === 'login' ? 'Overview' : currentSection.label}
          loginForm={loginForm}
          message={message}
          onEmailChange={(value) => setLoginForm((current) => ({ ...current, email: value }))}
          onPasswordChange={(value) => setLoginForm((current) => ({ ...current, password: value }))}
          onSubmit={() => void handleLogin()}
          selectedPlatformName={selectedPlatform.name}
        />
      ) : (
        <div className="mx-auto flex min-h-screen max-w-[1720px] gap-5 px-4 py-5 xl:px-6">
          <AdminSidebar
            busy={busy}
            currentSection={activeSectionId}
            navItems={navItems}
            onLogout={() => void handleLogout()}
            operatorEmail={session.email}
            ordersCount={orders.length}
            pendingCount={pendingCount}
            platformName={selectedPlatform.name}
            revenueLabel={formatAdminCurrency(studio.grossRevenueAmount)}
            supportCount={supportTickets.length}
          />

          <div className="flex min-w-0 flex-1 flex-col gap-5">
            <AdminDashboardHeader
              currentSectionLabel={currentSection.label}
              navVisual={currentNavVisual}
              platformName={selectedPlatform.name}
              quickActions={quickActions}
            />

            <div className="space-y-6">
              {message ? <MessageBanner tone="info">{message}</MessageBanner> : null}
              {loading ? (
                <SurfaceCard title="Memuat dashboard" description="Mengambil data admin terbaru...">
                  <p className="text-sm leading-6" style={{ color: 'var(--ui-text-muted)' }}>
                    Menyiapkan antrean review, support, pesanan, refund, dan ringkasan data.
                  </p>
                </SurfaceCard>
              ) : null}
              {!loading && currentSection.id === 'overview' ? (
                <OverviewSection overview={overview} studio={studio} />
              ) : null}
              {!loading && currentSection.id === 'customers' ? <CustomersSection customers={customers} /> : null}
              {!loading && currentSection.id === 'professionals' ? (
                <ProfessionalsSection
                  applications={applications}
                  busy={busy}
                  onReview={handleReview}
                  reviewNotes={reviewNotes}
                  setReviewNotes={setReviewNotes}
                />
              ) : null}
              {!loading && currentSection.id === 'orders' ? (
                <OrdersSection busy={busy} onUpdateStatus={handleOrderStatus} orders={orders} />
              ) : null}
              {!loading && currentSection.id === 'support' ? (
                <SupportSection
                  busy={busy}
                  onTriage={handleSupportTriage}
                  setSupportForms={setSupportForms}
                  supportForms={supportForms}
                  tickets={supportTickets}
                />
              ) : null}
              {!loading && currentSection.id === 'refunds' ? (
                <RefundsSection
                  busy={busy}
                  form={refundForm}
                  onCreate={handleCreateRefund}
                  onStatusChange={handleRefundStatus}
                  orders={orders}
                  refunds={refunds}
                  setForm={setRefundForm}
                />
              ) : null}
              {!loading && currentSection.id === 'payouts' ? (
                <PayoutsSection
                  applications={applications}
                  busy={busy}
                  form={payoutForm}
                  onCreate={handleCreatePayout}
                  onStatusChange={handlePayoutStatus}
                  payouts={payouts}
                  setForm={setPayoutForm}
                />
              ) : null}
              {!loading && currentSection.id === 'studio' ? <StudioSection studio={studio} /> : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
