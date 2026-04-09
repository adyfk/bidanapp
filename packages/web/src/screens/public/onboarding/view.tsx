'use client';

import type { ViewerSession } from '@marketplace/marketplace-core';
import type { ServicePlatformId } from '@marketplace/platform-config';
import {
  MarketplaceAccessOptionCard,
  MarketplaceGlassPanel,
  MarketplaceGradientStage,
  MarketplaceLocalePills,
  MarketplaceMobileShell,
  MarketplaceSurfaceCard,
  MarketplaceTopPill,
} from '@marketplace/ui';
import { ArrowRight, BriefcaseMedical, Sparkles, UserRound } from 'lucide-react';
import { createLocaleSwitcherItems } from '../../../layout/navigation';
import { isEnglishLocale } from '../../../lib/marketplace-copy';

const heroImageUrl = 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=1000&auto=format&fit=crop';

export function MarketplaceOnboardingView({
  locale,
  currentPath,
  loginHref,
  platformId,
  platformName,
  professionalHref,
  registerHref,
  session,
  visitorHref,
}: {
  currentPath: string;
  locale: string;
  loginHref: string;
  platformId: ServicePlatformId;
  platformName: string;
  professionalHref: string;
  registerHref: string;
  session?: ViewerSession | null;
  visitorHref: string;
}) {
  const copy = {
    accessBadge: isEnglishLocale(locale) ? 'Access path' : 'Pilih akses',
    accessPrompt: isEnglishLocale(locale)
      ? 'Choose the path that fits what you want to do today.'
      : 'Pilih jalur yang paling sesuai dengan tujuan Anda hari ini.',
    customerDescription: isEnglishLocale(locale)
      ? 'Save orders, reminders, and follow-up in one account.'
      : 'Simpan order, pengingat, dan tindak lanjut keluarga dalam satu akun.',
    customerTitle: isEnglishLocale(locale) ? 'Sign in / register customer' : 'Masuk / daftar customer',
    getStarted: isEnglishLocale(locale) ? 'Get started' : 'Mulai',
    heroHint: isEnglishLocale(locale) ? 'Choose the path that fits best.' : 'Pilih jalur yang paling sesuai.',
    modeCount: isEnglishLocale(locale) ? '3 paths' : '3 jalur',
    professionalDescription: isEnglishLocale(locale)
      ? 'Open the professional path to manage services, documents, and your work schedule.'
      : 'Buka jalur profesional untuk mengelola layanan, dokumen, dan jadwal kerja Anda.',
    professionalTitle: isEnglishLocale(locale) ? 'Open professional path' : 'Buka jalur profesional',
    tagline: isEnglishLocale(locale)
      ? 'Find trusted care professionals for mothers and babies.'
      : 'Temukan profesional tepercaya untuk kebutuhan ibu dan bayi.',
    visitorDescription: isEnglishLocale(locale)
      ? 'Explore services and professionals without signing in.'
      : 'Jelajahi layanan dan profesional tanpa harus masuk.',
    visitorTitle: isEnglishLocale(locale) ? 'Continue as visitor' : 'Lanjut sebagai visitor',
  };

  const membership = session?.platformMemberships?.find((item) => item.platformId === platformId);
  const resolvedProfessionalHref =
    membership?.reviewStatus === 'approved' ? `/${locale}/professionals/dashboard` : professionalHref;

  return (
    <MarketplaceMobileShell showNav={false}>
      <MarketplaceGradientStage>
        <div className="relative flex items-center justify-between px-5 pt-5">
          <MarketplaceTopPill>{copy.getStarted}</MarketplaceTopPill>
          <MarketplaceLocalePills activeValue={locale} items={createLocaleSwitcherItems(currentPath, locale)} />
        </div>

        <div className="px-5 pt-7 text-center" style={{ color: '#ffffff' }}>
          <h1 className="text-[42px] font-bold leading-[0.95] tracking-[-0.04em]">{platformName}</h1>
          <p
            className="mx-auto mt-4 max-w-[22rem] text-[15px] font-medium leading-6"
            style={{ color: 'rgba(255,255,255,0.82)' }}
          >
            {copy.tagline}
          </p>
        </div>

        <div className="flex flex-1 flex-col px-5 pb-8 pt-6">
          <MarketplaceGlassPanel>
            <div className="flex items-start justify-between gap-3">
              <MarketplaceTopPill>{copy.getStarted}</MarketplaceTopPill>
              <MarketplaceTopPill tone="soft">{copy.modeCount}</MarketplaceTopPill>
            </div>

            <div className="mt-5 grid grid-cols-[minmax(0,1fr)_132px] items-end gap-4">
              <div className="min-w-0 pb-1 text-left">
                <h2
                  className="max-w-[11rem] text-[28px] font-bold leading-[1.06] tracking-[-0.03em]"
                  style={{ color: '#ffffff' }}
                >
                  {copy.heroHint}
                </h2>
                <p className="mt-3 max-w-[15rem] text-[13px] leading-6" style={{ color: 'rgba(255,255,255,0.78)' }}>
                  {copy.accessPrompt}
                </p>
                <div
                  className="mt-4 inline-flex items-center gap-2 rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] backdrop-blur-sm"
                  style={{ backgroundColor: 'rgba(0,0,0,0.12)', color: 'rgba(255,255,255,0.72)' }}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.72)' }} />
                  {copy.accessBadge}
                </div>
              </div>

              <div
                className="relative h-[224px] overflow-hidden rounded-[28px] border shadow-[0_20px_54px_-34px_rgba(17,24,39,0.58)]"
                style={{
                  background: 'radial-gradient(circle at top,#ffffff 0%,#fad1e4 42%,#ee4f9d 100%)',
                  borderColor: 'rgba(255,255,255,0.18)',
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(180deg,rgba(255,255,255,0.24) 0%,rgba(255,255,255,0.02) 38%,rgba(253,242,248,0.65) 100%)',
                  }}
                />
                <img
                  alt={`${platformName} hero`}
                  className="absolute inset-x-0 bottom-0 top-3 h-[212px] w-full object-cover object-top"
                  src={heroImageUrl}
                />
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#fdebf5] via-[#fdebf5]/56 to-transparent" />
              </div>
            </div>
          </MarketplaceGlassPanel>

          <MarketplaceSurfaceCard
            className="mt-5 rounded-[32px] border-white/55 px-4 py-4 text-left backdrop-blur-xl"
            tone="ghost"
          >
            <div className="mb-4 flex items-center justify-between gap-3 px-1">
              <div>
                <p className="text-[14px] font-bold text-gray-900">{copy.getStarted}</p>
                <p className="text-[12px] text-gray-500">{copy.accessPrompt}</p>
              </div>
              <div
                className="rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em]"
                style={{ backgroundColor: '#fff1f7', color: 'var(--ui-primary)' }}
              >
                {copy.accessBadge}
              </div>
            </div>

            <div className="space-y-3">
              <a href={visitorHref}>
                <MarketplaceAccessOptionCard
                  arrow={<ArrowRight className="h-4 w-4" />}
                  description={copy.visitorDescription}
                  icon={<Sparkles className="h-5 w-5" />}
                  title={copy.visitorTitle}
                  tone="dark"
                />
              </a>

              <a href={loginHref}>
                <MarketplaceAccessOptionCard
                  arrow={<ArrowRight className="h-4 w-4" />}
                  description={copy.customerDescription}
                  icon={<UserRound className="h-5 w-5" />}
                  title={copy.customerTitle}
                  tone="accent"
                />
              </a>

              <a href={resolvedProfessionalHref}>
                <MarketplaceAccessOptionCard
                  arrow={<ArrowRight className="h-4 w-4" />}
                  description={copy.professionalDescription}
                  icon={<BriefcaseMedical className="h-5 w-5" />}
                  title={copy.professionalTitle}
                  tone="light"
                />
              </a>
            </div>
          </MarketplaceSurfaceCard>
        </div>
      </MarketplaceGradientStage>
    </MarketplaceMobileShell>
  );
}
