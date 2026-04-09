import { expect, test } from '@playwright/test';
import { beginJourney, captureJourneyStep, completeJourney } from '../journey';

test('journey: visitor can browse public Bidan surfaces from onboarding to detail pages', async ({
  page,
}, testInfo) => {
  const journey = await beginJourney(testInfo, {
    category: 'public',
    description:
      'A visitor starts from onboarding, enters the public marketplace, and reaches professional and service detail pages.',
    id: 'public-visitor-browse',
    persona: 'visitor',
    preconditions: ['Bidan demo seed aktif.', 'Approved professional dan seeded offerings tersedia di katalog publik.'],
    seed: {
      actor: 'visitor',
      credentialLabel: 'Visitor without login',
    },
    title: 'Visitor public browsing flow',
  });

  let status: 'passed' | 'failed' = 'passed';

  try {
    await captureJourneyStep(
      journey,
      page,
      {
        actionKind: 'navigate',
        actionLabel: 'Buka root onboarding Bidan',
        assertions: ['Onboarding access-first tampil.', 'CTA visitor/customer/professional terlihat.'],
        expectedResult: 'Visitor melihat layar onboarding dengan tiga jalur utama Bidan.',
        routeId: '/id',
        screenId: 'bidan-onboarding',
        title: 'Onboarding screen is ready',
      },
      async () => {
        await page.goto('/id');
        await expect(page.getByText(/BidanCare/)).toBeVisible();
        await expect(page.getByText(/Continue as visitor|Lanjut sebagai visitor/i)).toBeVisible();
      },
    );

    await captureJourneyStep(
      journey,
      page,
      {
        actionKind: 'navigate',
        actionLabel: 'Masuk ke jalur visitor',
        assertions: ['Visitor diarahkan ke /id/home.', 'Home public menampilkan aktivitas, layanan, dan profesional.'],
        expectedResult: 'Visitor masuk ke home publik tanpa perlu login.',
        routeId: '/id/home',
        screenId: 'public-home',
        title: 'Visitor enters the public home feed',
      },
      async () => {
        await page.getByRole('link', { name: /Continue as visitor|Lanjut sebagai visitor/i }).click();
        await page.waitForURL(/\/id\/home/);
        await expect(page.getByRole('heading', { name: /Aktivitas|Activity/i })).toBeVisible();
      },
    );

    await captureJourneyStep(
      journey,
      page,
      {
        actionKind: 'navigate',
        actionLabel: 'Buka explore professionals',
        assertions: ['Explore menampilkan daftar profesional publik.'],
        expectedResult: 'Visitor bisa menjelajahi profesional yang sudah approved di halaman explore.',
        routeId: '/id/explore',
        screenId: 'public-explore',
        title: 'Explore professionals is visible',
      },
      async () => {
        await page.goto('/id/explore');
        await expect(page.getByRole('heading', { name: /Jelajahi profesional|Explore professionals/i })).toBeVisible();
        await expect(page.locator('a[href*="/id/p/"]').first()).toBeVisible();
      },
    );

    await captureJourneyStep(
      journey,
      page,
      {
        actionKind: 'navigate',
        actionLabel: 'Buka detail profesional pertama',
        assertions: ['Detail profesional tampil.', 'Available services terlihat.'],
        expectedResult: 'Visitor dapat membuka detail profesional publik dan melihat service list terkait.',
        routeId: '/id/p/[slug]',
        screenId: 'public-professional-detail',
        title: 'Professional detail page opens',
      },
      async () => {
        await page.locator('a[href*="/id/p/"]').first().click();
        await page.waitForURL(/\/id\/p\/.+/);
        await expect(page.getByText(/Layanan yang tersedia|Available services/i)).toBeVisible();
      },
    );

    await captureJourneyStep(
      journey,
      page,
      {
        actionKind: 'navigate',
        actionLabel: 'Buka katalog layanan lalu masuk ke detail layanan pertama',
        assertions: ['Services katalog tampil.', 'Detail layanan membuka CTA profil dan booking.'],
        expectedResult: 'Visitor bisa berpindah dari katalog layanan ke halaman detail layanan publik.',
        routeId: '/id/s/[slug]',
        screenId: 'public-service-detail',
        title: 'Service catalog and detail page are reachable',
      },
      async () => {
        await page.goto('/id/services');
        await expect(page.getByRole('heading', { name: 'Layanan', exact: true })).toBeVisible();
        await page.locator('a[href*="/id/s/"]').first().click();
        await page.waitForURL(/\/id\/s\/.+/);
        await expect(page.getByRole('link', { name: /Profil|Profile/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /Lanjut booking|Continue to booking|Pesan|Order/i })).toBeVisible();
      },
    );
  } catch (error) {
    status = 'failed';
    throw error;
  } finally {
    await completeJourney(journey, { status });
  }
});

test('journey: localhost local auth routes redirect to the .lvh.me family', async ({ page }, testInfo) => {
  const journey = await beginJourney(testInfo, {
    category: 'auth',
    description:
      'A local localhost entry is redirected into the .lvh.me family so cookies and CORS stay valid for shared auth.',
    id: 'localhost-lvh-redirect',
    persona: 'visitor',
    preconditions: ['Proxy redirect lokal aktif di Bidan app.'],
    seed: {
      actor: 'visitor',
      credentialLabel: 'Local browser on localhost',
    },
    title: 'Localhost redirect guard',
  });

  let status: 'passed' | 'failed' = 'passed';

  try {
    await captureJourneyStep(
      journey,
      page,
      {
        actionKind: 'redirect',
        actionLabel: 'Buka localhost login route',
        assertions: ['Browser diarahkan dari localhost ke bidan.lvh.me.'],
        expectedResult:
          'Halaman login lokal tidak tinggal di localhost dan otomatis berpindah ke domain .lvh.me yang benar.',
        routeId: 'http://localhost:3002/id/login',
        screenId: 'localhost-redirect-guard',
        title: 'Localhost is redirected into the shared dev domain',
      },
      async () => {
        await page.goto('http://localhost:3002/id/login');
        await page.waitForURL('http://bidan.lvh.me:3002/id/login');
        await expect(page.getByRole('button', { name: /Masuk|Sign in/i })).toBeVisible();
      },
    );
  } catch (error) {
    status = 'failed';
    throw error;
  } finally {
    await completeJourney(journey, { status });
  }
});
