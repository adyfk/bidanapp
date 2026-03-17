'use client';

import { BadgeCheck, CalendarDays, MessageSquareText, Pencil, Plus, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  accentPrimaryButtonClass,
  blushSubtlePanelClass,
  compactBadgeClass,
  insetSurfaceClass,
  surfaceCardPaddedClass,
} from '@/components/ui/tokens';
import type { ProfessionalManagedActivityStory, ProfessionalManagedCredential } from '@/lib/use-professional-portal';
import type { Professional } from '@/types/catalog';
import { MiniStatCard, SectionHeading, StackedSectionHeading } from './ProfessionalDashboardShared';

interface ProfessionalDashboardTrustTabProps {
  activeProfessional: Professional;
  galleryCount: number;
  getServiceLabel: (serviceId: string) => string;
  onAddCredential: () => void;
  onAddStory: () => void;
  onEditCredential: (credentialId: string) => void;
  onEditStory: (storyId: string) => void;
  portfolioCount: number;
  responseTimeGoal: string;
  selectedCredentialId: string;
  selectedStoryId: string;
  serviceCount: number;
  trustActivityStories: ProfessionalManagedActivityStory[];
  trustCredentials: ProfessionalManagedCredential[];
}

export const ProfessionalDashboardTrustTab = ({
  activeProfessional,
  galleryCount,
  getServiceLabel,
  onAddCredential,
  onAddStory,
  onEditCredential,
  onEditStory,
  portfolioCount,
  responseTimeGoal,
  selectedCredentialId,
  selectedStoryId,
  serviceCount,
  trustActivityStories,
  trustCredentials,
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

      <div className={surfaceCardPaddedClass}>
        <StackedSectionHeading
          description={t('trust.credentialsDescription')}
          icon={<BadgeCheck className="h-5 w-5" />}
          title={t('trust.credentials')}
          action={
            <button type="button" onClick={onAddCredential} className={`${accentPrimaryButtonClass} w-full`}>
              <Plus className="mr-2 h-4 w-4" />
              {t('trust.addCredentialButton')}
            </button>
          }
        />
        <div className="mt-4 space-y-3">
          {trustCredentials.length === 0 ? (
            <div className={`${blushSubtlePanelClass} px-4 py-4`}>
              <p className="text-[14px] font-bold text-slate-900">{t('trust.emptyCredentialsTitle')}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
                {t('trust.emptyCredentialsDescription')}
              </p>
            </div>
          ) : (
            trustCredentials.map((credential) => {
              const isSelected = credential.id === selectedCredentialId;

              return (
                <button
                  key={credential.id}
                  type="button"
                  onClick={() => onEditCredential(credential.id)}
                  className={`w-full rounded-[22px] border px-4 py-4 text-left transition-all ${
                    isSelected
                      ? 'border-pink-200 bg-pink-50/70 shadow-[0_18px_36px_-30px_rgba(236,72,153,0.35)]'
                      : 'border-slate-200 bg-slate-50 hover:bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[14px] font-bold text-slate-900">{credential.title}</p>
                        <span className={compactBadgeClass}>{credential.year}</span>
                      </div>
                      <p className="mt-1 text-[12px] text-slate-500">{credential.issuer}</p>
                    </div>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500">
                      <Pencil className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-3 text-[13px] leading-relaxed text-slate-600">{credential.note}</p>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className={surfaceCardPaddedClass}>
        <StackedSectionHeading
          description={t('trust.storiesDescription')}
          icon={<CalendarDays className="h-5 w-5" />}
          title={t('trust.stories')}
          action={
            <button type="button" onClick={onAddStory} className={`${accentPrimaryButtonClass} w-full`}>
              <Plus className="mr-2 h-4 w-4" />
              {t('trust.addStoryButton')}
            </button>
          }
        />
        <div className="mt-4 space-y-3">
          {trustActivityStories.length === 0 ? (
            <div className={`${blushSubtlePanelClass} px-4 py-4`}>
              <p className="text-[14px] font-bold text-slate-900">{t('trust.emptyStoriesTitle')}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-500">{t('trust.emptyStoriesDescription')}</p>
            </div>
          ) : (
            trustActivityStories.map((story) => {
              const isSelected = story.id === selectedStoryId;

              return (
                <button
                  key={story.id}
                  type="button"
                  onClick={() => onEditStory(story.id)}
                  className={`w-full rounded-[22px] border px-4 py-4 text-left transition-all ${
                    isSelected
                      ? 'border-pink-200 bg-pink-50/70 shadow-[0_18px_36px_-30px_rgba(236,72,153,0.35)]'
                      : 'border-slate-200 bg-slate-50 hover:bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[14px] font-bold text-slate-900">{story.title}</p>
                      <p className="mt-1 text-[12px] text-slate-500">
                        {story.capturedAt} • {story.location}
                      </p>
                    </div>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500">
                      <Pencil className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-3 text-[13px] leading-relaxed text-slate-600">{story.note}</p>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className={surfaceCardPaddedClass}>
        <SectionHeading
          description={t('trust.feedbackDescription')}
          icon={<Star className="h-5 w-5" />}
          title={t('trust.feedback')}
        />
        <div className="mt-3">
          <span className={compactBadgeClass}>{t('trust.customerGeneratedBadge')}</span>
        </div>
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
        <SectionHeading
          description={t('trust.testimonialsDescription')}
          icon={<MessageSquareText className="h-5 w-5" />}
          title={t('trust.testimonials')}
        />
        <div className="mt-3">
          <span className={compactBadgeClass}>{t('trust.customerGeneratedBadge')}</span>
        </div>
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
    </section>
  );
};
