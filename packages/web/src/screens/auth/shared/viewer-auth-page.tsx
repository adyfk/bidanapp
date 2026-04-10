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
  const visitorHref = createLocalizedPath(locale);
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
      redirectToTarget(defaultNextPath || createLocalizedPath(locale));
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

      <section
        className="rounded-[30px] border p-5 shadow-[0_24px_48px_-34px_rgba(88,49,66,0.16)]"
        style={{
          background:
            'linear-gradient(180deg, #FFFFFF 0%, color-mix(in srgb, var(--ui-surface-muted) 42%, white) 100%)',
          borderColor: 'var(--ui-border)',
        }}
      >
        {session?.isAuthenticated ? (
          <>
            <MarketplaceSectionHeader
              title={en ? 'Account is already active' : 'Akun sudah aktif'}
              description={
                session.customerProfile?.displayName || session.phone || (en ? 'Customer account' : 'Akun customer')
              }
            />
            <div className="space-y-3">
              <a href={defaultNextPath || createLocalizedPath(locale)}>
                <PrimaryButton className="w-full" type="button">
                  {en ? 'Continue to app' : 'Lanjut ke aplikasi'}
                </PrimaryButton>
              </a>
              <a href={securityHref}>
                <SecondaryButton className="w-full" type="button">
                  {en ? 'Account' : 'Akun'}
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
        <section
          className="rounded-[28px] border p-5 shadow-[0_24px_48px_-36px_rgba(88,49,66,0.14)]"
          style={{
            background:
              'linear-gradient(180deg, #FFFFFF 0%, color-mix(in srgb, var(--ui-surface-muted) 34%, white) 100%)',
            borderColor: 'var(--ui-border)',
          }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--ui-primary)' }}>
            {en ? 'Other paths' : 'Jalur lain'}
          </p>
          <h2 className="mt-3 text-[18px] font-bold text-slate-900">
            {en ? 'Keep browsing without clutter' : 'Tetap lanjut tanpa terasa berat'}
          </h2>
          <p className="mt-2 text-[13px] leading-6 text-slate-500">
            {en
              ? 'Visitor and professional paths stay available, but they now sit as calmer secondary options.'
              : 'Jalur visitor dan profesional tetap tersedia, tetapi sengaja diturunkan sebagai opsi sekunder yang lebih tenang.'}
          </p>

          <div className={`mt-4 grid gap-3 ${isHub ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
            <a
              className="rounded-[24px] border p-4 shadow-[0_18px_36px_-30px_rgba(88,49,66,0.12)] transition-all hover:-translate-y-0.5 active:scale-[0.99]"
              href={visitorHref}
              style={{
                background:
                  'linear-gradient(180deg, #FFFFFF 0%, color-mix(in srgb, var(--ui-surface-muted) 56%, white) 100%)',
                borderColor: 'var(--ui-border)',
              }}
            >
              <p className="text-[15px] font-bold text-slate-900">{en ? 'Visitor mode' : 'Mode visitor'}</p>
              <p className="mt-2 text-[12px] leading-5 text-slate-500">
                {en
                  ? 'Explore services and professionals first.'
                  : 'Jelajahi layanan dan profesional lebih dulu tanpa login.'}
              </p>
            </a>

            {!isHub ? (
              <a
                className="rounded-[24px] border p-4 shadow-[0_18px_36px_-30px_rgba(88,49,66,0.12)] transition-all hover:-translate-y-0.5 active:scale-[0.99]"
                href={professionalHref}
                style={{
                  background:
                    'linear-gradient(180deg, #FFFFFF 0%, color-mix(in srgb, var(--ui-surface-muted) 56%, white) 100%)',
                  borderColor: 'var(--ui-border)',
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-pink-500 shadow-sm">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-bold text-slate-900">
                      {en ? 'Professional path' : 'Jalur profesional'}
                    </p>
                    <p className="mt-2 text-[12px] leading-5 text-slate-500">
                      {en
                        ? 'Manage services, review state, and work readiness.'
                        : 'Kelola layanan, status review, dan kesiapan kerja dari jalur profesional.'}
                    </p>
                  </div>
                </div>
              </a>
            ) : null}
          </div>
        </section>
      ) : null}
    </MarketplaceAuthShell>
  );
}
