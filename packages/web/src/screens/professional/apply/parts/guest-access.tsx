'use client';

import type { DirectoryProfessional } from '@marketplace/marketplace-core';
import { MarketplaceAccessTabs } from '@marketplace/ui';
import { ArrowRight, BriefcaseMedical, KeyRound, UserRound } from 'lucide-react';
import { isEnglishLocale } from '../../../../lib/marketplace-copy';
import { PreviewProfessionalCard } from './profile-preview';

export function GuestPreviewSection({
  locale,
  onSelect,
  previewCards,
  selectedPreview,
}: {
  locale: string;
  onSelect: (id: string) => void;
  previewCards: DirectoryProfessional[];
  selectedPreview: DirectoryProfessional | null;
}) {
  return (
    <section className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-full"
          style={{ backgroundColor: 'var(--ui-surface-muted)', color: 'var(--ui-primary)' }}
        >
          <UserRound className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[16px] font-bold text-gray-900">
            {isEnglishLocale(locale) ? 'Preview the professional path' : 'Lihat jalur profesional'}
          </p>
          <p className="text-[12px] leading-relaxed text-gray-500">
            {isEnglishLocale(locale)
              ? 'This is the professional page customers will see after your application is approved.'
              : 'Ini adalah halaman profesional yang akan dilihat customer setelah aplikasi Anda disetujui.'}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {previewCards.map((professional) => (
          <PreviewProfessionalCard
            key={professional.id}
            active={selectedPreview?.id === professional.id}
            locale={locale}
            onClick={() => onSelect(professional.id)}
            professional={professional}
          />
        ))}
      </div>
    </section>
  );
}

export function GuestAccessSection({
  forgotPasswordHref,
  locale,
  loginHref,
  registerHref,
  selectedPreview,
}: {
  forgotPasswordHref: string;
  locale: string;
  loginHref: string;
  registerHref: string;
  selectedPreview: DirectoryProfessional | null;
}) {
  return (
    <section className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm">
      <MarketplaceAccessTabs
        items={[
          { href: loginHref, label: isEnglishLocale(locale) ? 'Sign in' : 'Masuk', value: 'login' },
          { href: registerHref, label: isEnglishLocale(locale) ? 'Register' : 'Daftar', value: 'register' },
        ]}
        value="login"
      />

      <div className="mt-5 rounded-[18px] bg-gray-50 px-4 py-3">
        <p className="text-[12px] font-semibold text-gray-500">
          {isEnglishLocale(locale) ? 'Selected professional feel' : 'Rasa profesional terpilih'}
        </p>
        <p className="mt-1 text-[14px] font-bold text-gray-900">
          {selectedPreview?.displayName || (isEnglishLocale(locale) ? 'Professional preview' : 'Preview profesional')}
        </p>
        <p className="mt-1 text-[12px] leading-relaxed text-gray-500">
          {selectedPreview?.coverageAreas?.[0] ||
            (isEnglishLocale(locale)
              ? 'Preview the work area, review flow, and customer-facing page before signing in.'
              : 'Lihat area kerja, alur review, dan halaman yang dilihat customer sebelum Anda masuk.')}
        </p>
      </div>

      <div className="mt-4 space-y-3">
        <a href={loginHref} className="block">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-full py-4 text-[14px] font-bold text-white shadow-lg shadow-slate-900/10 transition-transform active:scale-[0.99]"
            style={{
              background:
                'linear-gradient(180deg, var(--ui-primary) 0%, color-mix(in srgb, var(--ui-primary) 66%, var(--ui-secondary)) 100%)',
            }}
          >
            {isEnglishLocale(locale) ? 'Sign in as professional' : 'Masuk sebagai profesional'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </a>

        <a href={registerHref} className="block">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gray-100 py-4 text-[14px] font-bold text-gray-700 transition-colors hover:bg-gray-200"
          >
            <UserRound className="h-4 w-4" />
            {isEnglishLocale(locale) ? 'Create professional account' : 'Buat akun profesional'}
          </button>
        </a>

        <a
          href={forgotPasswordHref}
          className="inline-flex items-center gap-2 text-[13px] font-semibold"
          style={{ color: 'var(--ui-primary)' }}
        >
          <KeyRound className="h-4 w-4" />
          {isEnglishLocale(locale) ? 'Forgot password' : 'Lupa password'}
        </a>
      </div>
    </section>
  );
}

export function PathSeparationCard({
  currentPath,
  homeHref,
  locale,
}: {
  currentPath: string;
  homeHref: string;
  locale: string;
}) {
  return (
    <section className="rounded-[26px] border border-dashed border-gray-200 bg-white px-5 py-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100 text-gray-700">
          <BriefcaseMedical className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[15px] font-bold text-gray-900">
            {isEnglishLocale(locale)
              ? 'Keep customer and professional paths tidy'
              : 'Pisahkan jalur customer dan profesional'}
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-gray-500">
            {isEnglishLocale(locale)
              ? 'Use the professional path when you want to manage services, review, and daily work.'
              : 'Gunakan jalur profesional saat Anda ingin mengelola layanan, review, dan pekerjaan harian.'}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <a href={homeHref}>
          <button
            type="button"
            className="w-full rounded-full py-4 text-[14px] font-bold text-white"
            style={{
              background:
                'linear-gradient(180deg, var(--ui-primary) 0%, color-mix(in srgb, var(--ui-primary) 66%, var(--ui-secondary)) 100%)',
            }}
          >
            {isEnglishLocale(locale) ? 'Home' : 'Beranda'}
          </button>
        </a>
        <a href={currentPath}>
          <button
            type="button"
            className="w-full rounded-full bg-gray-100 py-4 text-[14px] font-bold text-gray-700 transition-colors hover:bg-gray-200"
          >
            {isEnglishLocale(locale) ? 'Stay in professional path' : 'Tetap di jalur profesional'}
          </button>
        </a>
      </div>
    </section>
  );
}
