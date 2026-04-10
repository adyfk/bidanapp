import { expect, test } from '@playwright/test';
import {
  adminAccount,
  createQuickOrder,
  createSupportTicket,
  loginAdmin,
  loginViewer,
  viewerAccounts,
} from '../helpers';
import { beginJourney, captureJourneyStep, completeJourney } from '../journey';

test('journey: customer order creation and manual payment simulation', async ({ page }, testInfo) => {
  const journey = await beginJourney(testInfo, {
    category: 'payments',
    description: 'Customer creates a new order from seeded offerings, then settles it through the local payment step.',
    id: 'customer-order-payment',
    preconditions: [
      'Bidan demo seed aktif.',
      'Customer sudah punya akun seeded.',
      'Local payment step aktif untuk review lokal.',
    ],
    seed: {
      actor: 'customer',
      credentialLabel: `${viewerAccounts.customer.phone} / ${viewerAccounts.customer.password}`,
    },
    title: 'Customer order and payment simulation',
  });

  let status: 'passed' | 'failed' = 'passed';

  try {
    await loginViewer(page, viewerAccounts.customer.phone, viewerAccounts.customer.password);
    let orderId = '';

    await captureJourneyStep(
      journey,
      page,
      {
        actionLabel: 'Buka halaman aktivitas dan order',
        expectedResult: 'Daftar order dan quick order composer tampil dengan seeded offerings.',
        title: 'Order activity screen is ready',
      },
      async () => {
        await page.goto('/id/orders');
        await expect(page.getByText(/Order cepat|Quick order/i)).toBeVisible();
      },
    );

    await captureJourneyStep(
      journey,
      page,
      {
        actionLabel: 'Isi quick order lalu buat order baru',
        expectedResult: 'Order berhasil dibuat dan langkah pembayaran lokal langsung tersedia.',
        title: 'Customer creates a new quick order',
      },
      async () => {
        const createdOrder = await createQuickOrder(page, {
          notes: 'Journey report memesan layanan seeded untuk verifikasi layar payment.',
          schedule: '2026-04-08T13:30:00+07:00',
        });
        orderId = createdOrder.orderId;
      },
    );

    await captureJourneyStep(
      journey,
      page,
      {
        actionLabel: 'Jalankan simulasi pembayaran lokal',
        expectedResult: 'Pembayaran berpindah ke status paid dan feedback sukses tampil di layar.',
        title: 'Local payment settles the latest order',
      },
      async () => {
        await page.getByRole('button', { name: /^Bayar$|^Paid$/i }).click();
        await expect(page.getByText(/Pembayaran berhasil ditandai selesai|Payment marked as completed/i)).toBeVisible();
      },
    );

    await captureJourneyStep(
      journey,
      page,
      {
        actionLabel: 'Buka detail order terbaru dari daftar aktivitas',
        expectedResult: 'Customer dapat masuk ke detail order untuk melihat payment state dan tindakan lanjutan.',
        title: 'Customer opens the order detail screen',
      },
      async () => {
        await page.goto(`/id/orders/${orderId}`);
        await page.waitForURL(new RegExp(`/id/orders/${orderId}$`));
        await expect(page.getByText(/Ringkasan order|Order summary/i)).toBeVisible();
      },
    );

    await captureJourneyStep(
      journey,
      page,
      {
        actionKind: 'chat',
        actionLabel: 'Kirim pesan pertama lalu lanjutkan thread order',
        assertions: ['Thread order-linked dibuat.', 'Pesan customer tampil di daftar chat order.'],
        expectedResult: 'Customer dapat membuka thread chat order dan mengirim pesan follow-up dari halaman detail.',
        routeId: '/id/orders/[orderId]',
        screenId: 'customer-order-chat',
        title: 'Order-linked chat is usable from order detail',
      },
      async () => {
        await page
          .getByPlaceholder(/Tulis pesan untuk order ini|Write a message for this order/i)
          .fill('Halo, saya ingin konfirmasi detail layanan sebelum kunjungan.');
        await page.locator('form').last().locator('button').last().click();
        await expect(page.getByText(/Halo, saya ingin konfirmasi detail layanan/i)).toBeVisible();
        await page
          .getByPlaceholder(/Tulis pesan untuk order ini|Write a message for this order/i)
          .fill('Terima kasih, saya menambahkan catatan lanjutan untuk order ini.');
        await page.locator('form').last().locator('button').last().click();
        await expect(page.getByText(/Terima kasih, saya menambahkan catatan lanjutan/i)).toBeVisible();
      },
    );

    await captureJourneyStep(
      journey,
      page,
      {
        actionKind: 'support',
        actionLabel: 'Buat tiket support dari detail order',
        assertions: ['Tiket support baru dibuat dari konteks order aktif.'],
        expectedResult:
          'Customer dapat membuat tiket support langsung dari halaman detail order ketika membutuhkan bantuan lanjutan.',
        routeId: '/id/orders/[orderId]',
        screenId: 'customer-order-support',
        title: 'Order detail can create a support ticket',
      },
      async () => {
        await page
          .getByLabel(/Ceritakan kendalanya|Tell us the issue/i)
          .fill('Mohon cek order ini, saya ingin validasi alur support dari detail order.');
        await page.getByRole('button', { name: /Buat tiket support|Create support ticket/i }).click();
        await expect(page.getByText(/Tiket support .* berhasil dibuat|Support ticket .* created/i)).toBeVisible();
      },
    );
  } catch (error) {
    status = 'failed';
    throw error;
  } finally {
    await completeJourney(journey, { status });
  }
});

test('journey: customer support ticket can be created from the support center and reflected after admin triage', async ({
  browser,
  page,
}, testInfo) => {
  const journey = await beginJourney(testInfo, {
    category: 'support',
    description: 'Customer opens the support center, creates a new ticket, and sees it in the personal queue.',
    id: 'customer-support-ticket',
    preconditions: [
      'Bidan demo seed aktif.',
      'Customer seeded account tersedia.',
      'Support module aktif di backend dan admin.',
    ],
    seed: {
      actor: 'customer',
      credentialLabel: `${viewerAccounts.customer.phone} / ${viewerAccounts.customer.password}`,
    },
    title: 'Customer support ticket flow',
  });

  let status: 'passed' | 'failed' = 'passed';
  const uniqueSubject = `Journey support ${Date.now()}`;
  let adminContext: Awaited<ReturnType<typeof browser.newContext>> | null = null;

  try {
    await loginViewer(page, viewerAccounts.customer.phone, viewerAccounts.customer.password);

    await captureJourneyStep(
      journey,
      page,
      {
        actionLabel: 'Buka support center customer',
        expectedResult: 'Form tiket baru dan daftar tiket existing tampil di satu layar.',
        title: 'Support center is ready',
      },
      async () => {
        await page.goto('/id/support');
        await expect(page.getByRole('heading', { name: /Support/i })).toBeVisible();
        await expect(page.getByText(/Support center/i)).toBeVisible();
      },
    );

    await captureJourneyStep(
      journey,
      page,
      {
        actionLabel: 'Isi form tiket lalu submit',
        expectedResult: 'Tiket baru berhasil dibuat dan konfirmasi sukses muncul di layar.',
        title: 'Customer creates a new support ticket',
      },
      async () => {
        await createSupportTicket(page, {
          details: 'Tiket demo untuk memastikan support flow dan Playwright report tetap sinkron.',
          subject: uniqueSubject,
        });
        await expect(page.getByText(/Tiket .* berhasil dibuat/i)).toBeVisible();
      },
    );

    await captureJourneyStep(
      journey,
      page,
      {
        actionLabel: 'Lihat tiket baru di antrean pribadi',
        expectedResult: 'Tiket yang baru dibuat langsung muncul di bagian tiket saya.',
        title: 'Support ticket appears in the customer queue',
      },
      async () => {
        await expect(page.getByText(uniqueSubject)).toBeVisible();
      },
    );

    adminContext = await browser.newContext({ baseURL: 'http://admin.lvh.me:3005' });
    const adminPage = await adminContext.newPage();
    await loginAdmin(adminPage, adminAccount.email, adminAccount.password);

    await captureJourneyStep(
      journey,
      page,
      {
        actionKind: 'review',
        actionLabel: 'Admin melakukan triage pada tiket yang baru dibuat',
        assertions: ['Admin support desk menemukan tiket baru.', 'Status tiket berubah menjadi triaged.'],
        entityRefs: [uniqueSubject],
        expectedResult: 'Ticket yang baru dibuat customer diproses oleh admin dan berpindah ke state triaged.',
        routeId: '/id/support',
        screenId: 'customer-support-after-admin-triage',
        title: 'Admin triage updates the support ticket state',
      },
      async () => {
        await adminPage.goto('http://admin.lvh.me:3005/support');
        const ticketCard = adminPage.getByRole('article').filter({ hasText: uniqueSubject }).first();
        await expect(ticketCard).toBeVisible();
        await ticketCard.getByLabel(/Status/i).fill('triaged');
        await ticketCard
          .getByLabel(/Catatan ke customer/i)
          .fill('Tim support sedang memverifikasi detail laporan Anda.');
        await ticketCard.getByLabel(/Catatan internal/i).fill('Journey support sync pass.');
        await ticketCard.getByRole('button', { name: /^Simpan$/i }).click();
        await expect(adminPage.getByText(/triaged/i).first()).toBeVisible();

        await page.goto('/id/support');
        await expect(page.getByText(uniqueSubject)).toBeVisible();
        await expect(page.getByText(/Sedang ditinjau|In review|triaged/i).first()).toBeVisible();
      },
    );
  } catch (error) {
    status = 'failed';
    throw error;
  } finally {
    if (adminContext) {
      await adminContext.close();
    }
    await completeJourney(journey, { status });
  }
});
