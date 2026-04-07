'use client';

import {
  AlertCircle,
  ArrowRight,
  Building2,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  adminBadgeClass,
  adminDarkSurfaceClass,
  adminInsetSurfaceClass,
  adminMonoClass,
  adminPrimaryButtonClass,
  adminSurfaceClass,
} from '@/components/screens/admin/admin-theme';
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

const InsightCard = ({ title, body, value }: { body: string; title: string; value: string }) => (
  <div className="rounded-[24px] border border-white/10 bg-white/[0.06] p-4">
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">{title}</p>
    <p className={`mt-3 text-[26px] font-black tracking-[-0.04em] text-white ${adminMonoClass}`}>{value}</p>
    <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
  </div>
);

const SecurityNote = ({ body, title }: { body: string; title: string }) => (
  <div className={`${adminInsetSurfaceClass} px-4 py-4`}>
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{title}</p>
    <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
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
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.2)_0%,transparent_26%),linear-gradient(180deg,#edf3f9_0%,#f7fafc_100%)] px-4 py-8 lg:px-8">
        <div className="mx-auto flex min-h-[72vh] max-w-[920px] items-center justify-center">
          <div className={`${adminSurfaceClass} max-w-[560px] px-8 py-10 text-center`}>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-[#0f4fa8]">
              <LoaderCircle className="h-7 w-7 animate-spin" />
            </div>
            <h1 className="mt-5 text-[28px] font-black tracking-[-0.04em] text-slate-950">
              Mengarahkan ke dashboard admin
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Session admin masih aktif. Anda akan dibawa kembali ke
              <span className="font-semibold text-slate-900"> {lastVisitedNavItem?.label || 'Overview'}</span>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.2)_0%,transparent_26%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.12)_0%,transparent_24%),linear-gradient(180deg,#edf3f9_0%,#f7fafc_100%)] px-4 py-8 text-slate-900 lg:px-8">
      <div className="mx-auto grid max-w-[1320px] gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className={`${adminDarkSurfaceClass} p-8 text-white`}>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
              <ShieldCheck className="h-4 w-4" />
              Secure admin access
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
              <Building2 className="h-4 w-4" />
              BidanApp Ops Console
            </span>
          </div>

          <h1 className="mt-8 max-w-[14ch] text-[42px] font-black leading-[1.04] tracking-[-0.05em]">
            Admin dashboard yang lebih rapi dan mudah dipahami.
          </h1>
          <p className="mt-5 max-w-[46ch] text-[15px] leading-7 text-slate-300">
            Console admin sekarang dirancang ulang seperti dashboard operasional yang umum: navigasi tetap, ringkasan
            KPI, antrian kerja, dan kontrol data yang lebih cepat dipindai.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <InsightCard
              title="Support"
              value="Desk"
              body="Ticket aktif, refund, dan eskalasi sekarang diletakkan dalam pola helpdesk yang lebih familiar."
            />
            <InsightCard
              title="Review"
              value="Queue"
              body="Approval profesional dan publish lifecycle diringkas sebagai antrean kerja yang jelas."
            />
            <InsightCard
              title="Data"
              value="Sync"
              body="Status studio dan perubahan data ditampilkan sebagai signal operasional, bukan panel tersembunyi."
            />
          </div>

          <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.06] p-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-100">
                Resume session
              </span>
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-100">
                {session.lastLoginAt ? formatDateLabel(session.lastLoginAt) : 'Belum ada sesi'}
              </span>
            </div>
            <p className="mt-4 text-[24px] font-black tracking-[-0.04em] text-white">
              {lastVisitedNavItem ? lastVisitedNavItem.label : 'Overview'}
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-300">
              {lastVisitedNavItem
                ? `Setelah login berhasil, admin akan langsung kembali ke modul ${lastVisitedNavItem.label}.`
                : 'Belum ada modul tersimpan, jadi login akan memulai dari halaman Overview.'}
            </p>
          </div>
        </section>

        <section className={`${adminSurfaceClass} p-6 sm:p-8`}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-[#0f4fa8]">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Admin Login</p>
              <h2 className="mt-1 text-[26px] font-black tracking-[-0.04em] text-slate-950">Masuk ke dashboard</h2>
            </div>
          </div>

          <div className={`${adminInsetSurfaceClass} mt-6 px-4 py-4`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className={adminBadgeClass}>Protected route</span>
              <span className={adminBadgeClass}>Backend session</span>
              <span className={adminBadgeClass}>{lastVisitedNavItem?.label || 'Overview'}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Setelah login, console akan membuka modul terakhir yang tersimpan dan menghydrate data admin dari backend
              aktif.
            </p>
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
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
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
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
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

            <button type="submit" disabled={!canSubmit} className={adminPrimaryButtonClass}>
              {!hasHydrated || isSubmitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Memproses sesi
                </>
              ) : (
                <>
                  Masuk ke admin dashboard
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <SecurityNote
              title="Validasi"
              body="Kredensial admin diverifikasi oleh backend. Browser hanya memegang session yang sudah sah."
            />
            <SecurityNote
              title="Resume"
              body={
                hasHydrated
                  ? `Setelah login, admin akan melanjutkan ke ${lastVisitedNavItem?.label || 'Overview'}.`
                  : 'Sistem sedang memeriksa apakah ada session admin aktif sebelum form digunakan.'
              }
            />
          </div>
        </section>
      </div>
    </div>
  );
};
