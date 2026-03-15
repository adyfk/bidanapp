'use client';

import { Activity, MapPin, Navigation, ShieldCheck, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  ProfessionalSectionTitle,
  professionalSectionClassName,
} from '@/features/professional-detail/components/ProfessionalSectionTitle';
import { APP_CONFIG } from '@/lib/config';
import { SIMULATION_MEDIA, SIMULATION_PROFESSIONAL_DETAIL } from '@/lib/constants';
import type { Professional } from '@/types/catalog';

interface ProfessionalTrustSectionsProps {
  profileCopy: {
    credentialsTitle: string;
    feedbackTitle: string;
    recentActivityTitle: string;
    recommendationLabel: string;
    repeatClientsLabel: string;
    totalReviewsLabel: string;
  };
  professional: Professional;
}

export const ProfessionalTrustSections = ({ profileCopy, professional }: ProfessionalTrustSectionsProps) => {
  const t = useTranslations('Professional');

  return (
    <>
      <section className={professionalSectionClassName}>
        <ProfessionalSectionTitle icon={<Star className="h-4 w-4" />} title={profileCopy.feedbackTitle} />

        <div className="mb-5 flex flex-col gap-3 rounded-[24px] bg-[#FCFCFC] p-4 shadow-[0_18px_34px_-28px_rgba(17,24,39,0.42)]">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="flex items-end gap-2">
                <span className="text-[34px] font-bold leading-none text-gray-900">
                  {professional.rating.toFixed(1)}
                </span>
                <span className="mb-1 text-[12px] font-medium text-gray-400">/ 5.0</span>
              </div>
              <p className="mt-2 text-[12px] text-gray-500">
                {professional.reviews} {profileCopy.totalReviewsLabel}
              </p>
            </div>
            <div className="grid flex-1 grid-cols-2 gap-2">
              <div className="rounded-[18px] bg-white px-3 py-3 text-center">
                <p className="text-[16px] font-bold text-gray-900">{professional.feedbackSummary.recommendationRate}</p>
                <p className="mt-1 text-[11px] text-gray-500">{profileCopy.recommendationLabel}</p>
              </div>
              <div className="rounded-[18px] bg-white px-3 py-3 text-center">
                <p className="text-[16px] font-bold text-gray-900">{professional.feedbackSummary.repeatClientRate}</p>
                <p className="mt-1 text-[11px] text-gray-500">{profileCopy.repeatClientsLabel}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {professional.feedbackBreakdown.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="w-16 flex-shrink-0 text-[11px] font-semibold text-gray-500">{item.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${item.percentage}%`, backgroundColor: APP_CONFIG.colors.primary }}
                  />
                </div>
                <span className="w-10 flex-shrink-0 text-right text-[11px] font-medium text-gray-500">
                  {item.total}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {professional.feedbackMetrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-[22px] bg-[#FCFCFC] p-4 shadow-[0_14px_26px_-24px_rgba(17,24,39,0.34)]"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] font-semibold text-gray-900">{metric.label}</p>
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{ backgroundColor: APP_CONFIG.colors.primaryLight, color: APP_CONFIG.colors.primary }}
                >
                  {metric.value}
                </span>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-gray-500">{metric.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={professionalSectionClassName}>
        <ProfessionalSectionTitle icon={<MapPin className="h-4 w-4" />} title={APP_CONFIG.terms.location} />
        <div
          className="relative mb-4 h-[190px] overflow-hidden rounded-[24px] bg-cover bg-center"
          style={{ backgroundImage: `url('${SIMULATION_MEDIA.professionalMapBackgroundImage}')` }}
        >
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px]" />
          <svg
            aria-label="Map preview"
            className="absolute inset-0 h-full w-full drop-shadow-md"
            role="img"
            style={{ zIndex: 1 }}
          >
            <path
              d="M 60,110 L 100,60 L 120,80 L 150,50 C 180,50 180,90 200,90 L 250,130"
              fill="none"
              stroke={APP_CONFIG.colors.primary}
              strokeWidth="3"
            />
            <circle cx="60" cy="110" r="5" fill={APP_CONFIG.colors.primary} />
            <circle cx="250" cy="130" r="5" fill={APP_CONFIG.colors.danger} />
            <circle cx="250" cy="130" r="12" fill={APP_CONFIG.colors.danger} opacity="0.2" className="animate-pulse" />
          </svg>
        </div>

        <div className="mb-4 flex items-end justify-between text-sm">
          <div className="flex gap-8">
            <div>
              <span className="mb-1 block text-[11px] text-gray-400">{t('distance')}</span>
              <span className="font-bold text-gray-900">{SIMULATION_PROFESSIONAL_DETAIL.distance}</span>
            </div>
            <div>
              <span className="mb-1 block text-[11px] text-gray-400">{t('time')}</span>
              <span className="font-bold text-gray-900">{SIMULATION_PROFESSIONAL_DETAIL.travelTime}</span>
            </div>
          </div>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <Navigation className="h-4 w-4 rotate-45" style={{ color: APP_CONFIG.colors.primary }} />
          </button>
        </div>

        <p className="text-[14px] font-bold text-gray-900">
          {professional.addressLines[0] || SIMULATION_PROFESSIONAL_DETAIL.addressLine1}
        </p>
        <p className="mt-1 text-[12px] text-gray-500">
          {professional.addressLines[1] || SIMULATION_PROFESSIONAL_DETAIL.addressLine2}
        </p>
      </section>

      <section className={professionalSectionClassName}>
        <ProfessionalSectionTitle icon={<ShieldCheck className="h-4 w-4" />} title={profileCopy.credentialsTitle} />
        <div className="space-y-3">
          {professional.credentials.map((credential) => (
            <div
              key={credential.title}
              className="rounded-[22px] bg-[#FCFCFC] p-4 shadow-[0_16px_28px_-24px_rgba(17,24,39,0.32)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[14px] font-semibold text-gray-900">{credential.title}</p>
                  <p className="mt-1 text-[12px] font-medium text-gray-500">{credential.issuer}</p>
                </div>
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{ backgroundColor: APP_CONFIG.colors.primaryLight, color: APP_CONFIG.colors.primary }}
                >
                  {credential.year}
                </span>
              </div>
              <p className="mt-3 text-[12px] leading-relaxed text-gray-500">{credential.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] bg-white p-5 shadow-sm">
        <ProfessionalSectionTitle icon={<Activity className="h-4 w-4" />} title={profileCopy.recentActivityTitle} />
        <div>
          {professional.recentActivities.map((activity, index) => (
            <div key={`${activity.dateLabel}-${activity.title}`} className="flex gap-3">
              <div className="flex w-5 flex-col items-center">
                <span className="mt-1 h-3 w-3 rounded-full" style={{ backgroundColor: APP_CONFIG.colors.primary }} />
                {index < professional.recentActivities.length - 1 ? (
                  <span className="mt-2 h-full w-px bg-pink-100" />
                ) : null}
              </div>
              <div className={`flex-1 ${index < professional.recentActivities.length - 1 ? 'pb-5' : ''}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[14px] font-semibold text-gray-900">{activity.title}</p>
                  <span className="text-[11px] font-medium text-gray-400">{activity.dateLabel}</span>
                </div>
                <p
                  className="mt-1 text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: APP_CONFIG.colors.primary }}
                >
                  {activity.channel}
                </p>
                <p className="mt-2 text-[12px] leading-relaxed text-gray-500">{activity.summary}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};
