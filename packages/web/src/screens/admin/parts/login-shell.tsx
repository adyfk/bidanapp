'use client';

import { AlertCircle, ArrowRight, Building2, LoaderCircle, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { AdminLoginInfoTile } from './login-info-tile';

export function AdminLoginShell({
  busy,
  currentSectionLabel,
  loginForm,
  message,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  selectedPlatformName,
}: {
  busy: boolean;
  currentSectionLabel: string;
  loginForm: { email: string; password: string };
  message: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  selectedPlatformName: string;
}) {
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 lg:px-8">
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1.05fr_0.95fr]">
        <section className="order-2 rounded-[36px] border border-white/70 bg-[linear-gradient(180deg,rgba(15,23,42,0.96)_0%,rgba(30,41,59,0.96)_100%)] p-7 text-white shadow-[0_40px_80px_-50px_rgba(15,23,42,0.75)] lg:order-1 lg:p-8">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-200">
            <Building2 className="h-4 w-4" />
            Admin desk
          </div>
          <h1 className="mt-8 max-w-[16ch] text-[36px] font-black leading-[1.05] tracking-[-0.04em] lg:text-[40px]">
            {selectedPlatformName} admin console
          </h1>
          <p className="mt-5 max-w-[44ch] text-[15px] leading-7 text-slate-300">
            Masuk ke console admin untuk review profesional, support, refund, payout, dan pengawasan order.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <AdminLoginInfoTile
              title="Review"
              body="Buka antrean profesional dan order yang perlu ditindaklanjuti."
              highlighted
            />
            <AdminLoginInfoTile title="Support" body="Pantau support desk dan catatan operasional dari satu tempat." />
            <AdminLoginInfoTile title="Keuangan" body="Refund dan payout tetap berada di jalur kerja yang sama." />
            <AdminLoginInfoTile title="Demo" body="Gunakan akun demo lokal untuk memeriksa alur admin." />
          </div>

          <div className="mt-8 rounded-[30px] border border-white/10 bg-white/[0.06] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">Resume hint</p>
                <p className="mt-2 text-[22px] font-black tracking-[-0.03em] text-white">{currentSectionLabel}</p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-200">
                {selectedPlatformName}
              </span>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Masuk akan membawa Anda kembali ke modul terakhir yang sedang dipakai.
            </p>
          </div>
        </section>

        <section className="order-1 rounded-[36px] border border-slate-200 bg-white/92 p-6 shadow-[0_30px_70px_-45px_rgba(15,23,42,0.35)] backdrop-blur-xl sm:p-8 lg:order-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <ShieldCheck className="h-5 w-5" />
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
              onSubmit();
            }}
          >
            <label className="grid gap-2">
              <span className="text-[12px] font-semibold text-slate-500">Email admin</span>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <Mail className="h-4 w-4 text-slate-400" />
                <input
                  autoComplete="username"
                  value={loginForm.email}
                  onChange={(event) => onEmailChange(event.target.value)}
                  className="w-full bg-transparent text-sm outline-none"
                  placeholder="rani@ops.bidanapp.id"
                  type="email"
                />
              </div>
            </label>

            <label className="grid gap-2">
              <span className="text-[12px] font-semibold text-slate-500">Kata sandi admin</span>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <LockKeyhole className="h-4 w-4 text-slate-400" />
                <input
                  autoComplete="current-password"
                  value={loginForm.password}
                  onChange={(event) => onPasswordChange(event.target.value)}
                  className="w-full bg-transparent text-sm outline-none"
                  placeholder="Masukkan kata sandi admin"
                  type="password"
                />
              </div>
            </label>

            {message ? (
              <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{message}</span>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={busy || !loginForm.email.trim() || !loginForm.password.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {busy ? (
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
}
