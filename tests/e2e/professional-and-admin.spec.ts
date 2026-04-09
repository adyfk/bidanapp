import { expect, test } from '@playwright/test';
import { adminAccount, loginAdmin, loginViewer, viewerAccounts } from './helpers';

test('submitted professional sees review state in the apply flow', async ({ page }) => {
  await loginViewer(page, viewerAccounts.submittedProfessional.phone, viewerAccounts.submittedProfessional.password);

  await page.goto('/id/professionals/apply');
  await expect(page.getByText(/Status aplikasi|Application status/i)).toBeVisible();
  await expect(page.getByText(/^submitted$|^pending_review$/i).first()).toBeVisible();
});

test('admin can sign in and open the operations overview', async ({ page }) => {
  await loginAdmin(page, adminAccount.email, adminAccount.password);

  await expect(page.getByText(/Order aktif|Active orders/i)).toBeVisible();
  await expect(page.getByText(/Menunggu review|Pending review/i)).toBeVisible();
});
