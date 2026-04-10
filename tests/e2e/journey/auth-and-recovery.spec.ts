import { expect, test } from '@playwright/test';
import { loginViewer, viewerAccounts } from '../helpers';
import { beginJourney, captureJourneyStep, completeJourney } from '../journey';

test('journey: customer login and native device control', async ({ browser, page }, testInfo) => {
  const journey = await beginJourney(testInfo, {
    category: 'auth',
    description: 'Customer signs in from Bidan, opens native account security tools, then logs out other devices.',
    id: 'customer-auth-sso',
    preconditions: [
      'Bidan demo seed aktif.',
      'Akun customer seeded tersedia.',
      'Route account native tersedia di Bidan.',
    ],
    seed: {
      actor: 'customer',
      credentialLabel: `${viewerAccounts.customer.phone} / ${viewerAccounts.customer.password}`,
    },
    title: 'Customer login and native account security',
  });

  let status: 'passed' | 'failed' = 'passed';
  let secondaryContext: Awaited<ReturnType<typeof browser.newContext>> | null = null;

  try {
    await captureJourneyStep(
      journey,
      page,
      {
        actionLabel: 'Buka halaman login Bidan',
        expectedResult: 'Form login customer tampil di Bidan dengan CTA yang siap dipakai.',
        title: 'Login screen is ready',
      },
      async () => {
        await page.goto('/id/login');
        await expect(page.getByRole('button', { name: /Masuk|Sign in/i })).toBeVisible();
      },
    );

    await captureJourneyStep(
      journey,
      page,
      {
        actionLabel: 'Isi nomor ponsel dan password seeded lalu submit',
        expectedResult: 'Customer berhasil masuk dan diarahkan ke halaman utama Bidan.',
        title: 'Customer signs in from Bidan',
      },
      async () => {
        await page.getByLabel(/Nomor ponsel|Phone number/i).fill(viewerAccounts.customer.phone);
        await page.getByLabel(/^Password$/i).fill(viewerAccounts.customer.password);
        await page.getByRole('button', { name: /Masuk|Sign in/i }).click();
        await page.waitForURL(/\/id$/);
        await expect(page).toHaveURL(/\/id$/);
      },
    );

    await captureJourneyStep(
      journey,
      page,
      {
        actionKind: 'navigate',
        actionLabel: 'Buka halaman keamanan akun di Bidan',
        assertions: ['Nomor viewer tampil.', 'Pusat keamanan native siap dipakai.'],
        expectedResult: 'Pengaturan keamanan akun tampil langsung di Bidan tanpa pindah ke app lain.',
        routeId: '/id/security',
        screenId: 'customer-security-screen',
        title: 'Native security screen resolves the signed-in account',
      },
      async () => {
        await page.goto('/id/security');
        await expect(page.getByText(/\+628111111001/)).toBeVisible();
        await expect(page.getByText(/Pusat keamanan|Security center/i)).toBeVisible();
      },
    );

    secondaryContext = await browser.newContext({ baseURL: 'http://bidan.lvh.me:3002' });
    const secondaryPage = await secondaryContext.newPage();
    await loginViewer(secondaryPage, viewerAccounts.customer.phone, viewerAccounts.customer.password);

    await captureJourneyStep(
      journey,
      page,
      {
        actionKind: 'navigate',
        actionLabel: 'Buka daftar session setelah login dari device kedua',
        assertions: ['CTA logout device lain tampil.'],
        expectedResult: 'Bidan menampilkan daftar device aktif dan CTA untuk logout device lain.',
        routeId: '/id/sessions',
        screenId: 'customer-device-sessions-screen',
        title: 'Device sessions show multiple entries',
      },
      async () => {
        await page.goto('/id/sessions');
        await expect(page.getByRole('button', { name: /Keluar dari device lain|Logout other devices/i })).toBeVisible();
      },
    );

    await captureJourneyStep(
      journey,
      page,
      {
        actionKind: 'mutation',
        actionLabel: 'Klik logout device lain',
        expectedResult: 'Semua device lain diputus dan session saat ini tetap aktif.',
        assertions: ['Pesan sukses logout device lain tampil.'],
        routeId: '/id/sessions',
        screenId: 'customer-device-sessions-screen',
        title: 'Customer logs out other devices',
      },
      async () => {
        await page.getByRole('button', { name: /Keluar dari device lain|Logout other devices/i }).click();
        await expect(
          page.getByText(/Semua perangkat lain berhasil dikeluarkan|All other devices have been logged out/i),
        ).toBeVisible();
      },
    );
  } catch (error) {
    status = 'failed';
    throw error;
  } finally {
    if (secondaryContext) {
      await secondaryContext.close();
    }
    await completeJourney(journey, { status });
  }
});

test('journey: password recovery request reaches the OTP state', async ({ page }, testInfo) => {
  const journey = await beginJourney(testInfo, {
    category: 'auth',
    description: 'Customer starts password recovery and reaches the OTP verification state.',
    id: 'customer-password-recovery',
    preconditions: ['Bidan demo seed aktif.', 'OTP lokal tersedia untuk flow reset password.'],
    seed: {
      actor: 'customer',
      credentialLabel: viewerAccounts.customer.phone,
      notes: 'Journey ini memverifikasi request OTP dan state form recovery, bukan konsumsi OTP final.',
    },
    title: 'Customer password recovery request',
  });

  let status: 'passed' | 'failed' = 'passed';

  try {
    await captureJourneyStep(
      journey,
      page,
      {
        actionLabel: 'Buka layar forgot password',
        expectedResult: 'Form reset password tampil dengan input nomor ponsel dan CTA kirim OTP.',
        title: 'Recovery screen is ready',
      },
      async () => {
        await page.goto('/id/forgot-password');
        await expect(page.getByRole('button', { name: /Kirim OTP|Send OTP/i })).toBeVisible();
      },
    );

    await captureJourneyStep(
      journey,
      page,
      {
        actionLabel: 'Masukkan nomor customer seeded lalu kirim OTP',
        expectedResult: 'UI berpindah ke state OTP dengan challenge id dan destinasi masked.',
        title: 'OTP request starts the recovery challenge',
      },
      async () => {
        await page.getByLabel(/Nomor ponsel|Phone number/i).fill(viewerAccounts.customer.phone);
        await page.getByRole('button', { name: /Kirim OTP|Send OTP/i }).click();
        await expect(page.getByLabel(/Challenge ID/i)).toBeVisible();
        await expect(page.getByText(/OTP sedang dikirim ke/i)).toBeVisible();
      },
    );
  } catch (error) {
    status = 'failed';
    throw error;
  } finally {
    await completeJourney(journey, { status });
  }
});

test('journey: new customer can register from the native Bidan screen', async ({ page }, testInfo) => {
  const uniquePhone = `+6281299${Date.now().toString().slice(-6)}`;
  const journey = await beginJourney(testInfo, {
    category: 'auth',
    description:
      'A brand new viewer opens the native Bidan register screen, creates an account, and lands in the authenticated customer flow.',
    id: 'customer-register-success',
    persona: 'visitor',
    preconditions: ['Bidan demo runtime aktif.', 'Belum ada akun dengan nomor ponsel yang dipakai untuk test ini.'],
    seed: {
      actor: 'visitor',
      credentialLabel: `${uniquePhone} / JourneyReg#2026`,
      notes: 'Nomor ponsel dibuat unik per run agar pendaftaran tetap idempotent terhadap latest-only artifacts.',
    },
    title: 'Customer native register flow',
  });

  let status: 'passed' | 'failed' = 'passed';

  try {
    await captureJourneyStep(
      journey,
      page,
      {
        actionKind: 'navigate',
        actionLabel: 'Buka layar daftar customer',
        assertions: ['Form daftar tampil lengkap dengan field nama, nomor, kota, dan password.'],
        expectedResult: 'Form register native Bidan tampil dan siap dipakai tanpa redirect ke surface lain.',
        routeId: '/id/register',
        screenId: 'customer-register-screen',
        title: 'Register screen is ready',
      },
      async () => {
        await page.goto('/id/register');
        await expect(page.getByLabel(/Nama lengkap/i)).toBeVisible();
        await expect(page.getByText(/^Daftar$/)).toBeVisible();
        await expect(page.getByRole('button', { name: /Buat akun|Create account/i })).toBeVisible();
      },
    );

    await captureJourneyStep(
      journey,
      page,
      {
        actionKind: 'submit',
        actionLabel: 'Isi identitas customer baru lalu submit',
        assertions: ['Akun baru dibuat.', 'Viewer langsung diarahkan ke /id.'],
        entityRefs: [uniquePhone],
        expectedResult: 'Customer berhasil membuat akun baru dan masuk ke halaman utama Bidan.',
        routeId: '/id',
        screenId: 'customer-home-screen',
        title: 'Customer registers successfully',
      },
      async () => {
        await page.getByLabel(/Nama lengkap/i).fill('Journey Register User');
        await page.getByLabel(/Nomor ponsel|Phone number/i).fill(uniquePhone);
        await page.getByLabel(/Kota/i).fill('Jakarta');
        await page.getByLabel(/Password/i).fill('JourneyReg#2026');
        await page.getByRole('button', { name: /Buat akun|Create account/i }).click();
        await page.waitForURL(/\/id$/);
        await expect(page.getByRole('heading', { name: /Aktivitas|Activity/i })).toBeVisible();
      },
    );
  } catch (error) {
    status = 'failed';
    throw error;
  } finally {
    await completeJourney(journey, { status });
  }
});

test('journey: invalid login shows a friendly error state', async ({ page }, testInfo) => {
  const journey = await beginJourney(testInfo, {
    category: 'auth',
    description:
      'An invalid password attempt stays on the native login screen and surfaces the translated customer-facing error.',
    id: 'customer-invalid-login',
    preconditions: ['Bidan demo seed aktif.', 'Akun customer seeded tersedia.'],
    seed: {
      actor: 'customer',
      credentialLabel: `${viewerAccounts.customer.phone} / wrong-password`,
    },
    title: 'Customer invalid login guard',
  });

  let status: 'passed' | 'failed' = 'passed';

  try {
    await captureJourneyStep(
      journey,
      page,
      {
        actionKind: 'navigate',
        actionLabel: 'Buka layar login customer',
        assertions: ['Form login tampil di domain Bidan.'],
        expectedResult: 'Form login siap dipakai untuk pengujian kredensial salah.',
        routeId: '/id/login',
        screenId: 'customer-login-screen',
        title: 'Login screen is ready for guard validation',
      },
      async () => {
        await page.goto('/id/login');
        await expect(page.getByLabel(/Nomor ponsel|Phone number/i)).toBeVisible();
      },
    );

    await captureJourneyStep(
      journey,
      page,
      {
        actionKind: 'submit',
        actionLabel: 'Masukkan password yang salah',
        assertions: ['User tetap di layar login.', 'Pesan error yang ramah tampil di banner.'],
        entityRefs: [viewerAccounts.customer.phone],
        expectedResult:
          'UI menolak login, tetap berada di layar login, dan menjelaskan bahwa nomor ponsel atau kata sandi tidak cocok.',
        routeId: '/id/login',
        screenId: 'customer-login-error',
        title: 'Friendly error appears for invalid credentials',
      },
      async () => {
        await page.getByLabel(/Nomor ponsel|Phone number/i).fill(viewerAccounts.customer.phone);
        await page.getByLabel(/^Password$/i).fill('WrongPass#2026');
        await page.getByRole('button', { name: /Masuk|Sign in/i }).click();
        await expect(page).toHaveURL(/\/id\/login/);
        await expect(
          page.getByText(/Nomor ponsel atau kata sandi tidak cocok|invalid phone or password/i),
        ).toBeVisible();
      },
    );
  } catch (error) {
    status = 'failed';
    throw error;
  } finally {
    await completeJourney(journey, { status });
  }
});
