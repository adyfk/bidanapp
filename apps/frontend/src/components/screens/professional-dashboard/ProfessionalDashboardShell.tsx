'use client';

import { ArrowRight, Bell, Compass, Layers3, MapPin, Star, UserRound, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { AppAvatar } from '@/components/ui/AppAvatar';
import { InlineFeedbackNotice } from '@/components/ui/InlineFeedbackNotice';
import { neutralSoftPillClass, segmentedContainerClass, softWhitePanelClass } from '@/components/ui/tokens';
import type { ProfessionalOnboardingState } from '@/features/professional-portal/lib/onboarding';
import { useRouter } from '@/i18n/routing';
import {
  APP_ROUTES,
  PROFESSIONAL_DASHBOARD_TABS,
  type ProfessionalDashboardTab,
  professionalDashboardRoute,
  professionalRoute,
} from '@/lib/routes';
import { useProfessionalNotifications } from '@/lib/use-professional-notifications';
import type { ProfessionalLifecycleReviewState } from '@/lib/use-professional-portal';
import type { Professional } from '@/types/catalog';
import { ProfessionalDashboardOnboardingCard } from './ProfessionalDashboardOnboardingCard';

interface ProfessionalDashboardShellProps {
  activeCoverageAreaCount: number;
  activeProfessional: Professional;
  activeServiceCount: number;
  activeTab: ProfessionalDashboardTab | null;
  averageServicePriceLabel: string;
  children: ReactNode;
  clampedCompletionScore: number;
  headerLocationLabel?: string;
  notice?: string | null;
  onboardingState?: ProfessionalOnboardingState | null;
  onDismissNotice?: () => void;
  onPublishProfile?: () => void;
  onSimulateReview?: (status: 'changes_requested' | 'verified') => void;
  onSubmitForReview?: () => void;
  reviewState?: ProfessionalLifecycleReviewState | null;
  responseTimeGoal: string;
}

export const ProfessionalDashboardShell = ({
  activeCoverageAreaCount,
  activeProfessional,
  activeServiceCount,
  activeTab,
  averageServicePriceLabel,
  children,
  clampedCompletionScore,
  headerLocationLabel,
  notice,
  onboardingState,
  onDismissNotice,
  onPublishProfile,
  onSimulateReview,
  onSubmitForReview,
  reviewState,
  responseTimeGoal,
}: ProfessionalDashboardShellProps) => {
  const router = useRouter();
  const t = useTranslations('ProfessionalPortal');
  const { unreadCount } = useProfessionalNotifications();
  const locationLabel = headerLocationLabel || activeProfessional.location;

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[linear-gradient(180deg,#FFF8FC_0%,#FCFCFD_26%,#F8FAFC_100%)] pb-10 custom-scrollbar">
      <div className="sticky top-0 z-20 bg-[linear-gradient(180deg,#FFF8FC_0%,rgba(255,248,252,0.96)_72%,rgba(255,248,252,0)_100%)] px-5 pb-5 pt-12 backdrop-blur-sm">
        <div className="flex items-center justify-between rounded-[28px] border border-white/80 bg-white/72 px-4 py-3 shadow-[0_22px_48px_-36px_rgba(15,23,42,0.22)] backdrop-blur-md">
          <button
            type="button"
            onClick={() => router.push(APP_ROUTES.professionalProfile)}
            className="overflow-hidden rounded-full border-2 border-white shadow-sm transition-opacity hover:opacity-80 active:scale-95"
          >
            <AppAvatar
              name={activeProfessional.name}
              src={activeProfessional.image}
              className="h-11 w-11 rounded-full"
              fallbackClassName="text-[13px] font-bold"
            />
          </button>
          <div className="flex min-w-0 flex-1 flex-col items-center px-3 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              {t('headerLabel')}
            </span>
            <div className="mt-1 flex max-w-full items-center text-[14px] font-bold text-gray-900">
              <MapPin className="mr-1 h-4 w-4 flex-shrink-0 text-pink-500" />
              <span className="truncate">{locationLabel}</span>
            </div>
          </div>
          <button
            type="button"
            aria-label={t('notifications.openAriaLabel')}
            onClick={() => router.push(APP_ROUTES.professionalNotifications)}
            className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white bg-white text-gray-800 shadow-sm transition-colors hover:bg-gray-50"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 ? (
              <span className="absolute -right-1 top-0 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      <div className="space-y-5 px-5 py-6">
        {onboardingState &&
        reviewState &&
        onboardingState.pageState !== 'live' &&
        onPublishProfile &&
        onSimulateReview &&
        onSubmitForReview ? (
          <ProfessionalDashboardOnboardingCard
            onboardingState={onboardingState}
            reviewState={reviewState}
            onPublish={onPublishProfile}
            onSimulateReview={onSimulateReview}
            onSubmit={onSubmitForReview}
          />
        ) : null}

        {notice && onDismissNotice ? <InlineFeedbackNotice message={notice} onDismiss={onDismissNotice} /> : null}

        <div className="flex flex-wrap gap-2">
          <DashboardInfoChip label={t('completionLabel')} value={`${clampedCompletionScore}%`} />
          <DashboardInfoChip label={t('metrics.response')} value={responseTimeGoal} />
        </div>

        <section className="grid grid-cols-2 gap-3">
          <SummaryMetricCard
            icon={<Star className="h-4 w-4" />}
            label={t('metrics.rating')}
            value={String(activeProfessional.rating)}
          />
          <SummaryMetricCard
            icon={<Wallet className="h-4 w-4" />}
            label={t('metrics.averagePrice')}
            value={averageServicePriceLabel}
          />
          <SummaryMetricCard
            icon={<Layers3 className="h-4 w-4" />}
            label={t('metrics.activeServices')}
            value={String(activeServiceCount)}
          />
          <SummaryMetricCard
            icon={<MapPin className="h-4 w-4" />}
            label={t('metrics.coverage')}
            value={`${activeCoverageAreaCount} ${t('metrics.areaUnit')}`}
          />
        </section>

        <div className="grid grid-cols-2 gap-3">
          <DashboardActionButton
            icon={<UserRound className="h-4 w-4" />}
            title={t('actions.viewPublicProfile')}
            variant="primary"
            onClick={() => router.push(professionalRoute(activeProfessional.slug))}
          />
          <DashboardActionButton
            icon={<Compass className="h-4 w-4" />}
            title={t('actions.openCatalog')}
            variant="secondary"
            onClick={() => router.push(APP_ROUTES.explore)}
          />
        </div>

        <div className="rounded-[28px] border border-slate-200/80 bg-white/92 p-2 shadow-[0_20px_40px_-34px_rgba(15,23,42,0.18)]">
          <div
            className={`${segmentedContainerClass} grid grid-cols-2 gap-1.5 rounded-[22px] bg-[linear-gradient(180deg,rgba(248,250,252,0.98)_0%,rgba(241,245,249,0.92)_100%)] p-1.5`}
          >
            {PROFESSIONAL_DASHBOARD_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => router.push(professionalDashboardRoute(tab))}
                aria-current={activeTab === tab ? 'page' : undefined}
                className={`flex min-h-[54px] items-center justify-center rounded-[16px] px-3.5 py-3 text-center text-[12.5px] font-semibold leading-[1.15rem] transition-all ${
                  activeTab === tab
                    ? 'bg-white text-pink-600 shadow-[0_18px_28px_-24px_rgba(236,72,153,0.38)] ring-1 ring-pink-100/90'
                    : 'text-slate-600 hover:bg-white/78 hover:text-slate-800'
                }`}
              >
                <span className="whitespace-normal text-balance">{t(`tabs.${tab}`)}</span>
              </button>
            ))}
          </div>
        </div>

        {children}
      </div>
    </div>
  );
};

const SummaryMetricCard = ({ icon, label, value }: { icon: ReactNode; label: string; value: string }) => (
  <div className={`${softWhitePanelClass} min-h-[96px] px-4 py-3.5`}>
    <div className="flex items-center gap-2 text-[11px] font-semibold leading-5 text-gray-500">
      <span className="text-pink-500">{icon}</span>
      {label}
    </div>
    <p className="mt-3 text-[21px] font-bold leading-tight text-gray-900">{value}</p>
  </div>
);

const DashboardInfoChip = ({ label, value }: { label: string; value: string }) => (
  <div className={`${neutralSoftPillClass} px-3.5 py-2 text-[12px] leading-5`}>
    <span className="font-medium text-slate-500">{label}</span>
    <span className="font-bold text-slate-900">{value}</span>
  </div>
);

const DashboardActionButton = ({
  icon,
  onClick,
  title,
  variant,
}: {
  icon: ReactNode;
  onClick: () => void;
  title: string;
  variant: 'primary' | 'secondary';
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex min-h-[78px] items-start justify-between gap-3 rounded-[24px] border px-4 py-3.5 text-left transition-all active:scale-[0.99] ${
      variant === 'primary'
        ? 'border-pink-200/80 bg-[linear-gradient(180deg,#F7259B_0%,#E11D87_100%)] text-white shadow-[0_22px_34px_-22px_rgba(233,30,140,0.42)]'
        : 'border-slate-200 bg-white text-slate-900 shadow-[0_18px_34px_-28px_rgba(15,23,42,0.22)] hover:bg-slate-50'
    }`}
  >
    <div className="flex min-w-0 items-start gap-3">
      <div
        className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
          variant === 'primary' ? 'bg-white/18 text-white' : 'bg-slate-100 text-slate-700'
        }`}
      >
        {icon}
      </div>
      <span
        className={`whitespace-normal text-[13.5px] font-bold leading-5 ${
          variant === 'primary' ? 'text-white' : 'text-slate-900'
        }`}
      >
        {title}
      </span>
    </div>
    <ArrowRight className={`mt-1 h-4 w-4 flex-shrink-0 ${variant === 'primary' ? 'text-white' : 'text-slate-400'}`} />
  </button>
);
