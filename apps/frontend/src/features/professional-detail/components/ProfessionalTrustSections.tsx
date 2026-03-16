'use client';

import { Activity, MapPin, Navigation, ShieldCheck, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  ProfessionalSectionTitle,
  professionalSectionClassName,
} from '@/features/professional-detail/components/ProfessionalSectionTitle';
import { SectionPaginationControls } from '@/features/professional-detail/components/SectionPaginationControls';
import { APP_CONFIG } from '@/lib/config';
import {
  estimateTravelTimeMinutes,
  getEnabledServiceModes,
  getProfessionalCoverageStatus,
  getProfessionalServiceModes,
} from '@/lib/mock-db/catalog';
import { ACTIVE_MEDIA_PRESET, ACTIVE_USER_CONTEXT } from '@/lib/mock-db/runtime';
import { useUiText } from '@/lib/ui-text';
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

const formatCoordinate = (value: number) => value.toFixed(4);

export const ProfessionalTrustSections = ({ profileCopy, professional }: ProfessionalTrustSectionsProps) => {
  const t = useTranslations('Professional');
  const uiText = useUiText();
  const [feedbackPage, setFeedbackPage] = useState(1);
  const coverageStatus = getProfessionalCoverageStatus(
    professional,
    ACTIVE_USER_CONTEXT.userLocation,
    ACTIVE_USER_CONTEXT.area.id,
  );
  const enabledModes = getEnabledServiceModes(getProfessionalServiceModes(professional));
  const hasHomeVisit = enabledModes.includes('home_visit');
  const practiceCoordinates = professional.practiceLocation?.coordinates || professional.coverage.center;
  const travelTimeMinutes = estimateTravelTimeMinutes(coverageStatus.distanceKm);
  const coveredAreasLabel =
    coverageStatus.coveredAreas.map((area) => area.label).join(' • ') || t('onlineOnlyCoverage');
  const coverageLabel = !hasHomeVisit
    ? t('onlineOnlyCoverage')
    : coverageStatus.isHomeVisitCovered
      ? t('coverageIn')
      : t('coverageOut');
  const coverageToneClass = !hasHomeVisit
    ? 'bg-gray-100 text-gray-600'
    : coverageStatus.isHomeVisitCovered
      ? 'bg-blue-50 text-blue-700'
      : 'bg-amber-50 text-amber-700';

  const mapCenterX = 215;
  const mapCenterY = 102;
  const feedbackPageSize = 2;
  const totalFeedbackPages = Math.ceil(professional.feedbackMetrics.length / feedbackPageSize);
  const visibleFeedbackMetrics = professional.feedbackMetrics.slice(
    (feedbackPage - 1) * feedbackPageSize,
    feedbackPage * feedbackPageSize,
  );
  const radiusPx = hasHomeVisit ? Math.max(28, Math.min(56, professional.coverage.homeVisitRadiusKm * 4.25)) : 24;
  const latitudeOffset = (ACTIVE_USER_CONTEXT.userLocation.latitude - professional.coverage.center.latitude) * 5200;
  const longitudeOffset = (ACTIVE_USER_CONTEXT.userLocation.longitude - professional.coverage.center.longitude) * 5200;
  const userX = Math.max(38, Math.min(292, mapCenterX + longitudeOffset));
  const userY = Math.max(28, Math.min(160, mapCenterY - latitudeOffset));

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
          {visibleFeedbackMetrics.map((metric) => (
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
        <SectionPaginationControls
          currentPage={feedbackPage}
          nextLabel={t('paginationNext')}
          onNext={() => setFeedbackPage((current) => Math.min(current + 1, totalFeedbackPages))}
          onPrevious={() => setFeedbackPage((current) => Math.max(current - 1, 1))}
          previousLabel={t('paginationPrevious')}
          statusLabel={t('paginationStatus', { current: feedbackPage, total: totalFeedbackPages })}
          totalPages={totalFeedbackPages}
        />
      </section>

      <section className={professionalSectionClassName}>
        <ProfessionalSectionTitle icon={<MapPin className="h-4 w-4" />} title={uiText.terms.location} />
        <div
          className="relative mb-4 h-[210px] overflow-hidden rounded-[24px] bg-cover bg-center"
          style={{ backgroundImage: `url('${ACTIVE_MEDIA_PRESET.professionalMapBackgroundImage}')` }}
        >
          <div className="absolute inset-0 bg-white/72 backdrop-blur-[1px]" />
          <svg aria-label="Coverage map preview" className="absolute inset-0 h-full w-full" role="img">
            <path d="M 20 42 H 310" stroke="rgba(148,163,184,0.3)" strokeWidth="1" strokeDasharray="4 6" />
            <path d="M 20 102 H 310" stroke="rgba(148,163,184,0.3)" strokeWidth="1" strokeDasharray="4 6" />
            <path d="M 20 162 H 310" stroke="rgba(148,163,184,0.3)" strokeWidth="1" strokeDasharray="4 6" />
            <path d="M 78 18 V 192" stroke="rgba(148,163,184,0.26)" strokeWidth="1" strokeDasharray="4 6" />
            <path d="M 170 18 V 192" stroke="rgba(148,163,184,0.26)" strokeWidth="1" strokeDasharray="4 6" />
            <path d="M 262 18 V 192" stroke="rgba(148,163,184,0.26)" strokeWidth="1" strokeDasharray="4 6" />

            {hasHomeVisit ? (
              <circle
                cx={mapCenterX}
                cy={mapCenterY}
                r={radiusPx}
                fill={coverageStatus.isHomeVisitCovered ? 'rgba(59,130,246,0.14)' : 'rgba(245,158,11,0.14)'}
                stroke={coverageStatus.isHomeVisitCovered ? '#2563eb' : '#f59e0b'}
                strokeDasharray="6 6"
              />
            ) : null}

            <path
              d={`M ${userX} ${userY} Q ${(userX + mapCenterX) / 2} ${Math.min(userY, mapCenterY) - 22} ${mapCenterX} ${mapCenterY}`}
              fill="none"
              stroke={coverageStatus.isHomeVisitCovered ? '#2563eb' : '#f97316'}
              strokeWidth="3"
            />

            <circle cx={userX} cy={userY} r="7" fill="#111827" />
            <circle cx={mapCenterX} cy={mapCenterY} r="7" fill={APP_CONFIG.colors.primary} />
            <circle
              cx={mapCenterX}
              cy={mapCenterY}
              r="14"
              fill={APP_CONFIG.colors.primary}
              opacity="0.18"
              className="animate-pulse"
            />
          </svg>

          <div className="absolute left-4 top-4 rounded-full bg-white/88 px-3 py-2 text-[11px] font-semibold text-gray-700 shadow-sm">
            {t('selectedArea')}: {coverageStatus.selectedArea?.label || ACTIVE_USER_CONTEXT.currentArea}
          </div>
          <div className="absolute bottom-4 right-4 rounded-full bg-white/92 px-3 py-2 text-[11px] font-semibold text-gray-700 shadow-sm">
            {professional.practiceLocation?.label || professional.location}
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-[20px] bg-[#FCFCFC] px-4 py-3">
            <span className="mb-1 block text-[11px] text-gray-400">{t('distance')}</span>
            <span className="font-bold text-gray-900">{coverageStatus.distanceKm.toFixed(1)} km</span>
          </div>
          <div className="rounded-[20px] bg-[#FCFCFC] px-4 py-3">
            <span className="mb-1 block text-[11px] text-gray-400">{t('time')}</span>
            <span className="font-bold text-gray-900">{travelTimeMinutes} min</span>
          </div>
          <div className="rounded-[20px] bg-[#FCFCFC] px-4 py-3">
            <span className="mb-1 block text-[11px] text-gray-400">{t('homeVisitRadius')}</span>
            <span className="font-bold text-gray-900">{professional.coverage.homeVisitRadiusKm} km</span>
          </div>
          <div className="flex items-end justify-between rounded-[20px] bg-[#FCFCFC] px-4 py-3">
            <div>
              <span className="mb-1 block text-[11px] text-gray-400">{t('coverageArea')}</span>
              <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${coverageToneClass}`}>
                {coverageLabel}
              </span>
            </div>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
            >
              <Navigation className="h-4 w-4 rotate-45" style={{ color: APP_CONFIG.colors.primary }} />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-[22px] bg-[#FCFCFC] p-4 shadow-[0_14px_26px_-24px_rgba(17,24,39,0.34)]">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{t('selectedArea')}</p>
            <p className="mt-1 text-[14px] font-bold text-gray-900">
              {coverageStatus.selectedArea?.label || ACTIVE_USER_CONTEXT.currentArea}
            </p>
            <p className="mt-2 text-[12px] text-gray-500">
              {t('coordinates')}: {formatCoordinate(ACTIVE_USER_CONTEXT.userLocation.latitude)},{' '}
              {formatCoordinate(ACTIVE_USER_CONTEXT.userLocation.longitude)}
            </p>
          </div>

          <div className="rounded-[22px] bg-[#FCFCFC] p-4 shadow-[0_14px_26px_-24px_rgba(17,24,39,0.34)]">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{t('practiceLocation')}</p>
            <p className="mt-1 text-[14px] font-bold text-gray-900">
              {professional.practiceLocation?.label || professional.location}
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-gray-500">
              {professional.practiceLocation?.address || professional.location}
            </p>
            <p className="mt-2 text-[12px] text-gray-500">
              {t('coordinates')}: {formatCoordinate(practiceCoordinates.latitude)},{' '}
              {formatCoordinate(practiceCoordinates.longitude)}
            </p>
          </div>

          <div className="rounded-[22px] bg-[#FCFCFC] p-4 shadow-[0_14px_26px_-24px_rgba(17,24,39,0.34)]">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{t('coverageArea')}</p>
            <p className="mt-1 text-[14px] font-bold text-gray-900">{coveredAreasLabel}</p>
          </div>

          <div className="rounded-[22px] bg-[#FCFCFC] p-4 shadow-[0_14px_26px_-24px_rgba(17,24,39,0.34)]">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{t('serviceModes')}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {enabledModes.map((mode) => (
                <span
                  key={`${professional.id}-${mode}`}
                  className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-700"
                >
                  {mode === 'online' ? t('modeOnline') : mode === 'home_visit' ? t('modeHomeVisit') : t('modeOnsite')}
                </span>
              ))}
            </div>
          </div>
        </div>
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
