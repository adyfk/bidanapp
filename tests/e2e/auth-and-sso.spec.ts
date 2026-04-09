import { expect, test } from '@playwright/test';
import { loginViewer, viewerAccounts } from './helpers';

test('customer can sign in on Bidan and open native account security tools', async ({ page }) => {
  await loginViewer(page, viewerAccounts.customer.phone, viewerAccounts.customer.password);

  await expect(page.getByRole('heading', { name: /Aktivitas|Activity/i })).toBeVisible();

  await page.goto('http://bidan.lvh.me:3002/id/security');
  await expect(page.getByText(/\+628111111001/)).toBeVisible();
  await expect(page.getByText(/Pusat keamanan|Security center/i)).toBeVisible();
});
