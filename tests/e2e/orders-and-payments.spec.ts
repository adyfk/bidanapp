import { expect, test } from '@playwright/test';
import { loginViewer, viewerAccounts } from './helpers';

test('customer can create an order and simulate manual payment', async ({ page }) => {
  await loginViewer(page, viewerAccounts.customer.phone, viewerAccounts.customer.password);

  await page.goto('/id/orders');
  await expect(page.getByText(/Order cepat|Quick order/i)).toBeVisible();

  await page.getByLabel(/Jadwal yang diinginkan|Preferred schedule/i).fill('2026-04-08T10:00:00+07:00');
  await page
    .getByLabel(/Catatan untuk profesional|Notes for the professional/i)
    .fill('Tolong siapkan jadwal demo untuk pengujian end-to-end.');

  await page
    .locator('button')
    .filter({
      hasText: /Smoke E2E Offering|Workbook laktasi 14 hari|Konsultasi laktasi online|Kunjungan rumah pascamelahirkan/i,
    })
    .first()
    .click();
  await page.getByRole('button', { name: /^Buat order$|^Create order$/i }).click();

  await expect(page.getByText(/Pembayaran siap dilanjutkan|Payment is ready to continue/i).first()).toBeVisible();

  await page.getByRole('button', { name: /Tandai sudah bayar|Mark as paid/i }).click();
  await expect(page.getByText(/Pembayaran berhasil ditandai selesai|Payment marked as completed/i)).toBeVisible();
});
