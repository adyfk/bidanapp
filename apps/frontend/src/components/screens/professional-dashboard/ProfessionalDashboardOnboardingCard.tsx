'use client';

import { ArrowRight, CheckCircle2, ClipboardCheck, Send, ShieldCheck, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { surfaceCardPaddedClass } from '@/components/ui/tokens';
import type { ProfessionalOnboardingState } from '@/features/professional-portal/lib/onboarding';
import { useRouter } from '@/i18n/routing';
import type { ProfessionalLifecycleReviewState } from '@/lib/use-professional-portal';
import { MiniStatCard, SectionHeading } from './ProfessionalDashboardShared';

interface ProfessionalDashboardOnboardingCardProps {
  onboardingState: ProfessionalOnboardingState;
  reviewState: ProfessionalLifecycleReviewState;
  onPublish: () => void;
  onSubmit: () => void;
  onSimulateReview: (status: 'changes_requested' | 'verified') => void;
}

const statusIconMap = {
  awaiting_admin_review: <Send className="h-5 w-5" />,
  changes_requested: <ClipboardCheck className="h-5 w-5" />,
  live: <Sparkles className="h-5 w-5" />,
  onboarding_empty: <ShieldCheck className="h-5 w-5" />,
  onboarding_in_progress: <ShieldCheck className="h-5 w-5" />,
  ready_for_review: <CheckCircle2 className="h-5 w-5" />,
  verified_pending_publish: <ShieldCheck className="h-5 w-5" />,
} as const;

export const ProfessionalDashboardOnboardingCard = ({
  onboardingState,
  reviewState,
  onPublish,
  onSubmit,
  onSimulateReview,
}: ProfessionalDashboardOnboardingCardProps) => {
  const router = useRouter();
  const t = useTranslations('ProfessionalPortal');
  const primaryRoute = onboardingState.nextActionRoute;
  const canResubmit = onboardingState.blockingTaskCount === 0 && reviewState.status === 'changes_requested';

  const handlePrimaryAction = () => {
    if (onboardingState.pageState === 'ready_for_review' || canResubmit) {
      onSubmit();
      return;
    }

    if (onboardingState.pageState === 'verified_pending_publish') {
      onPublish();
      return;
    }

    if (primaryRoute) {
      router.push(primaryRoute);
    }
  };

  const primaryLabel =
    onboardingState.pageState === 'ready_for_review'
      ? t('onboarding.actions.submit')
      : canResubmit
        ? t('onboarding.actions.resubmit')
        : onboardingState.pageState === 'verified_pending_publish'
          ? t('onboarding.actions.publish')
          : t('onboarding.actions.completeNextStep');

  return (
    <section
      className={`${surfaceCardPaddedClass} space-y-4 border-blue-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)]`}
    >
      <SectionHeading
        icon={statusIconMap[onboardingState.pageState]}
        eyebrow={t('onboarding.eyebrow')}
        title={t(`onboarding.status.${onboardingState.lifecycleStatus}.title`)}
        description={t(`onboarding.status.${onboardingState.lifecycleStatus}.description`)}
      />

      <div className="grid grid-cols-2 gap-3">
        <MiniStatCard label={t('onboarding.metrics.progress')} value={`${onboardingState.completionPercent}%`} />
        <MiniStatCard label={t('onboarding.metrics.blocking')} value={String(onboardingState.blockingTaskCount)} />
      </div>

      {reviewState.adminNote ? (
        <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
          <p className="font-semibold">{t('onboarding.adminNote')}</p>
          <p className="mt-1 leading-relaxed">{reviewState.adminNote}</p>
        </div>
      ) : null}

      <div className="grid gap-3">
        {onboardingState.sections.map((section) => (
          <button
            key={section.key}
            type="button"
            onClick={() => router.push(section.route)}
            className="flex items-center justify-between rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition-colors hover:bg-slate-50"
          >
            <div>
              <p className="text-[14px] font-bold text-slate-900">{t(`onboarding.sections.${section.key}`)}</p>
              <p className="mt-1 text-[12px] text-slate-500">
                {t('onboarding.sectionProgress', {
                  completed: section.completedCount,
                  total: section.totalCount,
                })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {section.blockingCount > 0 ? (
                <span className="rounded-full bg-rose-50 px-3 py-1 text-[11px] font-semibold text-rose-700">
                  {t('onboarding.sectionBlocking', { count: section.blockingCount })}
                </span>
              ) : (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                  {t('onboarding.sectionDone')}
                </span>
              )}
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </div>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 pt-1">
        <button
          type="button"
          onClick={handlePrimaryAction}
          className="rounded-full bg-slate-900 px-4 py-3.5 text-[14px] font-bold text-white transition-colors hover:bg-slate-800"
        >
          {primaryLabel}
        </button>

        {onboardingState.pageState === 'awaiting_admin_review' ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onSimulateReview('changes_requested')}
              className="rounded-full border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-bold text-amber-800 transition-colors hover:bg-amber-100"
            >
              {t('onboarding.actions.simulateRevision')}
            </button>
            <button
              type="button"
              onClick={() => onSimulateReview('verified')}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-bold text-emerald-800 transition-colors hover:bg-emerald-100"
            >
              {t('onboarding.actions.simulateVerify')}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
};
