import { expect, test } from '@playwright/test';
import { adminAccount, createSupportTicket, loginAdmin, loginViewer, viewerAccounts } from '../helpers';
import { beginJourney, captureJourneyStep, completeJourney } from '../journey';

test('journey: admin login reaches the operations overview', async ({ page }, testInfo) => {
  const journey = await beginJourney(testInfo, {
    category: 'admin',
    description: 'Admin signs in and lands on the seeded overview with live counters.',
    id: 'admin-login-overview',
    preconditions: ['Bidan demo seed aktif.', 'Akun admin seeded tersedia.'],
    seed: {
      actor: 'admin',
      credentialLabel: `${adminAccount.email} / ${adminAccount.password}`,
    },
    title: 'Admin login and overview',
  });

  let status: 'passed' | 'failed' = 'passed';

  try {
    await captureJourneyStep(
      journey,
      page,
      {
        actionLabel: 'Buka halaman login admin',
        expectedResult: 'Form login admin tampil dan siap dipakai.',
        title: 'Admin login screen is ready',
      },
      async () => {
        await page.goto('http://admin.lvh.me:3005/login');
        await expect(page.getByLabel(/Email admin/i)).toBeVisible();
      },
    );

    await captureJourneyStep(
      journey,
      page,
      {
        actionLabel: 'Masuk dengan akun admin seeded',
        expectedResult: 'Admin masuk ke overview dan melihat ringkasan order serta review queue.',
        title: 'Admin reaches the overview dashboard',
      },
      async () => {
        await loginAdmin(page, adminAccount.email, adminAccount.password);
        await expect(page.getByText(/Order aktif|Active orders/i)).toBeVisible();
        await expect(page.getByText(/Menunggu review|Pending review/i)).toBeVisible();
      },
    );
  } catch (error) {
    status = 'failed';
    throw error;
  } finally {
    await completeJourney(journey, { status });
  }
});

test('journey: admin opens the professional review queue', async ({ page }, testInfo) => {
  const journey = await beginJourney(testInfo, {
    category: 'admin',
    description: 'Admin opens the seeded professional review queue and inspects the submitted application payload.',
    id: 'admin-review-queue',
    preconditions: ['Bidan demo seed aktif.', 'Submitted professional tetap tersedia di antrean review.'],
    seed: {
      actor: 'admin',
      credentialLabel: `${adminAccount.email} / ${adminAccount.password}`,
    },
    title: 'Admin professional review queue',
  });

  let status: 'passed' | 'failed' = 'passed';

  try {
    await loginAdmin(page, adminAccount.email, adminAccount.password);

    await captureJourneyStep(
      journey,
      page,
      {
        actionLabel: 'Buka section professionals',
        expectedResult: 'Admin melihat antrean review profesional lengkap dengan dokumen dan catatan review.',
        title: 'Professional review queue is visible',
      },
      async () => {
        await page.goto('http://admin.lvh.me:3005/professionals');
        await expect(page.getByText(/Antrean review profesional/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /Approve/i }).first()).toBeVisible();
        await expect(page.getByText(/sipb_document_url|str_document_url|\.txt/i).first()).toBeVisible();
      },
    );
  } catch (error) {
    status = 'failed';
    throw error;
  } finally {
    await completeJourney(journey, { status });
  }
});

test('journey: admin can move across the remaining console sections', async ({ page }, testInfo) => {
  const journey = await beginJourney(testInfo, {
    category: 'admin',
    description:
      'Admin verifies the remaining operational desks so every active admin route has a visual proof in the latest report.',
    id: 'admin-console-route-map',
    preconditions: ['Bidan demo seed aktif.', 'Akun admin seeded tersedia.'],
    seed: {
      actor: 'admin',
      credentialLabel: `${adminAccount.email} / ${adminAccount.password}`,
    },
    title: 'Admin console route coverage',
  });

  let status: 'passed' | 'failed' = 'passed';

  try {
    await loginAdmin(page, adminAccount.email, adminAccount.password);

    await captureJourneyStep(
      journey,
      page,
      {
        actionKind: 'navigate',
        actionLabel: 'Buka customers desk',
        assertions: ['Daftar customer terlihat.'],
        expectedResult: 'Admin dapat membuka daftar customer aktif di desk customers.',
        routeId: '/customers',
        screenId: 'admin-customers',
        title: 'Customers desk is visible',
      },
      async () => {
        await page.goto('http://admin.lvh.me:3005/customers');
        await expect(page.getByText(/^Customer$/i)).toBeVisible();
      },
    );

    await captureJourneyStep(
      journey,
      page,
      {
        actionKind: 'navigate',
        actionLabel: 'Buka order desk',
        assertions: ['Order desk tampil dengan action mutation admin.'],
        expectedResult: 'Admin dapat membuka order desk dan melihat action untuk mark paid atau complete.',
        routeId: '/orders',
        screenId: 'admin-orders',
        title: 'Orders desk is visible',
      },
      async () => {
        await page.goto('http://admin.lvh.me:3005/orders');
        await expect(page.getByRole('heading', { name: 'Order desk', exact: true })).toBeVisible();
        await expect(page.getByRole('button', { name: /^Paid$/i }).first()).toBeVisible();
      },
    );

    await captureJourneyStep(
      journey,
      page,
      {
        actionKind: 'navigate',
        actionLabel: 'Buka studio snapshot',
        assertions: ['Studio snapshot tampil dengan metrik finance seeded.'],
        expectedResult: 'Admin dapat membuka studio snapshot untuk melihat ringkasan operasional cepat.',
        routeId: '/studio',
        screenId: 'admin-studio',
        title: 'Studio snapshot is visible',
      },
      async () => {
        await page.goto('http://admin.lvh.me:3005/studio');
        await expect(page.getByText(/Studio snapshot/i)).toBeVisible();
      },
    );
  } catch (error) {
    status = 'failed';
    throw error;
  } finally {
    await completeJourney(journey, { status });
  }
});

test('journey: admin can triage a newly created support ticket', async ({ browser, page }, testInfo) => {
  const journey = await beginJourney(testInfo, {
    category: 'support',
    description: 'A customer creates a new support ticket and admin triages it from the support desk.',
    id: 'admin-support-triage',
    preconditions: ['Bidan demo seed aktif.', 'Customer dan admin seeded account tersedia.'],
    seed: {
      actor: 'admin',
      credentialLabel: `${adminAccount.email} / ${adminAccount.password}`,
      notes: 'Flow ini juga membuat tiket customer baru sebagai precondition visual.',
    },
    title: 'Admin support triage flow',
  });

  let status: 'passed' | 'failed' = 'passed';
  const uniqueSubject = `Journey admin support ${Date.now()}`;
  let customerContext: Awaited<ReturnType<typeof browser.newContext>> | null = null;

  try {
    customerContext = await browser.newContext({ baseURL: 'http://bidan.lvh.me:3002' });
    const customerPage = await customerContext.newPage();
    await loginViewer(customerPage, viewerAccounts.customer.phone, viewerAccounts.customer.password);
    await createSupportTicket(customerPage, {
      details: 'Tiket customer baru untuk memastikan support desk admin punya edge visual yang jelas.',
      subject: uniqueSubject,
    });
    await expect(customerPage.getByText(/Tiket .* berhasil dibuat/i)).toBeVisible();

    await loginAdmin(page, adminAccount.email, adminAccount.password);

    await captureJourneyStep(
      journey,
      page,
      {
        actionLabel: 'Buka support desk admin',
        expectedResult: 'Ticket customer yang baru dibuat terlihat di support desk admin.',
        title: 'Admin sees the new customer ticket',
      },
      async () => {
        await page.goto('http://admin.lvh.me:3005/support');
        await expect(page.getByRole('heading', { name: /Support desk/i })).toBeVisible();
        await expect(page.getByText(uniqueSubject)).toBeVisible();
      },
    );

    await captureJourneyStep(
      journey,
      page,
      {
        actionLabel: 'Isi triage lalu simpan',
        expectedResult: 'Ticket masuk ke state triaged/reviewing dan catatan penanganan tersimpan.',
        title: 'Admin triages the support ticket',
      },
      async () => {
        const ticketCard = page.getByRole('article').filter({ hasText: uniqueSubject }).first();
        await ticketCard.getByLabel(/Status/i).fill('triaged');
        await ticketCard.getByLabel(/Catatan ke customer/i).fill('Tim support sedang meninjau laporan Anda.');
        await ticketCard.getByLabel(/Catatan internal/i).fill('Journey report triage pass.');
        await ticketCard.getByRole('button', { name: /^Simpan$/i }).click();
        await expect(page.getByText(/triaged/i).first()).toBeVisible();
      },
    );
  } catch (error) {
    status = 'failed';
    throw error;
  } finally {
    if (customerContext) {
      await customerContext.close();
    }
    await completeJourney(journey, { status });
  }
});

test('journey: admin can create refund and payout records from seeded queues', async ({ page }, testInfo) => {
  const journey = await beginJourney(testInfo, {
    category: 'payments',
    description: 'Admin uses seeded quick picks to create a refund and payout record without raw manual IDs.',
    id: 'admin-refund-payout',
    preconditions: ['Bidan demo seed aktif.', 'Seeded orders dan applications tersedia di admin console.'],
    seed: {
      actor: 'admin',
      credentialLabel: `${adminAccount.email} / ${adminAccount.password}`,
    },
    title: 'Admin refund and payout flow',
  });

  let status: 'passed' | 'failed' = 'passed';
  const refundReason = `Journey refund ${Date.now()}`;
  const payoutAmount = `${250000 + Number(Date.now().toString().slice(-4))}`;

  try {
    await loginAdmin(page, adminAccount.email, adminAccount.password);

    await captureJourneyStep(
      journey,
      page,
      {
        actionLabel: 'Buka section refunds',
        expectedResult: 'Admin melihat quick pick seeded orders dan antrean refund yang aktif.',
        title: 'Refund desk is ready',
      },
      async () => {
        await page.goto('http://admin.lvh.me:3005/refunds');
        await expect(page.getByRole('heading', { name: /Buat refund/i })).toBeVisible();
      },
    );

    await captureJourneyStep(
      journey,
      page,
      {
        actionLabel: 'Pilih seeded order lalu buat refund',
        expectedResult: 'Record refund baru muncul di antrean refund dengan alasan yang diisikan admin.',
        title: 'Admin creates a new refund record',
      },
      async () => {
        await page
          .getByRole('button', { name: /^Pakai$/i })
          .first()
          .click();
        await page.getByLabel(/Alasan/i).fill(refundReason);
        await page.getByRole('button', { name: /^Buat$/i }).click();
        await expect(page.getByText(refundReason)).toBeVisible();
      },
    );

    await captureJourneyStep(
      journey,
      page,
      {
        actionLabel: 'Buka section payouts',
        expectedResult: 'Admin melihat quick pick professional profile dan antrean payout.',
        title: 'Payout desk is ready',
      },
      async () => {
        await page.goto('http://admin.lvh.me:3005/payouts');
        await expect(page.getByRole('heading', { name: /Buat payout/i })).toBeVisible();
      },
    );

    await captureJourneyStep(
      journey,
      page,
      {
        actionLabel: 'Lanjutkan payout pending ke status processing',
        expectedResult: 'Admin bisa memajukan payout pending ke status processing dari desk payout.',
        title: 'Admin advances a seeded payout record',
      },
      async () => {
        const processingButton = page.getByRole('button', { name: /^Process$/i });
        const pendingCards = page
          .getByRole('article')
          .filter({ hasText: /pending/i })
          .filter({ has: processingButton });

        if ((await pendingCards.count()) === 0) {
          await page
            .getByRole('button', { name: /^Pakai$/i })
            .first()
            .click();
          await page.getByLabel(/Nominal/i).fill(payoutAmount);
          const [createResponse] = await Promise.all([
            page.waitForResponse(
              (response) => response.request().method() === 'POST' && /\/api\/v1\/admin\/payouts$/.test(response.url()),
            ),
            page.getByRole('button', { name: /^Buat$/i }).click(),
          ]);
          expect(createResponse.ok()).toBeTruthy();
          await expect(pendingCards.first()).toBeVisible();
        }

        const pendingCard = page
          .getByRole('article')
          .filter({ hasText: /pending/i })
          .filter({ has: processingButton })
          .first();
        const [updateResponse] = await Promise.all([
          page.waitForResponse(
            (response) =>
              response.request().method() === 'POST' && /\/api\/v1\/admin\/payouts\/.+\/status$/.test(response.url()),
          ),
          pendingCard.getByRole('button', { name: /^Process$/i }).click(),
        ]);
        expect(updateResponse.ok()).toBeTruthy();
        await expect(page.getByText(/processing/i).first()).toBeVisible();
      },
    );
  } catch (error) {
    status = 'failed';
    throw error;
  } finally {
    await completeJourney(journey, { status });
  }
});
