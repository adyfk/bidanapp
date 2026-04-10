import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export const viewerAccounts = {
  approvedProfessional: { password: 'BidanDemo#2026', phone: '+628111111002' },
  customer: { password: 'BidanDemo#2026', phone: '+628111111001' },
  draftProfessional: { password: 'BidanDemo#2026', phone: '+628111111004' },
  emptyCustomer: { password: 'BidanDemo#2026', phone: '+628111111005' },
  emptyProfessional: { password: 'BidanDemo#2026', phone: '+628111111006' },
  submittedProfessional: { password: 'BidanDemo#2026', phone: '+628111111003' },
};

export const adminAccount = {
  email: 'rani@ops.bidanapp.id',
  password: 'AdminDemo#2026',
};

export async function loginViewer(page: Page, phone: string, password: string) {
  await page.goto('/id/login');
  const form = page.locator('form').first();
  await form.getByLabel(/Nomor ponsel|Phone number/i).fill(phone);
  await form.getByLabel(/^Password$/i).fill(password);
  await form.getByRole('button', { name: /Masuk|Sign in/i }).click();
  await page.waitForURL(/\/id$/);
  await expect(page).toHaveURL(/\/id$/);
}

export async function loginAdmin(page: Page, email: string, password: string) {
  await page.goto('http://admin.lvh.me:3005/login');
  await page.getByLabel(/Email admin/i).fill(email);
  await page.getByLabel(/Kata sandi admin|Admin password/i).fill(password);
  await page.getByRole('button', { name: /Masuk ke admin console|Admin console/i }).click();
  await page.waitForURL('**/overview');
  await expect(page).toHaveURL(/\/overview$/);
}

export async function createQuickOrder(
  page: Page,
  input: {
    notes?: string;
    schedule?: string;
  } = {},
) {
  await page.goto('/id/orders');
  await expect(page.getByText(/Order cepat|Quick order/i)).toBeVisible();

  await page
    .getByLabel(/Jadwal yang diinginkan|Preferred schedule/i)
    .fill(input.schedule ?? '2026-04-08T10:00:00+07:00');
  await page
    .getByLabel(/Catatan untuk profesional|Notes for the professional/i)
    .fill(input.notes ?? 'Tolong siapkan order demo untuk verifikasi journey report.');
  await page
    .locator('button')
    .filter({
      hasText: /Smoke E2E Offering|Workbook laktasi 14 hari|Konsultasi laktasi online|Kunjungan rumah pascamelahirkan/i,
    })
    .first()
    .click();
  const createOrderResponse = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' && /\/platforms\/[^/]+\/orders$/.test(response.url()) && response.ok(),
  );
  await page.getByRole('button', { name: /^Buat order$|^Create order$/i }).click();
  const createOrderPayload = await (await createOrderResponse).json();
  await expect(page.getByText(/Pembayaran siap dilanjutkan|Payment is ready to continue/i).first()).toBeVisible();

  const orderId = createOrderPayload?.data?.id ?? createOrderPayload?.data?.data?.id;
  if (!orderId || typeof orderId !== 'string') {
    throw new Error('Order ID terbaru tidak berhasil ditangkap dari response create order.');
  }

  return { orderId };
}

export async function createSupportTicket(
  page: Page,
  input: {
    details?: string;
    subject?: string;
  } = {},
) {
  await page.goto('/id/support');
  await expect(page.getByRole('heading', { name: /Support/i })).toBeVisible();
  const composerTrigger = page
    .getByRole('button', { name: /Buat tiket baru|Buat tiket|Buka composer support/i })
    .first();
  if (await composerTrigger.isVisible()) {
    await composerTrigger.click();
  }
  await page.getByLabel(/Subjek|Subject/i).fill(input.subject ?? 'Journey report support ticket');
  await page
    .getByLabel(/Detail/i)
    .fill(input.details ?? 'Tiket support demo untuk memvalidasi alur visual customer dan admin.');
  await page
    .getByRole('button', { name: /^Buat tiket$|^Create ticket$/i })
    .last()
    .click();
}
