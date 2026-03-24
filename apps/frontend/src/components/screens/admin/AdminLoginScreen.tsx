'use client';

import { AlertCircle, ArrowRight, Building2, KeyRound, LoaderCircle, LockKeyhole, Mail } from 'lucide-react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAdminSession } from '@/features/admin/hooks/useAdminSession';
import { ADMIN_ROUTES, getAdminNavItem } from '@/features/admin/lib/routes';

const formatDateLabel = (value?: string) => {
  if (!value) {
    return 'Belum tersedia';
  }

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const InfoTile = ({ body, highlighted = false, title }: { body: string; highlighted?: boolean; title: string }) => (
  <div
    className={`rounded-[26px] border px-4 py-4 ${
      highlighted ? 'border-amber-300 bg-amber-300/10 text-white' : 'border-white/10 bg-white/6 text-slate-200'
    }`}
  >
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">{title}</p>
    <p className={`mt-2 text-[14px] leading-6 ${highlighted ? 'font-bold text-amber-100' : ''}`}>{body}</p>
  </div>
);

export const AdminLoginScreen = () => {
  const router = useRouter();
  const { hasHydrated, isAuthenticated, login, session } = useAdminSession();
  const [email, setEmail] = useState(session.email || '');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const lastVisitedNavItem = getAdminNavItem(session.lastVisitedRoute);

  useEffect(() => {
    if (session.email) {
      setEmail((currentEmail) => currentEmail || session.email);
    }
  }, [session.email]);

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      router.replace(
        session.lastVisitedRoute?.startsWith('/admin/') && session.lastVisitedRoute !== ADMIN_ROUTES.login
          ? (session.lastVisitedRoute as Route)
          : ADMIN_ROUTES.overview,
      );
    }
  }, [hasHydrated, isAuthenticated, router, session.lastVisitedRoute]);

  const canSubmit = hasHydrated && Boolean(email.trim()) && Boolean(password.trim()) && !isSubmitting;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const didLogin = await login({
      email: email.trim(),
      password,
    });
    setIsSubmitting(false);

    if (!didLogin) {
      setErrorMessage('Email atau kata sandi admin tidak valid.');
      return;
    }

    setErrorMessage('');
    router.replace(
      session.lastVisitedRoute?.startsWith('/admin/') && session.lastVisitedRoute !== ADMIN_ROUTES.login
        ? (session.lastVisitedRoute as Route)
        : ADMIN_ROUTES.overview,
    );
  };

  if (hasHydrated && isAuthenticated) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#DBEAFE_0%,transparent_34%),radial-gradient(circle_at_bottom_right,#FDE68A_0%,transparent_28%),linear-gradient(180deg,#E2E8F0_0%,#F8FAFC_34%,#F8FAFC_100%)] px-4 py-8 text-slate-900 lg:px-8">
        <div className="mx-auto flex min-h-[70vh] max-w-[920px] items-center justify-center">
          <div className="rounded-[32px] border border-slate-200 bg-white/92 px-8 py-10 text-center shadow-[0_30px_70px_-45px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-slate-500" />
            <h1 className="mt-4 text-[26px] font-black tracking-[-0.03em] text-slate-950">Mengarahkan ke console</h1>
            <p className="mt-2 max-w-[42ch] text-sm leading-7 text-slate-500">
              Session admin masih aktif. Anda akan dibawa kembali ke{' '}
              <span className="font-semibold text-slate-900">{lastVisitedNavItem?.label || 'Overview'}</span>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#DBEAFE_0%,transparent_34%),radial-gradient(circle_at_bottom_right,#FDE68A_0%,transparent_28%),linear-gradient(180deg,#E2E8F0_0%,#F8FAFC_34%,#F8FAFC_100%)] px-4 py-8 text-slate-900 lg:px-8">
      <div className="mx-auto grid max-w-[1280px] gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[36px] border border-white/70 bg-[linear-gradient(180deg,rgba(15,23,42,0.96)_0%,rgba(30,41,59,0.96)_100%)] p-8 text-white shadow-[0_40px_80px_-50px_rgba(15,23,42,0.75)]">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-200">
            <Building2 className="h-4 w-4" />
            Internal Admin Surface
          </div>
          <h1 className="mt-8 max-w-[16ch] text-[40px] font-black leading-[1.05] tracking-[-0.04em]">
            BidanApp Ops Console
          </h1>
          <p className="mt-5 max-w-[44ch] text-[15px] leading-7 text-slate-300">
            Surface admin ini diproteksi oleh session backend. Gunakan email admin dan kata sandi yang diterbitkan tim
            internal untuk masuk ke desk support, approval profesional, katalog, dan operasi appointment.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <InfoTile
              title="Kontrol akses"
              body="Autentikasi admin sekarang diterbitkan backend dan semua route admin memerlukan bearer session aktif."
              highlighted
            />
            <InfoTile
              title="State ops"
              body="Desk support, data studio, dan snapshot admin hanya dihydrate setelah session tervalidasi."
            />
            <InfoTile
              title="Flow cepat"
              body="Setelah login berhasil, console akan melanjutkan ke route terakhir bila tersedia dan quick jump tetap aktif."
            />
            <InfoTile
              title="Boundary"
              body="Kredensial admin tidak pernah divalidasi di browser. Semua verifikasi sesi berlangsung di backend."
            />
          </div>

          <div className="mt-10 rounded-[30px] border border-white/10 bg-white/6 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">Resume hint</p>
                <p className="mt-2 text-[22px] font-black tracking-[-0.03em] text-white">
                  {lastVisitedNavItem ? lastVisitedNavItem.label : 'Overview'}
                </p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-200">
                {session.lastLoginAt ? formatDateLabel(session.lastLoginAt) : 'Belum ada sesi'}
              </span>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {lastVisitedNavItem
                ? `Session baru akan melanjutkan ke ${lastVisitedNavItem.label} setelah login berhasil.`
                : 'Belum ada route yang tersimpan, jadi login akan memulai dari Overview.'}
            </p>
          </div>
        </section>

        <section className="rounded-[36px] border border-slate-200 bg-white/92 p-6 shadow-[0_30px_70px_-45px_rgba(15,23,42,0.35)] backdrop-blur-xl sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Admin Login</p>
              <h2 className="mt-1 text-[24px] font-black tracking-[-0.03em] text-slate-950">Masuk ke console</h2>
            </div>
          </div>

          <form
            className="mt-8 grid gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSubmit();
            }}
          >
            <label className="grid gap-2">
              <span className="text-[12px] font-semibold text-slate-500">Email admin</span>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <Mail className="h-4 w-4 text-slate-400" />
                <input
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full bg-transparent text-sm outline-none"
                  placeholder="admin@bidanapp.id"
                />
              </div>
            </label>

            <label className="grid gap-2">
              <span className="text-[12px] font-semibold text-slate-500">Kata sandi admin</span>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <LockKeyhole className="h-4 w-4 text-slate-400" />
                <input
                  autoComplete="current-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full bg-transparent text-sm outline-none"
                  placeholder="Masukkan kata sandi admin"
                />
              </div>
            </label>

            {errorMessage ? (
              <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            ) : null}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {hasHydrated
                ? `Console akan membuka ${lastVisitedNavItem?.label || 'Overview'} setelah login, lalu seluruh modul admin akan hydrate dari backend sesuai session aktif.`
                : 'Memeriksa session admin yang masih aktif sebelum form diaktifkan.'}
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {!hasHydrated || isSubmitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Memproses sesi
                </>
              ) : (
                <>
                  Masuk ke admin console
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};
