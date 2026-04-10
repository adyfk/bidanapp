import { expect, test } from '@playwright/test';
import { loginViewer, viewerAccounts } from '../helpers';
import { beginJourney, captureJourneyStep, completeJourney } from '../journey';

test('journey: authenticated customer can move across home, profile, and notifications', async ({ page }, testInfo) => {
  const journey = await beginJourney(testInfo, {
    category: 'customer',
    description:
      'A seeded customer signs in, lands on the main home feed, then opens profile and notifications without losing the session context.',
    id: 'customer-home-profile-notifications',
    preconditions: ['Bidan demo seed aktif.', 'Akun customer seeded tersedia dengan notifikasi demo.'],
    seed: {
      actor: 'customer',
      credentialLabel: `${viewerAccounts.customer.phone} / ${viewerAccounts.customer.password}`,
    },
    title: 'Customer home, profile, and notifications',
  });

  let status: 'passed' | 'failed' = 'passed';

  try {
    await loginViewer(page, viewerAccounts.customer.phone, viewerAccounts.customer.password);

    await captureJourneyStep(
      journey,
      page,
      {
        actionKind: 'navigate',
        actionLabel: 'Masuk sebagai customer seeded',
        assertions: ['Customer tiba di /id.', 'Surface aktivitas utama terlihat.'],
        expectedResult: 'Customer tiba di home feed yang memuat aktivitas, layanan populer, dan profesional tepercaya.',
        routeId: '/id',
        screenId: 'customer-home',
        title: 'Authenticated customer home is visible',
      },
      async () => {
        await expect(page.getByRole('heading', { name: /Aktivitas|Activity/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Layanan populer|Popular services/i })).toBeVisible();
      },
    );

    await captureJourneyStep(
      journey,
      page,
      {
        actionKind: 'navigate',
        actionLabel: 'Buka halaman profil',
        assertions: [
          'Profil customer tampil.',
          'Edit profil kini dibuka melalui sheet yang tetap satu keluarga dengan halaman profil lama.',
        ],
        expectedResult:
          'Customer bisa membuka profil, melihat quick actions, lalu memunculkan sheet edit profil dari action card utama.',
        routeId: '/id/profile',
        screenId: 'customer-profile',
        title: 'Customer profile page is ready',
      },
      async () => {
        await page.goto('/id/profile');
        await expect(page.getByRole('heading', { name: 'Profil', exact: true })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Bantuan terbaru/i })).toBeVisible();
        await page.getByRole('button', { name: /Edit profil/i }).click();
        await expect(page.getByLabel(/Nama tampil/i)).toBeVisible();
        await expect(page.getByLabel(/Kota/i)).toBeVisible();
      },
    );

    await captureJourneyStep(
      journey,
      page,
      {
        actionKind: 'navigate',
        actionLabel: 'Buka feed notifikasi',
        assertions: ['Feed notifikasi tampil.', 'Item notifikasi atau empty-state yang benar terlihat.'],
        expectedResult: 'Customer bisa melihat feed notifikasi yang relevan dengan order, support, atau review.',
        routeId: '/id/notifications',
        screenId: 'customer-notifications',
        title: 'Customer notifications feed is visible',
      },
      async () => {
        await page.goto('/id/notifications');
        await expect(page.getByRole('heading', { name: /Notifikasi/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Prioritas customer dalam satu layar/i })).toBeVisible();
      },
    );
  } catch (error) {
    status = 'failed';
    throw error;
  } finally {
    await completeJourney(journey, { status });
  }
});

test('journey: empty customer sees calm empty states across support and notifications', async ({ page }, testInfo) => {
  const journey = await beginJourney(testInfo, {
    category: 'customer',
    description:
      'A newly seeded empty customer logs in and sees controlled empty states instead of noisy placeholders across support and notifications.',
    id: 'customer-empty-state-surfaces',
    preconditions: [
      'Bidan demo seed aktif.',
      'Akun empty customer tersedia tanpa order, support ticket, dan notifikasi.',
    ],
    seed: {
      actor: 'customer',
      credentialLabel: `${viewerAccounts.emptyCustomer.phone} / ${viewerAccounts.emptyCustomer.password}`,
    },
    title: 'Empty customer surface audit',
  });

  let status: 'passed' | 'failed' = 'passed';

  try {
    await loginViewer(page, viewerAccounts.emptyCustomer.phone, viewerAccounts.emptyCustomer.password);

    await captureJourneyStep(
      journey,
      page,
      {
        actionKind: 'navigate',
        actionLabel: 'Buka support center empty customer',
        assertions: ['Queue support kosong tampil tenang.', 'Composer tiket baru tetap tersedia.'],
        expectedResult: 'Customer baru tidak melihat layar support yang kacau meski belum punya tiket sama sekali.',
        routeId: '/id/support',
        screenId: 'customer-empty-support',
        title: 'Empty customer support queue is controlled',
      },
      async () => {
        await page.goto('/id/support');
        await expect(page.getByText('Antrean masih kosong')).toBeVisible();
        await expect(page.getByRole('button', { name: /Buat tiket/i }).first()).toBeVisible();
      },
    );

    await captureJourneyStep(
      journey,
      page,
      {
        actionKind: 'navigate',
        actionLabel: 'Buka notifikasi empty customer',
        assertions: ['Empty state notifikasi muncul.', 'Grouping feed tetap rapi walau data nol.'],
        expectedResult: 'Feed notifikasi tetap elegan dan jelas saat customer belum punya aktivitas tersimpan.',
        routeId: '/id/notifications',
        screenId: 'customer-empty-notifications',
        title: 'Empty customer notifications stay elegant',
      },
      async () => {
        await page.goto('/id/notifications');
        await expect(page.getByText(/Belum ada notifikasi/i)).toBeVisible();
      },
    );
  } catch (error) {
    status = 'failed';
    throw error;
  } finally {
    await completeJourney(journey, { status });
  }
});
