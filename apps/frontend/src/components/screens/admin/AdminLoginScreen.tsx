'use client';

import { AlertCircle, ArrowRight, Building2, Clock3, KeyRound, LoaderCircle, Mail, Phone } from 'lucide-react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';
import { ADMIN_DEMO_PASSWORD, useAdminSession } from '@/features/admin/hooks/useAdminSession';
import { ADMIN_NAV_ITEMS, ADMIN_ROUTES, getAdminNavItem } from '@/features/admin/lib/routes';

const focusAreaDescriptions = {
  catalog: 'Persona ini akan lebih sering bekerja di struktur katalog, mode layanan, dan offering.',
  ops: 'Persona ini cocok untuk jalur customer, appointment, dan operasional harian.',
  reviews: 'Persona ini diposisikan untuk approval FIFO, publish, dan QA profil profesional.',
  support: 'Persona ini fokus di triage support, assignment PIC, dan eskalasi kasus aktif.',
} as const;

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

const PersonaMetaTile = ({ icon, label, value }: { icon: ReactNode; label: string; value: string }) => (
  <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
      {icon}
      {label}
    </div>
    <p className="mt-2 text-sm font-semibold text-slate-800">{value}</p>
  </div>
);

export const AdminLoginScreen = () => {
  const router = useRouter();
  const { adminStaff, hasHydrated, isAuthenticated, login, session } = useAdminSession();
  const [selectedAdminId, setSelectedAdminId] = useState(adminStaff[0]?.id || '');
  const [email, setEmail] = useState(adminStaff[0]?.email || '');
  const [password, setPassword] = useState(ADMIN_DEMO_PASSWORD);
  const [errorMessage, setErrorMessage] = useState('');

  const lastVisitedNavItem = getAdminNavItem(session.lastVisitedRoute);

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      router.replace(
        session.lastVisitedRoute?.startsWith('/admin/') && session.lastVisitedRoute !== ADMIN_ROUTES.login
          ? (session.lastVisitedRoute as Route)
          : ADMIN_ROUTES.overview,
      );
    }
  }, [hasHydrated, isAuthenticated, router, session.lastVisitedRoute]);

  useEffect(() => {
    const selectedAdmin = adminStaff.find((admin) => admin.id === selectedAdminId);

    if (selectedAdmin) {
      setEmail(selectedAdmin.email);
    }
  }, [adminStaff, selectedAdminId]);

  const selectedAdmin = adminStaff.find((admin) => admin.id === selectedAdminId) || adminStaff[0];
  const selectedFocusModules = selectedAdmin
    ? ADMIN_NAV_ITEMS.filter(
        (item) =>
          item.focusArea === selectedAdmin.focusArea || item.focusArea === 'all' || item.href === ADMIN_ROUTES.support,
      ).slice(0, 4)
    : [];
  const canSubmit = hasHydrated && Boolean(selectedAdmin) && Boolean(email.trim()) && Boolean(password.trim());

  const handleSubmit = () => {
    if (!selectedAdmin) {
      setErrorMessage('Roster admin tidak tersedia.');
      return;
    }

    const didLogin = login({
      admin: selectedAdmin,
      email: email.trim(),
      password,
    });

    if (!didLogin) {
      setErrorMessage('Email harus sesuai dengan persona dan password demo harus benar.');
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
      <div className="mx-auto grid max-w-[1320px] gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[36px] border border-white/70 bg-[linear-gradient(180deg,rgba(15,23,42,0.96)_0%,rgba(30,41,59,0.96)_100%)] p-8 text-white shadow-[0_40px_80px_-50px_rgba(15,23,42,0.75)]">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-200">
            <Building2 className="h-4 w-4" />
            Internal Admin Surface
          </div>
          <h1 className="mt-8 max-w-[16ch] text-[40px] font-black leading-[1.05] tracking-[-0.04em]">
            BidanApp Ops Console
          </h1>
          <p className="mt-5 max-w-[44ch] text-[15px] leading-7 text-slate-300">
            Admin area ini dipisah dari shell mobile user dan professional. Gunakan untuk triage support, approval
            profesional, kontrol katalog, operasional appointment, dan pengelolaan mock lokal.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <InfoTile
              title="Scope aktif"
              body="Support desk, queue approval FIFO, customer context, booking ops, catalog, dan raw mock studio."
            />
            <InfoTile
              title="Model data"
              body="Perubahan admin hidup di snapshot lokal browser. Seed repo tetap aman dan tidak ditulis oleh UI."
            />
            <InfoTile
              title="Flow cepat"
              body="Setelah login gunakan Ctrl/Cmd + K untuk pindah modul, lalu lanjut dari route terakhir bila tersedia."
            />
            <InfoTile title="Password demo" body={ADMIN_DEMO_PASSWORD} highlighted />
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
                ? `Console akan melanjutkan ke ${lastVisitedNavItem.label} setelah login berhasil.`
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
            className="mt-8 grid gap-6"
            onSubmit={(event) => {
              event.preventDefault();
              handleSubmit();
            }}
          >
            <div className="grid gap-3">
              {adminStaff.map((admin) => {
                const isSelected = admin.id === selectedAdminId;

                return (
                  <button
                    key={admin.id}
                    type="button"
                    onClick={() => setSelectedAdminId(admin.id)}
                    className={`rounded-[24px] border px-4 py-4 text-left transition ${
                      isSelected
                        ? 'border-slate-900 bg-slate-900 text-white shadow-[0_18px_36px_-24px_rgba(15,23,42,0.6)]'
                        : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[15px] font-semibold">{admin.name}</p>
                        <p className={`mt-1 text-[12px] ${isSelected ? 'text-slate-200' : 'text-slate-500'}`}>
                          {admin.title}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                          isSelected ? 'bg-white/10 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {admin.focusArea}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedAdmin ? (
              <div className="rounded-[30px] border border-slate-200 bg-slate-50/90 p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Persona preview
                    </p>
                    <h3 className="mt-2 text-[22px] font-black tracking-[-0.03em] text-slate-950">
                      {selectedAdmin.name}
                    </h3>
                    <p className="mt-2 max-w-[52ch] text-sm leading-7 text-slate-600">
                      {focusAreaDescriptions[selectedAdmin.focusArea]}
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                    Shift {selectedAdmin.shiftLabel}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <PersonaMetaTile icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={selectedAdmin.email} />
                  <PersonaMetaTile icon={<Phone className="h-3.5 w-3.5" />} label="Phone" value={selectedAdmin.phone} />
                  <PersonaMetaTile
                    icon={<Clock3 className="h-3.5 w-3.5" />}
                    label="Presence"
                    value={selectedAdmin.presence}
                  />
                  <PersonaMetaTile
                    icon={<ArrowRight className="h-3.5 w-3.5" />}
                    label="Priority modules"
                    value={selectedFocusModules.map((item) => item.shortLabel).join(' · ')}
                  />
                </div>
              </div>
            ) : null}

            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-[12px] font-semibold text-slate-500">Email admin</span>
                <input
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  placeholder="admin@bidanapp.test"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-[12px] font-semibold text-slate-500">Password demo</span>
                <input
                  autoComplete="current-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  placeholder="Admin123!"
                />
              </label>

              {errorMessage ? (
                <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              ) : null}

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {hasHydrated
                  ? `Setelah login, console akan membuka ${lastVisitedNavItem?.label || 'Overview'} dan quick jump siap dipakai untuk pindah modul.`
                  : 'Memeriksa session admin lokal sebelum form diaktifkan.'}
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {hasHydrated ? (
                  <>
                    Masuk ke admin console
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Menyiapkan session
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};
