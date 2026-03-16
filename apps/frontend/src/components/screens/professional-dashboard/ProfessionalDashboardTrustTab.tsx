'use client';

import { BadgeCheck, MessageSquareText, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { compactBadgeClass, insetSurfaceClass, surfaceCardPaddedClass } from '@/components/ui/tokens';
import type { Professional } from '@/types/catalog';
import { MiniStatCard, SectionHeading } from './ProfessionalDashboardShared';

interface ProfessionalDashboardTrustTabProps {
  activeProfessional: Professional;
  galleryCount: number;
  getServiceLabel: (serviceId: string) => string;
  portfolioCount: number;
  responseTimeGoal: string;
  serviceCount: number;
}

export const ProfessionalDashboardTrustTab = ({
  activeProfessional,
  galleryCount,
  getServiceLabel,
  portfolioCount,
  responseTimeGoal,
  serviceCount,
}: ProfessionalDashboardTrustTabProps) => {
  const t = useTranslations('ProfessionalPortal');
  const featuredTestimonials = activeProfessional.testimonials.slice(0, 2);

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <MiniStatCard
          label={t('trust.summary.recommendationRate')}
          value={activeProfessional.feedbackSummary.recommendationRate}
        />
        <MiniStatCard
          label={t('trust.summary.repeatClientRate')}
          value={activeProfessional.feedbackSummary.repeatClientRate}
        />
      </div>

      <div className="grid gap-4">
        <div className={surfaceCardPaddedClass}>
          <SectionHeading icon={<BadgeCheck className="h-5 w-5" />} title={t('trust.credentials')} />
          <div className="mt-4 grid gap-2.5">
            {activeProfessional.credentials.map((credential) => (
              <div
                key={`${credential.title}-${credential.year}`}
                className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[14px] font-bold text-slate-900">{credential.title}</p>
                  <span className={compactBadgeClass}>{credential.year}</span>
                </div>
                <p className="mt-1 text-[12px] text-slate-500">{credential.issuer}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{credential.note}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={surfaceCardPaddedClass}>
          <SectionHeading icon={<Star className="h-5 w-5" />} title={t('trust.feedback')} />
          <div className="mt-4 grid gap-3">
            {activeProfessional.feedbackMetrics.slice(0, 3).map((metric) => (
              <div key={metric.index} className={`${insetSurfaceClass} px-4 py-3.5`}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[13px] font-semibold text-slate-700">{metric.label}</p>
                  <p className="text-[18px] font-bold text-slate-900">{metric.value}</p>
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-slate-500">{metric.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={surfaceCardPaddedClass}>
          <SectionHeading icon={<MessageSquareText className="h-5 w-5" />} title={t('trust.testimonials')} />
          <div className="mt-4 grid gap-3">
            {featuredTestimonials.map((testimonial) => (
              <div key={testimonial.index} className={`${insetSurfaceClass} px-4 py-3.5`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-bold text-slate-900">{testimonial.author}</p>
                    <p className="mt-1 text-[12px] text-slate-500">
                      {testimonial.role} • {testimonial.dateLabel}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-700">
                    {testimonial.rating}
                  </span>
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-slate-600">"{testimonial.quote}"</p>
                {testimonial.serviceId ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className={compactBadgeClass}>{getServiceLabel(testimonial.serviceId)}</span>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className={surfaceCardPaddedClass}>
          <SectionHeading title={t('trust.customerSignals')} />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <MiniStatCard label={t('trust.signals.services')} value={String(serviceCount)} />
            <MiniStatCard label={t('trust.signals.portfolio')} value={String(portfolioCount)} />
            <MiniStatCard label={t('trust.signals.gallery')} value={String(galleryCount)} />
            <MiniStatCard label={t('trust.signals.response')} value={responseTimeGoal} />
          </div>
        </div>
      </div>
    </section>
  );
};
