import { expect, test } from '@playwright/test';
import { loginViewer, viewerAccounts } from '../helpers';
import { beginJourney, captureJourneyStep, completeJourney } from '../journey';

test('journey: draft professional can open the apply flow and see the editable draft state', async ({
  page,
}, testInfo) => {
  const journey = await beginJourney(testInfo, {
    category: 'professional',
    description: 'A draft professional opens the apply flow and sees the editable onboarding state before submission.',
    id: 'professional-draft-apply-state',
    preconditions: ['Bidan demo seed aktif.', 'Akun professional draft tersedia.'],
    seed: {
      actor: 'professional',
      credentialLabel: `${viewerAccounts.draftProfessional.phone} / ${viewerAccounts.draftProfessional.password}`,
    },
    title: 'Draft professional apply state',
  });

  let status: 'passed' | 'failed' = 'passed';

  try {
    await loginViewer(page, viewerAccounts.draftProfessional.phone, viewerAccounts.draftProfessional.password);

    await captureJourneyStep(
      journey,
      page,
      {
        actionKind: 'navigate',
        actionLabel: 'Buka apply flow profesional draft',
        assertions: ['Form aplikasi draft tampil.', 'CTA simpan/pengajuan tersedia.'],
        expectedResult: 'Professional draft masuk ke state onboarding yang masih bisa dilengkapi dan dikirim.',
        routeId: '/id/professionals/apply',
        screenId: 'professional-apply-draft',
        title: 'Draft professional sees the editable application flow',
      },
      async () => {
        await page.goto('/id/professionals/apply');
        await expect(page.getByText(/Lengkapi aplikasi Anda|Complete your application/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /Simpan|Kirim|Submit/i }).first()).toBeVisible();
      },
    );
  } catch (error) {
    status = 'failed';
    throw error;
  } finally {
    await completeJourney(journey, { status });
  }
});

test('journey: submitted professional sees the review state in apply flow', async ({ page }, testInfo) => {
  const journey = await beginJourney(testInfo, {
    category: 'professional',
    description: 'A submitted professional can open the apply flow and clearly see the current review state.',
    id: 'professional-apply-review-state',
    preconditions: ['Bidan demo seed aktif.', 'Akun professional submitted tersedia.'],
    seed: {
      actor: 'professional',
      credentialLabel: `${viewerAccounts.submittedProfessional.phone} / ${viewerAccounts.submittedProfessional.password}`,
    },
    title: 'Submitted professional application review state',
  });

  let status: 'passed' | 'failed' = 'passed';

  try {
    await loginViewer(page, viewerAccounts.submittedProfessional.phone, viewerAccounts.submittedProfessional.password);

    await captureJourneyStep(
      journey,
      page,
      {
        actionLabel: 'Buka jalur apply profesional',
        expectedResult: 'Layar apply memuat status aplikasi dan state review professional yang sudah submit.',
        title: 'Professional apply screen is ready',
      },
      async () => {
        await page.goto('/id/professionals/apply');
        await expect(page.getByText(/Status aplikasi|Application status/i)).toBeVisible();
      },
    );

    await captureJourneyStep(
      journey,
      page,
      {
        actionLabel: 'Lihat badge status aplikasi dan review',
        expectedResult: 'Status submitted atau pending_review tampil jelas tanpa perlu menebak state backend.',
        title: 'Submitted review state is visible',
      },
      async () => {
        await expect(page.getByText(/^submitted$|^pending_review$/i).first()).toBeVisible();
      },
    );
  } catch (error) {
    status = 'failed';
    throw error;
  } finally {
    await completeJourney(journey, { status });
  }
});

test('journey: submitted professional stays gated on the offerings workspace', async ({ page }, testInfo) => {
  const journey = await beginJourney(testInfo, {
    category: 'professional',
    description:
      'A submitted professional can inspect the offerings section but remains blocked from publishing until approved.',
    id: 'professional-submitted-offerings-gated',
    preconditions: ['Bidan demo seed aktif.', 'Akun submitted professional tersedia dan belum approved.'],
    seed: {
      actor: 'professional',
      credentialLabel: `${viewerAccounts.submittedProfessional.phone} / ${viewerAccounts.submittedProfessional.password}`,
    },
    title: 'Submitted professional publish gate',
  });

  let status: 'passed' | 'failed' = 'passed';

  try {
    await loginViewer(page, viewerAccounts.submittedProfessional.phone, viewerAccounts.submittedProfessional.password);

    await captureJourneyStep(
      journey,
      page,
      {
        actionKind: 'verify',
        actionLabel: 'Buka section offerings untuk akun submitted',
        assertions: ['Empty/gate state muncul.', 'CTA publish tidak aktif untuk akun non-approved.'],
        expectedResult: 'Section layanan menjelaskan bahwa publish offering masih terkunci sampai profil disetujui.',
        routeId: '/id/professionals/dashboard/offerings',
        screenId: 'professional-offerings-gated',
        title: 'Submitted professional sees the publish gate',
      },
      async () => {
        await page.goto('/id/professionals/dashboard/offerings');
        await expect(page.getByText(/Layanan belum bisa dipublikasikan/i)).toBeVisible();
      },
    );
  } catch (error) {
    status = 'failed';
    throw error;
  } finally {
    await completeJourney(journey, { status });
  }
});

test('journey: approved professional can operate the workspace and publish an offering', async ({ page }, testInfo) => {
  const journey = await beginJourney(testInfo, {
    category: 'professional',
    description:
      'An approved professional can open the workspace, review the seeded snapshot, then publish a new offering.',
    id: 'professional-workspace-approved',
    preconditions: ['Bidan demo seed aktif.', 'Akun professional approved tersedia.'],
    seed: {
      actor: 'professional',
      credentialLabel: `${viewerAccounts.approvedProfessional.phone} / ${viewerAccounts.approvedProfessional.password}`,
    },
    title: 'Approved professional workspace flow',
  });

  let status: 'passed' | 'failed' = 'passed';
  const title = `Journey report layanan ${Date.now()}`;

  try {
    await loginViewer(page, viewerAccounts.approvedProfessional.phone, viewerAccounts.approvedProfessional.password);

    await captureJourneyStep(
      journey,
      page,
      {
        actionLabel: 'Buka dashboard profesional',
        expectedResult: 'Workspace profesional memuat ringkasan seeded dan section console aktif.',
        title: 'Professional workspace overview is ready',
      },
      async () => {
        await page.goto('/id/professionals/dashboard');
        await expect(page.getByText(/Ringkasan profil/i)).toBeVisible();
      },
    );

    await captureJourneyStep(
      journey,
      page,
      {
        actionLabel: 'Masuk ke section layanan',
        expectedResult: 'Section offerings menampilkan form publish dan daftar layanan aktif.',
        title: 'Offering management section opens',
      },
      async () => {
        await page.goto('/id/professionals/dashboard/offerings');
        await expect(page.getByText(/Tambah layanan/i)).toBeVisible();
      },
    );

    await captureJourneyStep(
      journey,
      page,
      {
        actionLabel: 'Isi form offering lalu publish',
        expectedResult: 'Offering baru berhasil dipublish dan langsung muncul di daftar layanan aktif.',
        title: 'Approved professional publishes an offering',
      },
      async () => {
        await page.getByLabel(/Judul/i).fill(title);
        await page
          .getByLabel(/Deskripsi/i)
          .fill('Layanan demo untuk memvalidasi parity UI dan alur workspace profesional.');
        await page.getByLabel(/Harga/i).fill('175000');
        await page.getByRole('button', { name: /Publikasikan layanan/i }).click();
        await expect(page.getByText(title)).toBeVisible();
      },
    );

    await captureJourneyStep(
      journey,
      page,
      {
        actionKind: 'navigate',
        actionLabel: 'Buka seluruh section dashboard profesional',
        assertions: [
          'Section orders tampil.',
          'Section portfolio tampil.',
          'Section trust tampil.',
          'Section coverage tampil.',
          'Section availability tampil.',
          'Section notifications tampil.',
          'Section profile tampil.',
        ],
        expectedResult:
          'Professional approved dapat berpindah ke seluruh route workspace utama tanpa kehilangan context.',
        routeId: '/id/professionals/dashboard/*',
        screenId: 'professional-workspace-sections',
        title: 'Professional workspace sections are reachable',
      },
      async () => {
        await page.goto('/id/professionals/dashboard/orders');
        await expect(page.getByText(/Permintaan pelanggan/i)).toBeVisible();
        await page.goto('/id/professionals/dashboard/portfolio');
        await expect(page.getByRole('heading', { name: 'Portofolio', exact: true })).toBeVisible();
        await page.goto('/id/professionals/dashboard/trust');
        await expect(page.getByRole('heading', { name: 'Kredensial', exact: true })).toBeVisible();
        await page.goto('/id/professionals/dashboard/coverage');
        await expect(page.getByRole('heading', { name: 'Jangkauan layanan', exact: true })).toBeVisible();
        await page.goto('/id/professionals/dashboard/availability');
        await expect(page.getByRole('heading', { name: 'Jam ketersediaan', exact: true })).toBeVisible();
        await page.goto('/id/professionals/dashboard/notifications');
        await expect(page.getByText(/Preferensi notifikasi/i)).toBeVisible();
        await page.goto('/id/professionals/dashboard/profile');
        await expect(page.getByRole('heading', { name: 'Profil publik', exact: true })).toBeVisible();
      },
    );
  } catch (error) {
    status = 'failed';
    throw error;
  } finally {
    await completeJourney(journey, { status });
  }
});
