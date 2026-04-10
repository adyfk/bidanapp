'use client';

import type { DirectoryOffering, DirectoryProfessionalDetail, ViewerSession } from '@marketplace/marketplace-core';
import {
  MarketplaceFeaturePill,
  MarketplaceHeaderIconButton,
  MarketplaceMobileShell,
  MarketplaceSectionHeader,
  MarketplaceStatTile,
  MarketplaceStickyActionBar,
  MarketplaceSurfaceCard,
} from '@marketplace/ui/marketplace-lite';
import { PrimaryButton, SecondaryButton, StatusPill } from '@marketplace/ui/primitives';
import {
  BadgeCheck,
  BookHeart,
  BriefcaseMedical,
  CalendarDays,
  ChevronLeft,
  Clock3,
  Languages,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { deliveryModeLabel, formatCurrency, isEnglishLocale, offeringTypeLabel } from '../../../lib/marketplace-copy';
import { OfferingCard } from '../shared/parts/offering-card';
import { InitialPortrait } from '../shared/parts/portrait';

type ProfessionalAttributes = Record<string, unknown>;

function readString(source: ProfessionalAttributes, key: string) {
  return typeof source[key] === 'string' ? String(source[key]) : '';
}

function readNumber(source: ProfessionalAttributes, key: string) {
  return typeof source[key] === 'number' ? Number(source[key]) : 0;
}

function readBoolean(source: ProfessionalAttributes, key: string) {
  return Boolean(source[key]);
}

function readStringArray(source: ProfessionalAttributes, key: string) {
  return Array.isArray(source[key]) ? source[key].filter((item): item is string => typeof item === 'string') : [];
}

function formatModeNote(offering: DirectoryOffering | null, locale: string) {
  if (!offering) {
    return isEnglishLocale(locale) ? 'Choose a service to continue.' : 'Pilih layanan untuk melanjutkan.';
  }

  return isEnglishLocale(locale)
    ? `${deliveryModeLabel(offering.deliveryMode, locale)} flow ready from ${formatCurrency(offering.priceAmount, locale, offering.currency)}.`
    : `${deliveryModeLabel(offering.deliveryMode, locale)} siap dipesan mulai ${formatCurrency(offering.priceAmount, locale, offering.currency)}.`;
}

function ProfessionalRequestPreparationCard({
  availabilityText,
  authenticated,
  locale,
  selectedOffering,
}: {
  availabilityText?: string;
  authenticated: boolean;
  locale: string;
  selectedOffering: DirectoryOffering | null;
}) {
  const en = isEnglishLocale(locale);

  return (
    <section className="rounded-[28px] border border-pink-100 bg-white/95 p-5 shadow-[0_20px_45px_-30px_rgba(232,88,138,0.35)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-pink-500">
        {en ? 'Request flow' : 'Alur request'}
      </p>
      <div className="mt-2 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[18px] font-bold leading-tight text-slate-900">
            {authenticated
              ? en
                ? 'Your account is ready for booking'
                : 'Akun Anda siap untuk booking'
              : en
                ? 'Sign in to save your booking journey'
                : 'Masuk untuk menyimpan perjalanan booking'}
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
            {authenticated
              ? en
                ? 'Select the service that fits best, then continue from the booking bar below.'
                : 'Pilih layanan yang paling sesuai, lalu lanjutkan dari booking bar di bawah.'
              : en
                ? 'You can browse first, but signing in keeps orders, payment, and support in one account.'
                : 'Anda bisa melihat-lihat dulu, tetapi login akan menyimpan order, pembayaran, dan support dalam satu akun.'}
          </p>
        </div>
        <div className="rounded-full bg-pink-50 px-3 py-1.5 text-[12px] font-semibold text-pink-700">
          {selectedOffering ? offeringTypeLabel(selectedOffering.offeringType, locale) : en ? 'Browse' : 'Jelajah'}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3">
        <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            <BriefcaseMedical className="h-4 w-4" />
            <span>{en ? 'Selected service' : 'Layanan terpilih'}</span>
          </div>
          <p className="mt-2 text-[14px] font-bold text-slate-900">
            {selectedOffering?.title || (en ? 'Choose any service below' : 'Pilih salah satu layanan di bawah')}
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-slate-500">{formatModeNote(selectedOffering, locale)}</p>
        </div>
        <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            <BookHeart className="h-4 w-4" />
            <span>{en ? 'What stays saved' : 'Yang akan tersimpan'}</span>
          </div>
          <p className="mt-2 text-[14px] font-bold text-slate-900">
            {en ? 'Order, payment, and support follow-up' : 'Order, pembayaran, dan tindak lanjut support'}
          </p>
        </div>
        {availabilityText ? (
          <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              <Clock3 className="h-4 w-4" />
              <span>{en ? 'Availability' : 'Ketersediaan'}</span>
            </div>
            <p className="mt-2 text-[14px] font-bold text-slate-900">{availabilityText}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function SelectableOfferingCard({
  active,
  locale,
  offering,
  onSelect,
}: {
  active: boolean;
  locale: string;
  offering: DirectoryOffering;
  onSelect: () => void;
}) {
  return (
    <button
      className="w-full rounded-[24px] border px-4 py-4 text-left transition-all active:scale-[0.99]"
      onClick={onSelect}
      style={
        active
          ? {
              background:
                'linear-gradient(180deg, color-mix(in srgb, var(--ui-surface-muted) 72%, white) 0%, #FFFFFF 100%)',
              borderColor: 'var(--ui-border-strong)',
              boxShadow: '0 18px 36px -30px rgba(3,105,161,0.16)',
            }
          : {
              backgroundColor: '#ffffff',
              borderColor: 'var(--ui-border)',
            }
      }
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone="accent">{offeringTypeLabel(offering.offeringType, locale)}</StatusPill>
            <StatusPill tone="neutral">{deliveryModeLabel(offering.deliveryMode, locale)}</StatusPill>
          </div>
          <div className="mt-3 text-[15px] font-bold text-gray-900">{offering.title}</div>
          <div className="mt-1 text-[12px] font-medium text-gray-500">{offering.professionalDisplayName}</div>
          <p className="mt-3 line-clamp-2 text-[13px] leading-6 text-gray-500">{offering.description}</p>
        </div>

        <div className="rounded-full bg-slate-950 px-3 py-2 text-[11px] font-bold text-white">
          {formatCurrency(offering.priceAmount, locale, offering.currency)}
        </div>
      </div>
    </button>
  );
}

export function MarketplaceProfessionalDetailView({
  detail,
  locale,
  loginHref,
  ordersHref,
  platformName,
  servicesHref,
  session,
}: {
  detail: DirectoryProfessionalDetail;
  locale: string;
  loginHref: string;
  ordersHref: string;
  platformName: string;
  servicesHref: string;
  session?: ViewerSession | null;
}) {
  const en = isEnglishLocale(locale);
  const profile = detail.profile ?? {
    bio: '',
    educationHistory: '',
    headline: '',
    languages: [],
    licenseText: '',
    specialties: [],
    yearsExperience: 0,
  };
  const attributes = (detail.professional.attributes ?? {}) as ProfessionalAttributes;
  const headline =
    profile.headline ||
    readString(attributes, 'headline') ||
    (en
      ? 'Trusted care for new mothers, lactation support, and recovery at home.'
      : 'Pendampingan ibu baru lahir, laktasi, dan pemulihan yang terasa hangat dan tenang.');
  const bio = profile.bio || headline;
  const languages = profile.languages?.length ? profile.languages : readStringArray(attributes, 'languages');
  const yearsExperience = profile.yearsExperience || readNumber(attributes, 'yearsExperience');
  const educationHistory = profile.educationHistory || readString(attributes, 'education_history');
  const licenseText = profile.licenseText || readString(attributes, 'str_number');
  const specialties = profile.specialties ?? [];
  const isLactationCertified = readBoolean(attributes, 'certified_lactation');
  const coverageAreas = detail.coverage?.areas?.length
    ? detail.coverage.areas
    : (detail.professional.coverageAreas ?? []);
  const practiceLocation = detail.coverage?.practiceLocation || detail.professional.city || platformName;
  const [selectedOfferingId, setSelectedOfferingId] = useState(detail.offerings?.[0]?.id ?? '');

  const selectedOffering = useMemo(
    () => detail.offerings?.find((offering) => offering.id === selectedOfferingId) ?? detail.offerings?.[0] ?? null,
    [detail.offerings, selectedOfferingId],
  );

  const trustItems = [
    {
      icon: <BadgeCheck className="h-4 w-4" />,
      label: en ? 'Credentials' : 'Kredensial',
      value: detail.credentials?.length
        ? `${detail.credentials.length} ${en ? 'verified' : 'terverifikasi'}`
        : licenseText || (en ? 'Profile review ready' : 'Profil siap direview'),
    },
    {
      icon: <Clock3 className="h-4 w-4" />,
      label: en ? 'Experience' : 'Pengalaman',
      value: yearsExperience
        ? `${yearsExperience}+ ${en ? 'years' : 'tahun'}`
        : en
          ? 'Professional practice'
          : 'Praktek profesional',
    },
    {
      icon: <Languages className="h-4 w-4" />,
      label: en ? 'Languages' : 'Bahasa',
      value: languages.length ? languages.join(' / ') : detail.availability?.text || (en ? 'Indonesia' : 'Indonesia'),
    },
  ];

  return (
    <MarketplaceMobileShell showNav={false}>
      <div className="relative min-h-full overflow-y-auto bg-[linear-gradient(180deg,#FFF5F8_0%,#FFFFFF_20%,#FFFAFC_100%)] pb-40">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[520px] overflow-hidden">
          <div
            className="absolute -left-20 top-6 h-48 w-48 rounded-full blur-3xl"
            style={{ backgroundColor: 'rgba(232,88,138,0.14)' }}
          />
          <div
            className="absolute -right-12 top-24 h-40 w-40 rounded-full blur-3xl"
            style={{ backgroundColor: 'rgba(255,126,179,0.14)' }}
          />
        </div>

        <div
          className="absolute inset-x-0 top-0 h-[390px] overflow-hidden rounded-b-[42px]"
          style={{ background: 'var(--ui-hero-gradient)' }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.26)_0%,rgba(255,255,255,0)_42%)]" />
          <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-b from-transparent to-[#FFF5F8]" />
        </div>

        <div className="relative z-10 px-6 pb-4 pt-10">
          <div className="flex items-center justify-between rounded-full border border-white/60 bg-white/82 px-4 py-3 shadow-[0_16px_32px_rgba(17,24,39,0.14)] backdrop-blur-xl">
            <MarketplaceHeaderIconButton href={`/${locale}/explore`}>
              <ChevronLeft className="h-5 w-5" />
            </MarketplaceHeaderIconButton>
            <div className="text-[17px] font-bold tracking-[0.02em] text-gray-900">{platformName}</div>
            <div className="flex items-center gap-2">
              <MarketplaceFeaturePill tone="soft">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{detail.professional.city || platformName}</span>
              </MarketplaceFeaturePill>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-3 px-6">
          <div className="rounded-[32px] bg-white/94 p-5 shadow-[0_22px_52px_rgba(17,24,39,0.12)] backdrop-blur-sm">
            <div className="mb-6 flex gap-4">
              <div className="flex-shrink-0">
                <div className="rounded-full bg-gradient-to-br from-sky-600 via-sky-500 to-cyan-300 p-[2px]">
                  <div className="overflow-hidden rounded-full border-2 border-white bg-white">
                    <InitialPortrait label={detail.professional.displayName} size="hero" />
                  </div>
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-center">
                <p
                  className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em]"
                  style={{ color: 'var(--ui-primary)' }}
                >
                  {detail.professional.city || platformName}
                </p>
                <h2 className="text-[22px] font-bold leading-tight text-gray-900">{detail.professional.displayName}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <p className="text-[14px] font-semibold" style={{ color: 'var(--ui-primary)' }}>
                    {headline}
                  </p>
                  {isLactationCertified ? (
                    <span
                      className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
                      style={{ backgroundColor: 'var(--ui-surface-muted)', color: 'var(--ui-primary)' }}
                    >
                      {en ? 'Lactation certified' : 'Sertifikasi laktasi'}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-[12px] leading-6 text-gray-500">
                  {(detail.professional.coverageAreas ?? []).join(' • ') ||
                    (en ? 'Trusted professional' : 'Profesional tepercaya')}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px] font-medium">
                  <span className="flex items-center gap-1.5" style={{ color: '#f59e0b' }}>
                    <Star className="h-4 w-4 fill-current" /> {detail.credentials?.length ? '4.9' : '4.8'}
                  </span>
                  <span className="text-gray-500">
                    {detail.stories?.length || detail.offerings?.length || 1}{' '}
                    {en ? 'profile highlights' : 'sorotan profil'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 border-t border-gray-100 pt-4">
              <MarketplaceStatTile
                label={en ? 'Experience' : 'Pengalaman'}
                value={
                  <div className="flex items-center text-[15px] font-bold text-gray-900">
                    <CalendarDays className="mr-1.5 h-4 w-4" style={{ color: 'var(--ui-primary)' }} />
                    {yearsExperience ? `${yearsExperience}+ ${en ? 'years' : 'tahun'}` : en ? 'Ready' : 'Siap'}
                  </div>
                }
              />
              <MarketplaceStatTile
                label={en ? 'Services' : 'Layanan'}
                value={
                  <div className="flex items-center text-[15px] font-bold text-gray-900">
                    <Users className="mr-1.5 h-4 w-4" style={{ color: 'var(--ui-primary)' }} />
                    {detail.offerings?.length || 0}
                  </div>
                }
              />
              <MarketplaceStatTile
                label={en ? 'Start from' : 'Mulai dari'}
                value={
                  <div className="flex items-center text-[15px] font-bold text-gray-900">
                    <Star className="mr-1.5 h-4 w-4 fill-current" style={{ color: '#f59e0b' }} />
                    {formatCurrency(detail.professional.startingPrice, locale)}
                  </div>
                }
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              {trustItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-start gap-3 rounded-[20px] bg-[var(--ui-surface-muted)] px-4 py-3 shadow-[0_14px_28px_-24px_rgba(17,24,39,0.24)]"
                >
                  <span
                    className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: '#ffffff', color: 'var(--ui-primary)' }}
                  >
                    {item.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{item.label}</p>
                    <p className="mt-1 text-[13px] font-semibold text-gray-900">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-6 space-y-5 px-6 pb-12">
          <ProfessionalRequestPreparationCard
            availabilityText={detail.availability?.text}
            authenticated={Boolean(session?.isAuthenticated)}
            locale={locale}
            selectedOffering={selectedOffering}
          />

          <MarketplaceSurfaceCard tone="white">
            <MarketplaceSectionHeader
              title={en ? 'Practice and profile' : 'Praktek dan profil'}
              description={
                en
                  ? 'The way this professional usually works with families.'
                  : 'Cara profesional ini biasanya mendampingi keluarga.'
              }
            />
            <div className="space-y-4">
              <div className="rounded-[24px] bg-[var(--ui-surface-muted)] p-4 shadow-[0_16px_30px_-24px_rgba(17,24,39,0.22)]">
                <div className="text-[15px] font-bold text-gray-900">
                  {en ? 'About the practice' : 'Tentang praktek'}
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{bio}</p>
              </div>
              {educationHistory ? (
                <div className="rounded-[24px] bg-[var(--ui-surface-muted)] p-4 shadow-[0_16px_30px_-24px_rgba(17,24,39,0.22)]">
                  <div className="text-[15px] font-bold text-gray-900">
                    {en ? 'Education and training' : 'Pendidikan dan pelatihan'}
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{educationHistory}</p>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <StatusPill tone="accent">{practiceLocation}</StatusPill>
                {specialties.slice(0, 4).map((specialty) => (
                  <StatusPill key={specialty} tone="neutral">
                    {specialty}
                  </StatusPill>
                ))}
                {coverageAreas.slice(0, 3).map((area) => (
                  <StatusPill key={area} tone="neutral">
                    {area}
                  </StatusPill>
                ))}
              </div>
            </div>
          </MarketplaceSurfaceCard>

          {(detail.portfolio ?? []).length || (detail.gallery ?? []).length || (detail.stories ?? []).length ? (
            <MarketplaceSurfaceCard tone="white">
              <MarketplaceSectionHeader
                title={en ? 'Portfolio and stories' : 'Portofolio dan cerita'}
                description={
                  en
                    ? 'Highlights, documented work, and gallery moments from this practice.'
                    : 'Sorotan, hasil pendampingan, dan galeri dari praktik profesional ini.'
                }
              />
              <div className="space-y-4">
                {(detail.portfolio ?? []).map((entry) => (
                  <article
                    key={entry.id}
                    className="overflow-hidden rounded-[24px] bg-white shadow-[0_18px_34px_-24px_rgba(17,24,39,0.24)]"
                  >
                    <div className="relative h-[180px] bg-[linear-gradient(135deg,#FFE8F0_0%,#FFF5F8_55%,#FFFFFF_100%)]">
                      {entry.assetUrl ? (
                        <img
                          alt={entry.title}
                          className="absolute inset-0 h-full w-full object-cover"
                          src={entry.assetUrl}
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <span
                          className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold"
                          style={{ color: 'var(--ui-primary)' }}
                        >
                          {en ? 'Portfolio' : 'Portofolio'}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="text-[16px] font-bold text-gray-900">{entry.title}</h4>
                      <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{entry.description}</p>
                    </div>
                  </article>
                ))}

                {(detail.gallery ?? []).length ? (
                  <div className="grid grid-cols-2 gap-3">
                    {(detail.gallery ?? []).slice(0, 3).map((item, index) => (
                      <div
                        key={item.id}
                        className={`relative overflow-hidden rounded-[24px] bg-[var(--ui-surface-muted)] ${index === 0 ? 'col-span-2 h-[200px]' : 'h-[132px]'}`}
                      >
                        {item.assetUrl ? (
                          <img
                            alt={item.caption || item.fileName}
                            className="h-full w-full object-cover"
                            src={item.assetUrl}
                          />
                        ) : null}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-3">
                          <p className="text-[11px] font-semibold text-white">{item.caption || item.fileName}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {(detail.stories ?? []).map((story, index) => (
                  <article
                    key={story.id}
                    className="overflow-hidden rounded-[24px] bg-white shadow-[0_18px_34px_-24px_rgba(17,24,39,0.24)]"
                  >
                    <div className="relative h-[180px] bg-[linear-gradient(135deg,#FFE8F0_0%,#FFF5F8_55%,#FFFFFF_100%)]">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(232,88,138,0.16)_0%,rgba(255,255,255,0)_45%)]" />
                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold"
                            style={{ color: 'var(--ui-primary)' }}
                          >
                            {en ? 'Story' : 'Cerita'}
                          </span>
                          <span className="rounded-full bg-black/35 px-3 py-1 text-[11px] font-semibold text-white">
                            {en ? `Highlight ${index + 1}` : `Sorotan ${index + 1}`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="text-[16px] font-bold text-gray-900">{story.title}</h4>
                      <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{story.body}</p>
                    </div>
                  </article>
                ))}
              </div>
            </MarketplaceSurfaceCard>
          ) : null}

          <MarketplaceSurfaceCard tone="white">
            <MarketplaceSectionHeader
              title={en ? 'Trust and coverage' : 'Kepercayaan dan cakupan'}
              description={
                en
                  ? 'Credentials, coverage area, and current availability.'
                  : 'Kredensial, area layanan, dan ketersediaan saat ini.'
              }
            />
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-[24px] bg-[var(--ui-surface-muted)] p-4 shadow-[0_16px_28px_-24px_rgba(17,24,39,0.24)]">
                <div className="mb-3 flex items-center gap-2 text-[13px] font-bold text-gray-900">
                  <ShieldCheck className="h-4 w-4" style={{ color: 'var(--ui-primary)' }} />
                  {en ? 'Credentials' : 'Kredensial'}
                </div>
                <div className="space-y-3">
                  {(detail.credentials ?? []).length ? (
                    (detail.credentials ?? []).map((credential) => (
                      <div
                        key={`${credential.issuer}-${credential.credentialCode}`}
                        className="rounded-[18px] border px-3 py-3"
                        style={{
                          borderColor: 'var(--ui-border)',
                          background:
                            'linear-gradient(180deg, color-mix(in srgb, var(--ui-surface-muted) 58%, white) 0%, #FFFFFF 100%)',
                        }}
                      >
                        <div className="text-[14px] font-bold text-gray-900">{credential.label}</div>
                        <div className="mt-1 text-[12px] text-gray-500">{credential.issuer}</div>
                        <div className="mt-1 text-[11px] font-semibold text-sky-700">{credential.credentialCode}</div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[18px] border border-slate-200 bg-white px-3 py-3 text-[13px] leading-6 text-slate-500">
                      {licenseText ||
                        (en
                          ? 'Trust details will appear after review.'
                          : 'Detail kepercayaan akan tampil setelah review selesai.')}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[24px] bg-[var(--ui-surface-muted)] p-4 shadow-[0_16px_28px_-24px_rgba(17,24,39,0.24)]">
                <div className="mb-3 flex items-center gap-2 text-[13px] font-bold text-gray-900">
                  <MapPin className="h-4 w-4" style={{ color: 'var(--ui-primary)' }} />
                  {en ? 'Coverage and practice' : 'Cakupan dan praktek'}
                </div>
                <div className="space-y-3">
                  <div className="rounded-[18px] border border-slate-200 bg-white px-3 py-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      {en ? 'Primary city' : 'Kota utama'}
                    </div>
                    <div className="mt-2 text-[14px] font-bold text-slate-900">{practiceLocation}</div>
                  </div>
                  <div className="rounded-[18px] border border-slate-200 bg-white px-3 py-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      {en ? 'Coverage areas' : 'Area layanan'}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {coverageAreas.length ? (
                        coverageAreas.map((area) => (
                          <StatusPill key={area} tone="neutral">
                            {area}
                          </StatusPill>
                        ))
                      ) : (
                        <span className="text-[13px] text-slate-500">
                          {en
                            ? 'Coverage area will appear after setup.'
                            : 'Area layanan akan tampil setelah profil selesai diatur.'}
                        </span>
                      )}
                    </div>
                  </div>
                  {detail.availability?.slots?.length ? (
                    <div className="rounded-[18px] border border-slate-200 bg-white px-3 py-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                        {en ? 'Availability' : 'Ketersediaan'}
                      </div>
                      <div className="mt-2 flex flex-col gap-2">
                        {detail.availability.slots.map((slot) => (
                          <span key={slot} className="text-[13px] font-medium text-slate-700">
                            {slot}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </MarketplaceSurfaceCard>

          <MarketplaceSurfaceCard tone="white">
            <MarketplaceSectionHeader
              action={
                <a className="text-xs font-semibold" href={servicesHref} style={{ color: 'var(--ui-primary)' }}>
                  {en ? 'See all' : 'Lihat semua'}
                </a>
              }
              title={en ? 'Available services' : 'Layanan yang tersedia'}
              description={
                en
                  ? 'Choose one service first so the booking bar can follow your selection.'
                  : 'Pilih satu layanan lebih dulu agar booking bar mengikuti pilihan Anda.'
              }
            />
            <div className="space-y-4">
              {(detail.offerings ?? []).map((offering) => (
                <SelectableOfferingCard
                  active={selectedOffering?.id === offering.id}
                  key={offering.id}
                  locale={locale}
                  offering={offering}
                  onSelect={() => setSelectedOfferingId(offering.id)}
                />
              ))}
            </div>
            {selectedOffering ? (
              <div
                className="mt-5 rounded-[24px] border p-4"
                style={{
                  borderColor: 'var(--ui-border)',
                  background:
                    'linear-gradient(180deg, color-mix(in srgb, var(--ui-surface-muted) 60%, white) 0%, #FFFFFF 100%)',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill tone="accent">{offeringTypeLabel(selectedOffering.offeringType, locale)}</StatusPill>
                      <StatusPill tone="neutral">{deliveryModeLabel(selectedOffering.deliveryMode, locale)}</StatusPill>
                    </div>
                    <div className="mt-3 text-[15px] font-bold text-slate-900">{selectedOffering.title}</div>
                    <p className="mt-2 text-[13px] leading-6 text-slate-500">{selectedOffering.description}</p>
                  </div>
                  <div className="rounded-full bg-slate-950 px-3 py-2 text-[11px] font-bold text-white">
                    {formatCurrency(selectedOffering.priceAmount, locale, selectedOffering.currency)}
                  </div>
                </div>
              </div>
            ) : null}
            <div className="mt-5 space-y-4">
              {(detail.offerings ?? []).slice(0, 2).map((offering) => (
                <OfferingCard key={`related-${offering.id}`} locale={locale} offering={offering} />
              ))}
            </div>
          </MarketplaceSurfaceCard>
        </div>

        <MarketplaceStickyActionBar
          eyebrow={en ? 'Continue' : 'Lanjutkan'}
          subtitle={formatModeNote(selectedOffering, locale)}
          title={selectedOffering?.title || (en ? 'Choose this professional' : 'Pilih profesional ini')}
          actions={
            <>
              {!session?.isAuthenticated ? (
                <a href={loginHref}>
                  <SecondaryButton type="button">{en ? 'Sign in' : 'Masuk'}</SecondaryButton>
                </a>
              ) : null}
              <a href={ordersHref}>
                <PrimaryButton type="button">{en ? 'Continue' : 'Lanjut'}</PrimaryButton>
              </a>
            </>
          }
        />
      </div>
    </MarketplaceMobileShell>
  );
}
