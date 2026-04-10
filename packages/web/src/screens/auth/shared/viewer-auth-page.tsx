'use client';

import type { ViewerSession } from '@marketplace/marketplace-core/viewer-auth';
import { getPlatformCopy, type ServicePlatformId } from '@marketplace/platform-config';
import { MarketplaceAccessTabs, MarketplaceSectionHeader } from '@marketplace/ui/marketplace-lite';
import { MessageBanner, PrimaryButton, SecondaryButton } from '@marketplace/ui/primitives';
import { LogIn, ShieldCheck, Smartphone, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  getFriendlyAuthError,
  redirectToTarget,
  validateLogin,
  validateRecoveryFinish,
  validateRecoveryStart,
  validateRegister,
} from '../../../controllers/viewer-auth';
import { computeLocalHostRedirect } from '../../../lib/local-host-redirect';
import { isEnglishLocale } from '../../../lib/marketplace-copy';
import {
  createLocalizedPath,
  createPlatformForgotPasswordPath,
  createPlatformLoginPath,
  createPlatformRegisterPath,
  createViewerSecurityHref,
} from '../../../lib/platform';
import { MarketplaceAuthHero } from './parts/auth-hero';
import { MarketplaceAuthShell, resolveDefaultAuthBackHref } from './parts/auth-shell';
import { MarketplaceLoginForm } from './parts/login-form';
import { MarketplaceRecoveryForm } from './parts/recovery-form';
import { MarketplaceRegisterForm } from './parts/register-form';
import { authContext, viewerAuthClient } from './runtime';
import { useViewerAuthController } from './use-viewer-auth-controller';
import type { MarketplaceAuthFeedbackTone, MarketplaceAuthMode } from './view-model';

export function ViewerAuthPage({
  defaultNextPath,
  initialSession,
  isHub = false,
  locale,
  mode,
  platformId,
}: {
  defaultNextPath: string;
  initialSession?: ViewerSession | null;
  isHub?: boolean;
  locale: string;
  mode: MarketplaceAuthMode;
  platformId?: ServicePlatformId;
}) {
  const viewerAuth = useViewerAuthController();
  const platform = authContext(platformId, isHub);
  const platformCopy = platform ? getPlatformCopy(platform, locale) : null;
  const en = isEnglishLocale(locale);

  const [session, setSession] = useState<ViewerSession | null>(initialSession ?? null);
  const [feedback, setFeedback] = useState('');
  const [feedbackTone, setFeedbackTone] = useState<MarketplaceAuthFeedbackTone>('info');
  const [busy, setBusy] = useState(false);
  const [loginForm, setLoginForm] = useState({ password: '', phone: '' });
  const [registerForm, setRegisterForm] = useState({ city: '', displayName: '', password: '', phone: '' });
  const [recoveryForm, setRecoveryForm] = useState({ challengeId: '', code: '', newPassword: '', phone: '' });
  const [recoveryMaskedDestination, setRecoveryMaskedDestination] = useState('');

  const loginHref = createPlatformLoginPath(locale, defaultNextPath);
  const registerHref = createPlatformRegisterPath(locale, defaultNextPath);
  const forgotPasswordHref = createPlatformForgotPasswordPath(locale, defaultNextPath);
  const securityHref = createViewerSecurityHref(locale, platformId);
  const visitorHref = createLocalizedPath(locale, '/home');
  const professionalHref = createLocalizedPath(locale, '/professionals/apply');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const redirectUrl = computeLocalHostRedirect(window.location.href, process.env.NEXT_PUBLIC_SITE_URL ?? '');
    if (redirectUrl) {
      window.location.replace(redirectUrl);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const payload = await viewerAuth.fetchSession(viewerAuthClient);
        if (!active) {
          return;
        }
        setSession(payload);
        setRegisterForm((current) => ({
          ...current,
          city: payload.customerProfile?.city || current.city,
          displayName: payload.customerProfile?.displayName || current.displayName,
          phone: payload.customerProfile?.primaryPhone || payload.phone || current.phone,
        }));
      } catch {
        if (active) {
          setSession(initialSession ?? null);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [initialSession, viewerAuth]);

  const setFeedbackMessage = (message: string, tone: MarketplaceAuthFeedbackTone) => {
    setFeedback(message);
    setFeedbackTone(tone);
  };

  const handleAuthSubmit = async () => {
    const error = mode === 'register' ? validateRegister(registerForm) : validateLogin(loginForm);
    if (error) {
      setFeedbackMessage(error, 'danger');
      return;
    }

    try {
      setBusy(true);
      setFeedbackMessage('', 'info');
      const payload =
        mode === 'register'
          ? await viewerAuth.registerAccount(viewerAuthClient, registerForm)
          : await viewerAuth.createSession(viewerAuthClient, loginForm);
      setSession(payload);
      redirectToTarget(defaultNextPath || createLocalizedPath(locale, '/home'));
    } catch (error) {
      setFeedbackMessage(getFriendlyAuthError(error), 'danger');
    } finally {
      setBusy(false);
    }
  };

  const handleRequestPasswordReset = async () => {
    const error = validateRecoveryStart(recoveryForm);
    if (error) {
      setFeedbackMessage(error, 'danger');
      return;
    }

    try {
      setBusy(true);
      setFeedbackMessage('', 'info');
      const payload = await viewerAuth.requestPasswordReset(viewerAuthClient, {
        phone: recoveryForm.phone,
      });
      setRecoveryForm((current) => ({
        ...current,
        challengeId: payload.challenge.challengeId,
      }));
      setRecoveryMaskedDestination(payload.challenge.destinationMasked || '');
      setFeedbackMessage(payload.message, 'success');
    } catch (error) {
      setFeedbackMessage(getFriendlyAuthError(error), 'danger');
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async () => {
    const error = validateRecoveryFinish(recoveryForm);
    if (error) {
      setFeedbackMessage(error, 'danger');
      return;
    }

    try {
      setBusy(true);
      setFeedbackMessage('', 'info');
      const payload = await viewerAuth.resetPassword(viewerAuthClient, {
        challengeId: recoveryForm.challengeId,
        code: recoveryForm.code,
        newPassword: recoveryForm.newPassword,
      });
      setFeedbackMessage(payload.message, 'success');
      redirectToTarget(loginHref);
    } catch (error) {
      setFeedbackMessage(getFriendlyAuthError(error), 'danger');
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    try {
      setBusy(true);
      const payload = await viewerAuth.deleteSession(viewerAuthClient);
      setSession(payload);
      redirectToTarget(createLocalizedPath(locale));
    } finally {
      setBusy(false);
    }
  };

  const headerTitle = session?.isAuthenticated
    ? platform
      ? en
        ? `${platform.name} account ready`
        : `Akun ${platform.name} siap dipakai`
      : en
        ? 'Account ready'
        : 'Akun siap dipakai'
    : mode === 'register'
      ? platform
        ? en
          ? `Create your ${platform.name} account`
          : `Buat akun ${platform.name}`
        : en
          ? 'Create account'
          : 'Daftar akun'
      : mode === 'forgot-password'
        ? en
          ? 'Reset password'
          : 'Reset password'
        : platform
          ? (platformCopy?.authTitle ?? `Masuk ke ${platform.name}`)
          : en
            ? 'Sign in'
            : 'Masuk';

  const headerDescription = session?.isAuthenticated
    ? en
      ? 'Continue to orders, profile, and follow-up.'
      : 'Lanjutkan ke order, profil, dan tindak lanjut Anda.'
    : mode === 'register'
      ? en
        ? 'Create one customer account for orders, support, and reminders.'
        : 'Buat satu akun customer untuk order, support, dan pengingat.'
      : mode === 'forgot-password'
        ? en
          ? 'Use your registered phone number, receive OTP, then set a new password.'
          : 'Masukkan nomor terdaftar, terima OTP, lalu buat password baru.'
        : (platformCopy?.authDescription ??
          (en
            ? 'Use your phone number and password to continue.'
            : 'Masukkan nomor ponsel dan password untuk melanjutkan.'));

  const benefitItems = session?.isAuthenticated
    ? [
        {
          icon: <ShieldCheck className="h-4 w-4" />,
          label: en ? 'Orders and support stay saved.' : 'Order dan support tetap tersimpan.',
        },
        {
          icon: <LogIn className="h-4 w-4" />,
          label: en ? 'Continue faster next time.' : 'Lanjut lebih cepat di kunjungan berikutnya.',
        },
        {
          icon: <Smartphone className="h-4 w-4" />,
          label: en ? 'Security tools stay ready.' : 'Alat keamanan tetap siap dipakai.',
        },
      ]
    : mode === 'register'
      ? [
          {
            icon: <ShieldCheck className="h-4 w-4" />,
            label: en ? 'Keep orders in one account.' : 'Simpan order dalam satu akun.',
          },
          {
            icon: <LogIn className="h-4 w-4" />,
            label: en ? 'Save reminders and follow-up.' : 'Simpan pengingat dan tindak lanjut.',
          },
          {
            icon: <UserPlus className="h-4 w-4" />,
            label: en ? 'Support stays attached to your account.' : 'Support tetap menempel di akun Anda.',
          },
        ]
      : mode === 'forgot-password'
        ? [
            {
              icon: <Smartphone className="h-4 w-4" />,
              label: en ? 'OTP is sent to your registered phone number.' : 'OTP dikirim ke nomor ponsel terdaftar.',
            },
            {
              icon: <ShieldCheck className="h-4 w-4" />,
              label: en ? 'Create a new password after verification.' : 'Buat password baru setelah verifikasi.',
            },
          ]
        : [
            {
              icon: <ShieldCheck className="h-4 w-4" />,
              label: en ? 'Open orders, profile, and reminders.' : 'Buka order, profil, dan pengingat Anda.',
            },
            {
              icon: <LogIn className="h-4 w-4" />,
              label: en ? 'Sign in with your phone number.' : 'Masuk dengan nomor ponsel Anda.',
            },
            {
              icon: <Smartphone className="h-4 w-4" />,
              label: en ? 'Security and device control stay ready.' : 'Keamanan akun dan kontrol perangkat tetap siap.',
            },
          ];

  return (
    <MarketplaceAuthShell
      backHref={resolveDefaultAuthBackHref(locale, isHub)}
      title={
        mode === 'forgot-password'
          ? en
            ? 'Reset password'
            : 'Reset password'
          : (platform?.name ?? (en ? 'Account' : 'Akun'))
      }
    >
      <MarketplaceAuthHero
        badgeLabel={mode === 'forgot-password' ? 'Recovery' : en ? 'Customer access' : 'Akses customer'}
        benefitItems={mode === 'forgot-password' ? benefitItems.slice(0, 2) : benefitItems}
        description={headerDescription}
        statusLabel={
          session?.isAuthenticated ? (en ? 'Active account' : 'Akun aktif') : en ? 'Customer path' : 'Jalur customer'
        }
        title={headerTitle}
      />

      <section className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm">
        {session?.isAuthenticated ? (
          <>
            <MarketplaceSectionHeader
              title={en ? 'Account is already active' : 'Akun sudah aktif'}
              description={
                session.customerProfile?.displayName || session.phone || (en ? 'Customer account' : 'Akun customer')
              }
            />
            <div className="space-y-3">
              <a href={defaultNextPath || createLocalizedPath(locale, '/home')}>
                <PrimaryButton className="w-full" type="button">
                  {en ? 'Continue to app' : 'Lanjut ke aplikasi'}
                </PrimaryButton>
              </a>
              <a href={securityHref}>
                <SecondaryButton className="w-full" type="button">
                  {en ? 'Open account settings' : 'Buka pengaturan akun'}
                </SecondaryButton>
              </a>
              <SecondaryButton className="w-full" disabled={busy} onClick={() => void handleLogout()} type="button">
                {busy ? 'Memproses...' : 'Keluar'}
              </SecondaryButton>
            </div>
          </>
        ) : (
          <>
            {mode === 'forgot-password' ? null : (
              <MarketplaceAccessTabs
                items={[
                  { href: loginHref, label: en ? 'Sign in' : 'Masuk', value: 'login' },
                  { href: registerHref, label: en ? 'Register' : 'Daftar', value: 'register' },
                ]}
                value={mode === 'register' ? 'register' : 'login'}
              />
            )}

            {mode === 'login' ? (
              <MarketplaceLoginForm
                busy={busy}
                forgotPasswordHref={forgotPasswordHref}
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleAuthSubmit();
                }}
                password={loginForm.password}
                phone={loginForm.phone}
                platformLabel={platform ? platform.name : en ? 'Customer access' : 'Akses customer'}
                setPassword={(value) => setLoginForm((current) => ({ ...current, password: value }))}
                setPhone={(value) => setLoginForm((current) => ({ ...current, phone: value }))}
                submitLabel={busy ? 'Memproses...' : en ? 'Sign in' : 'Masuk'}
              />
            ) : mode === 'register' ? (
              <MarketplaceRegisterForm
                busy={busy}
                city={registerForm.city}
                displayName={registerForm.displayName}
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleAuthSubmit();
                }}
                password={registerForm.password}
                phone={registerForm.phone}
                setCity={(value) => setRegisterForm((current) => ({ ...current, city: value }))}
                setDisplayName={(value) => setRegisterForm((current) => ({ ...current, displayName: value }))}
                setPassword={(value) => setRegisterForm((current) => ({ ...current, password: value }))}
                setPhone={(value) => setRegisterForm((current) => ({ ...current, phone: value }))}
                submitLabel={busy ? 'Memproses...' : en ? 'Create account' : 'Buat akun'}
              />
            ) : (
              <MarketplaceRecoveryForm
                busy={busy}
                challengeId={recoveryForm.challengeId}
                code={recoveryForm.code}
                maskedDestination={recoveryMaskedDestination}
                newPassword={recoveryForm.newPassword}
                onResend={() => void handleRequestPasswordReset()}
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!recoveryForm.challengeId) {
                    void handleRequestPasswordReset();
                    return;
                  }
                  void handleResetPassword();
                }}
                phone={recoveryForm.phone}
                setChallengeId={(value) => setRecoveryForm((current) => ({ ...current, challengeId: value }))}
                setCode={(value) => setRecoveryForm((current) => ({ ...current, code: value }))}
                setNewPassword={(value) => setRecoveryForm((current) => ({ ...current, newPassword: value }))}
                setPhone={(value) => setRecoveryForm((current) => ({ ...current, phone: value }))}
                submitLabel={
                  busy
                    ? 'Memproses...'
                    : recoveryForm.challengeId
                      ? en
                        ? 'Update password'
                        : 'Ubah password'
                      : en
                        ? 'Send OTP'
                        : 'Kirim OTP'
                }
              />
            )}
          </>
        )}

        {feedback ? (
          <div className="mt-5">
            <MessageBanner tone={feedbackTone}>{feedback}</MessageBanner>
          </div>
        ) : null}

        {!session?.isAuthenticated ? (
          <div className="mt-5 grid gap-3">
            {mode === 'register' ? (
              <a href={loginHref}>
                <SecondaryButton className="w-full" type="button">
                  {en ? 'Already have an account? Sign in' : 'Sudah punya akun? Masuk'}
                </SecondaryButton>
              </a>
            ) : mode === 'forgot-password' ? (
              <a href={loginHref}>
                <SecondaryButton className="w-full" type="button">
                  {en ? 'Back to sign in' : 'Kembali ke login'}
                </SecondaryButton>
              </a>
            ) : (
              <a href={registerHref}>
                <SecondaryButton className="w-full" type="button">
                  {en ? 'Need an account? Register' : 'Belum punya akun? Daftar'}
                </SecondaryButton>
              </a>
            )}
          </div>
        ) : null}
      </section>

      {!session?.isAuthenticated && mode !== 'forgot-password' ? (
        <>
          <div className="rounded-[28px] bg-slate-950 px-5 py-4 text-white shadow-[0_22px_40px_-30px_rgba(15,23,42,0.88)]">
            <p className="text-[15px] font-bold">{en ? 'Continue as visitor' : 'Lanjut sebagai visitor'}</p>
            <p className="mt-2 text-[12px] leading-5 text-white/72">
              {en
                ? 'Explore services and professionals without signing in.'
                : 'Jelajahi layanan dan profesional tanpa harus masuk.'}
            </p>
            <a href={visitorHref}>
              <SecondaryButton
                className="mt-4 w-full border-white/10 bg-white/10 text-white hover:bg-white/12"
                type="button"
              >
                {en ? 'Open visitor mode' : 'Buka mode visitor'}
              </SecondaryButton>
            </a>
          </div>

          {!isHub ? (
            <section
              className="rounded-[26px] border px-5 py-4"
              style={{
                borderColor: '#dbeafe',
                background: 'linear-gradient(135deg,#eff6ff 0%,#ffffff 55%,#ecfeff 100%)',
              }}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold text-gray-900">
                    {en ? 'Continue as a professional' : 'Lanjut sebagai profesional'}
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-gray-500">
                    {en
                      ? 'Open the professional path to manage services, review, and your work schedule.'
                      : 'Buka jalur profesional untuk mengelola layanan, review, dan jadwal kerja Anda.'}
                  </p>
                </div>
              </div>
              <a href={professionalHref}>
                <SecondaryButton className="mt-4 w-full" type="button">
                  {en ? 'Open professional path' : 'Buka jalur profesional'}
                </SecondaryButton>
              </a>
            </section>
          ) : null}
        </>
      ) : null}
    </MarketplaceAuthShell>
  );
}
