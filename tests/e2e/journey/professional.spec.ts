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
        await expect(page.getByText(/4 milestone tetap untuk form profesional/i)).toBeVisible();
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
  test.setTimeout(90_000);

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
  const title = `Paket nifas sore ${Date.now().toString().slice(-5)}`;

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
        await expect(page.getByText(/Kontrol kesiapan/i)).toBeVisible();
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
        await expect(page.getByText(/Composer layanan/i)).toBeVisible();
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

    const workspaceSections = [
      {
        actionLabel: 'Buka section orders dashboard profesional',
        expectedResult: 'Section orders menampilkan antrean permintaan pelanggan untuk profesional approved.',
        path: '/id/professionals/dashboard/orders',
        screenId: 'professional-workspace-orders',
        title: 'Professional workspace orders section is reachable',
        verify: async () => expect(page.getByText(/Permintaan pelanggan/i)).toBeVisible(),
      },
      {
        actionLabel: 'Buka section portfolio dashboard profesional',
        expectedResult: 'Section portfolio memuat showcase seeded dan form pengelolaan aset profesional.',
        path: '/id/professionals/dashboard/portfolio',
        screenId: 'professional-workspace-portfolio',
        title: 'Professional workspace portfolio section is reachable',
        verify: async () => expect(page.getByRole('heading', { name: 'Portofolio', exact: true })).toBeVisible(),
      },
      {
        actionLabel: 'Buka section trust dashboard profesional',
        expectedResult: 'Section trust memperlihatkan kredensial dan cerita profesional yang harus tetap terbaca.',
        path: '/id/professionals/dashboard/trust',
        screenId: 'professional-workspace-trust',
        title: 'Professional workspace trust section is reachable',
        verify: async () => expect(page.getByRole('heading', { name: 'Kredensial', exact: true })).toBeVisible(),
      },
      {
        actionLabel: 'Buka section coverage dashboard profesional',
        expectedResult: 'Section coverage menampilkan area layanan seeded tanpa kehilangan keterbacaan.',
        path: '/id/professionals/dashboard/coverage',
        screenId: 'professional-workspace-coverage',
        title: 'Professional workspace coverage section is reachable',
        verify: async () => expect(page.getByRole('heading', { name: 'Jangkauan layanan', exact: true })).toBeVisible(),
      },
      {
        actionLabel: 'Buka section availability dashboard profesional',
        expectedResult: 'Section availability memuat jadwal praktik dan tetap stabil untuk data jam yang panjang.',
        path: '/id/professionals/dashboard/availability',
        screenId: 'professional-workspace-availability',
        title: 'Professional workspace availability section is reachable',
        verify: async () => expect(page.getByRole('heading', { name: 'Jam ketersediaan', exact: true })).toBeVisible(),
      },
      {
        actionLabel: 'Buka section notifications dashboard profesional',
        expectedResult: 'Section notifications menampilkan preferensi channel secara jelas dan mudah dipindai.',
        path: '/id/professionals/dashboard/notifications',
        screenId: 'professional-workspace-notifications',
        title: 'Professional workspace notifications section is reachable',
        verify: async () => expect(page.getByText(/Preferensi notifikasi/i)).toBeVisible(),
      },
      {
        actionLabel: 'Buka section profile dashboard profesional',
        expectedResult: 'Section profile tetap terbaca untuk nama, slug, dan kota dengan panjang data realistis.',
        path: '/id/professionals/dashboard/profile',
        screenId: 'professional-workspace-profile',
        title: 'Professional workspace profile section is reachable',
        verify: async () => expect(page.getByRole('heading', { name: 'Profil publik', exact: true })).toBeVisible(),
      },
    ] as const;

    for (const sectionStep of workspaceSections) {
      await captureJourneyStep(
        journey,
        page,
        {
          actionKind: 'navigate',
          actionLabel: sectionStep.actionLabel,
          assertions: [sectionStep.expectedResult],
          expectedResult: sectionStep.expectedResult,
          routeId: sectionStep.path,
          screenId: sectionStep.screenId,
          title: sectionStep.title,
        },
        async () => {
          await page.goto(sectionStep.path, { waitUntil: 'domcontentloaded' });
          await sectionStep.verify();
        },
      );
    }
  } catch (error) {
    status = 'failed';
    throw error;
  } finally {
    await completeJourney(journey, { status });
  }
});

test('journey: empty professional sees milestone draft state and calm workspace empties', async ({
  page,
}, testInfo) => {
  const journey = await beginJourney(testInfo, {
    category: 'professional',
    description:
      'A newly seeded professional with a minimal draft profile can open both apply and workspace without the UI collapsing into empty chaos.',
    id: 'professional-empty-state-audit',
    preconditions: ['Bidan demo seed aktif.', 'Akun empty professional tersedia dengan profil draft minimal.'],
    seed: {
      actor: 'professional',
      credentialLabel: `${viewerAccounts.emptyProfessional.phone} / ${viewerAccounts.emptyProfessional.password}`,
    },
    title: 'Empty professional state audit',
  });

  let status: 'passed' | 'failed' = 'passed';

  try {
    await loginViewer(page, viewerAccounts.emptyProfessional.phone, viewerAccounts.emptyProfessional.password);

    await captureJourneyStep(
      journey,
      page,
      {
        actionKind: 'navigate',
        actionLabel: 'Buka apply flow professional empty state',
        assertions: ['Rail milestone draft tampil.', 'Form identitas dan dokumen tetap rapi walau baru mulai.'],
        expectedResult: 'Professional baru bisa membaca progres onboarding dengan jelas sejak state paling kosong.',
        routeId: '/id/professionals/apply',
        screenId: 'professional-empty-apply',
        title: 'Empty professional apply state is readable',
      },
      async () => {
        await page.goto('/id/professionals/apply');
        await expect(page.getByText(/Progress aplikasi/i)).toBeVisible();
        await expect(page.getByText(/Identitas/i).first()).toBeVisible();
      },
    );

    await captureJourneyStep(
      journey,
      page,
      {
        actionKind: 'navigate',
        actionLabel: 'Buka workspace overview empty professional',
        assertions: ['Dashboard tetap tampil.', 'Section overview menunjukkan checkpoint yang masih kosong.'],
        expectedResult:
          'Workspace profesional baru tetap terasa intentional walau belum punya offering, coverage, atau order.',
        routeId: '/id/professionals/dashboard',
        screenId: 'professional-empty-workspace',
        title: 'Empty professional workspace stays intentional',
      },
      async () => {
        await page.goto('/id/professionals/dashboard');
        await expect(page.getByText(/Kontrol kesiapan/i)).toBeVisible();
        await expect(page.getByText(/Aksi berikutnya/i)).toBeVisible();
      },
    );
  } catch (error) {
    status = 'failed';
    throw error;
  } finally {
    await completeJourney(journey, { status });
  }
});

test('journey: empty professional sees a readable apply validation state', async ({ page }, testInfo) => {
  const journey = await beginJourney(testInfo, {
    category: 'professional',
    description:
      'A newly seeded professional submits an incomplete application and sees a controlled validation state instead of a broken form.',
    id: 'professional-apply-validation-state',
    preconditions: ['Bidan demo seed aktif.', 'Akun empty professional tersedia dan belum melengkapi dokumen wajib.'],
    seed: {
      actor: 'professional',
      credentialLabel: `${viewerAccounts.emptyProfessional.phone} / ${viewerAccounts.emptyProfessional.password}`,
    },
    title: 'Professional apply validation state',
  });

  let status: 'passed' | 'failed' = 'passed';

  try {
    await loginViewer(page, viewerAccounts.emptyProfessional.phone, viewerAccounts.emptyProfessional.password);

    await captureJourneyStep(
      journey,
      page,
      {
        actionKind: 'submit',
        actionLabel: 'Kirim aplikasi profesional yang belum lengkap',
        assertions: ['Banner validasi muncul.', 'Form tetap bisa dibaca dan tidak kehilangan progress rail.'],
        expectedResult: 'Professional baru mendapat error validasi yang jelas ketika field wajib belum dilengkapi.',
        routeId: '/id/professionals/apply',
        screenId: 'professional-apply-validation',
        title: 'Incomplete professional application shows validation feedback',
      },
      async () => {
        await page.goto('/id/professionals/apply');
        await page.getByRole('button', { name: /Kirim aplikasi|Save application/i }).click();
        await expect(page.getByText(/Nomor STR wajib diisi|STR license number is required/i)).toBeVisible();
        await expect(page.getByText(/Progress aplikasi/i)).toBeVisible();
      },
    );
  } catch (error) {
    status = 'failed';
    throw error;
  } finally {
    await completeJourney(journey, { status });
  }
});

test('journey: approved professional desktop smoke stays centered inside the mobile shell', async ({
  page,
}, testInfo) => {
  const journey = await beginJourney(testInfo, {
    category: 'professional',
    description:
      'An approved professional opens the workspace at desktop width and confirms the centered mobile shell still looks intentional.',
    id: 'professional-desktop-shell-smoke',
    preconditions: ['Bidan demo seed aktif.', 'Akun professional approved tersedia.'],
    seed: {
      actor: 'professional',
      credentialLabel: `${viewerAccounts.approvedProfessional.phone} / ${viewerAccounts.approvedProfessional.password}`,
    },
    title: 'Professional desktop shell smoke',
  });

  let status: 'passed' | 'failed' = 'passed';

  try {
    await page.setViewportSize({ width: 1280, height: 960 });
    await loginViewer(page, viewerAccounts.approvedProfessional.phone, viewerAccounts.approvedProfessional.password);

    await captureJourneyStep(
      journey,
      page,
      {
        actionKind: 'verify',
        actionLabel: 'Audit workspace professional di viewport desktop 1280px',
        assertions: ['Hero workspace terlihat.', 'Rail section tetap centered dan mudah dipindai.'],
        expectedResult: 'Shell mobile tetap intentional saat centered di layar desktop lebar.',
        routeId: '/id/professionals/dashboard',
        screenId: 'professional-desktop-shell',
        title: 'Desktop mobile shell remains intentional',
      },
      async () => {
        await page.goto('/id/professionals/dashboard');
        await expect(page.getByText(/Kontrol kesiapan/i)).toBeVisible();
        await expect(page.getByText(/Profil publik/i)).toBeVisible();
      },
    );
  } catch (error) {
    status = 'failed';
    throw error;
  } finally {
    await completeJourney(journey, { status });
  }
});
