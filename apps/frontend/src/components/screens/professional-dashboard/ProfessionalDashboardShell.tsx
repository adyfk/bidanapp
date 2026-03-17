'use client';

import { ArrowRight, Bell, Layers3, MapPin, Star, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { AppAvatar } from '@/components/ui/AppAvatar';
import { InlineFeedbackNotice } from '@/components/ui/InlineFeedbackNotice';
import {
  accentPrimaryButtonClass,
  darkPrimaryButtonClass,
  neutralSoftPillClass,
  softWhitePanelClass,
} from '@/components/ui/tokens';
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
      <div className="sticky top-0 z-20 bg-[linear-gradient(180deg,#FFF8FC_0%,rgba(255,248,252,0.96)_72%,rgba(255,248,252,0)_100%)] px-6 pb-6 pt-14 backdrop-blur-sm">
        <div className="flex items-center justify-between">
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
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-medium tracking-wide text-gray-400">{t('headerLabel')}</span>
            <div className="flex items-center text-[14px] font-bold text-gray-900">
              <MapPin className="mr-1 h-4 w-4 text-pink-500" />
              {locationLabel}
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

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => router.push(professionalRoute(activeProfessional.slug))}
            className={`${accentPrimaryButtonClass} flex items-center justify-center gap-2 py-4 text-[14px]`}
          >
            {t('actions.viewPublicProfile')}
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => router.push(APP_ROUTES.explore)}
            className={`${darkPrimaryButtonClass} flex items-center justify-center gap-2 py-4 text-[14px]`}
          >
            {t('actions.openCatalog')}
          </button>
        </div>

        <hr className="border-t border-pink-100/80" />

        <div className="flex gap-2 overflow-auto px-0.5 custom-scrollbar">
          {PROFESSIONAL_DASHBOARD_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => router.push(professionalDashboardRoute(tab))}
              className={`whitespace-nowrap rounded-full border px-4 py-2.5 text-[13px] font-semibold transition-all ${
                activeTab === tab
                  ? 'border-pink-100 bg-pink-50 text-pink-600 shadow-[0_14px_30px_-24px_rgba(236,72,153,0.45)]'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-slate-50'
              }`}
            >
              {t(`tabs.${tab}`)}
            </button>
          ))}
        </div>

        {children}
      </div>
    </div>
  );
};

const SummaryMetricCard = ({ icon, label, value }: { icon: ReactNode; label: string; value: string }) => (
  <div className={`${softWhitePanelClass} px-4 py-3.5`}>
    <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-500">
      <span className="text-pink-500">{icon}</span>
      {label}
    </div>
    <p className="mt-2.5 text-[22px] font-bold text-gray-900">{value}</p>
  </div>
);

const DashboardInfoChip = ({ label, value }: { label: string; value: string }) => (
  <div className={`${neutralSoftPillClass} px-3.5 py-2 text-[12px]`}>
    <span className="font-medium text-slate-500">{label}</span>
    <span className="font-bold text-slate-900">{value}</span>
  </div>
);
