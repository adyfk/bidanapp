'use client';

import type { DirectoryOfferingDetail } from '@marketplace/marketplace-core';
import {
  MarketplaceFeaturePill,
  MarketplaceHeaderIconButton,
  MarketplaceMobileShell,
  MarketplaceSectionHeader,
  MarketplaceStatTile,
  MarketplaceStickyActionBar,
  MarketplaceSurfaceCard,
} from '@marketplace/ui/marketplace-lite';
import { PrimaryButton, SecondaryButton, StatusChipGroup } from '@marketplace/ui/primitives';
import { ChevronLeft, Clock3, Heart, MapPin, Share2, ShieldCheck, Tag } from 'lucide-react';
import { deliveryModeLabel, formatCurrency, isEnglishLocale, offeringTypeLabel } from '../../../lib/marketplace-copy';
import { DeliveryModeChip, OfferingTypeChip } from '../../../lib/status-visuals';
import { OfferingCard } from '../shared/parts/offering-card';
import { InitialPortrait } from '../shared/parts/portrait';

export function MarketplaceOfferingDetailView({
  detail,
  locale,
  ordersHref,
}: {
  detail: DirectoryOfferingDetail;
  locale: string;
  ordersHref: string;
}) {
  const en = isEnglishLocale(locale);
  const providerHref = `/${locale}/p/${detail.offering.professionalSlug}`;

  return (
    <MarketplaceMobileShell showNav={false}>
      <div className="min-h-full bg-[linear-gradient(180deg,#FFF5F8_0%,#FFFFFF_24%,#FFFAFC_100%)] pb-36">
        <section className="relative h-64 w-full overflow-hidden bg-gray-200">
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at top right, rgba(255,255,255,0.45) 0%, transparent 28%), linear-gradient(180deg, color-mix(in srgb, var(--ui-secondary) 56%, var(--ui-primary)) 0%, var(--ui-primary) 100%)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-4 pb-4 pt-14">
            <MarketplaceHeaderIconButton href={`/${locale}/services`}>
              <ChevronLeft className="h-5 w-5" />
            </MarketplaceHeaderIconButton>
            <div className="flex gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-sm backdrop-blur-sm">
                <Share2 className="h-4 w-4" />
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-sm backdrop-blur-sm">
                <Heart className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="absolute bottom-6 left-5 right-5 z-10 text-white">
            <div className="mb-2 inline-block rounded-full border border-white/30 bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wide backdrop-blur-md">
              {offeringTypeLabel(detail.offering.offeringType, locale)}
            </div>
            <h1 className="text-[30px] font-bold leading-tight">{detail.offering.title}</h1>
            <p className="mt-2 max-w-xl text-sm text-white/82">{detail.offering.description}</p>
          </div>
        </section>

        <div className="space-y-6 px-5 py-6">
          <MarketplaceSurfaceCard tone="white">
            <div className="grid grid-cols-2 gap-3">
              <MarketplaceStatTile
                label={en ? 'Delivery' : 'Mode'}
                tone="soft"
                value={deliveryModeLabel(detail.offering.deliveryMode, locale)}
              />
              <MarketplaceStatTile
                label={en ? 'Price' : 'Harga'}
                tone="soft"
                value={formatCurrency(detail.offering.priceAmount, locale, detail.offering.currency)}
              />
            </div>
          </MarketplaceSurfaceCard>

          <MarketplaceSurfaceCard tone="white">
            <MarketplaceSectionHeader
              title={en ? 'Service summary' : 'Ringkasan layanan'}
              description={
                en
                  ? 'Read the quick overview before choosing the professional and continuing to booking.'
                  : 'Lihat gambaran singkat dulu sebelum memilih profesional dan lanjut ke booking.'
              }
            />
            <div className="space-y-4">
              <div className="rounded-[24px] bg-[#FCFCFC] p-4 shadow-[0_16px_28px_-24px_rgba(17,24,39,0.34)]">
                <StatusChipGroup>
                  <OfferingTypeChip compact locale={locale} value={detail.offering.offeringType} />
                  <DeliveryModeChip compact locale={locale} value={detail.offering.deliveryMode} />
                </StatusChipGroup>
                <p className="mt-3 text-[13px] leading-6 text-slate-500">{detail.offering.description}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    <Clock3 className="h-4 w-4" />
                    <span>{en ? 'Service flow' : 'Alur layanan'}</span>
                  </div>
                  <p className="mt-2 text-[14px] font-bold text-slate-900">
                    {en
                      ? 'Choose the professional that fits best, then continue to order and follow-up.'
                      : 'Pilih profesional yang paling cocok, lalu lanjut ke order dan tindak lanjut.'}
                  </p>
                </div>
                <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    <ShieldCheck className="h-4 w-4" />
                    <span>{en ? 'Stored in one place' : 'Tersimpan di satu tempat'}</span>
                  </div>
                  <p className="mt-2 text-[14px] font-bold text-slate-900">
                    {en
                      ? 'Orders, payment, and support stay attached to the same customer account.'
                      : 'Order, pembayaran, dan support tetap tersimpan di akun customer yang sama.'}
                  </p>
                </div>
              </div>
            </div>
          </MarketplaceSurfaceCard>

          <MarketplaceSurfaceCard tone="white">
            <MarketplaceSectionHeader
              title={en ? 'Professional' : 'Profesional'}
              description={
                en
                  ? 'Open the professional profile to review trust details and other services.'
                  : 'Buka profil profesional untuk melihat detail kepercayaan dan layanan lainnya.'
              }
            />
            <a className="block" href={providerHref}>
              <article
                className="rounded-[24px] border bg-white p-4 shadow-[0_14px_40px_-28px_rgba(15,23,42,0.18)] transition-all hover:shadow-[0_18px_42px_-30px_rgba(15,23,42,0.24)] active:scale-[0.98]"
                style={{ borderColor: '#f0f1f4' }}
              >
                <div className="flex gap-4">
                  <InitialPortrait label={detail.offering.professionalDisplayName} size="small" />
                  <div className="flex min-w-0 flex-1 flex-col justify-center">
                    <div className="min-w-0">
                      <h3 className="truncate text-[16px] font-bold leading-tight text-gray-900">
                        {detail.offering.professionalDisplayName}
                      </h3>
                      <p className="mt-1 text-[13px] font-medium" style={{ color: 'var(--ui-primary)' }}>
                        {en ? 'Open professional profile' : 'Buka profil profesional'}
                      </p>
                    </div>
                    <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-gray-500">
                      {en
                        ? 'Review trust details, service fit, and related services on the profile page.'
                        : 'Lihat detail kepercayaan, kecocokan layanan, dan layanan terkait di halaman profesional.'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <MarketplaceFeaturePill tone="soft">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{en ? 'Professional page' : 'Halaman profesional'}</span>
                      </MarketplaceFeaturePill>
                      <MarketplaceFeaturePill tone="soft">
                        <Tag className="h-3.5 w-3.5" />
                        <span>{formatCurrency(detail.offering.priceAmount, locale, detail.offering.currency)}</span>
                      </MarketplaceFeaturePill>
                    </div>
                  </div>
                </div>
              </article>
            </a>
          </MarketplaceSurfaceCard>

          {(detail.related ?? []).length ? (
            <MarketplaceSurfaceCard tone="white">
              <MarketplaceSectionHeader title={en ? 'Related services' : 'Layanan terkait'} />
              <div className="space-y-4">
                {(detail.related ?? []).map((offering) => (
                  <OfferingCard key={offering.id} locale={locale} offering={offering} />
                ))}
              </div>
            </MarketplaceSurfaceCard>
          ) : null}
        </div>

        <MarketplaceStickyActionBar
          eyebrow={en ? 'Selected service' : 'Layanan pilihan'}
          subtitle={`${deliveryModeLabel(detail.offering.deliveryMode, locale)} • ${detail.offering.professionalDisplayName}`}
          title={detail.offering.title}
          actions={
            <>
              <a href={providerHref}>
                <SecondaryButton type="button">{en ? 'Professional profile' : 'Profil profesional'}</SecondaryButton>
              </a>
              <a href={ordersHref}>
                <PrimaryButton type="button">{en ? 'Continue to booking' : 'Lanjut booking'}</PrimaryButton>
              </a>
            </>
          }
        />
      </div>
    </MarketplaceMobileShell>
  );
}
