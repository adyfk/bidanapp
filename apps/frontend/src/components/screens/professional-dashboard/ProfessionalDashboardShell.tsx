'use client';

import { ArrowRight, Bell, Layers3, MapPin, Star, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { AppAvatar } from '@/components/ui/AppAvatar';
import { InlineFeedbackNotice } from '@/components/ui/InlineFeedbackNotice';
import { useRouter } from '@/i18n/routing';
import { APP_CONFIG } from '@/lib/config';
import {
  APP_ROUTES,
  PROFESSIONAL_DASHBOARD_TABS,
  type ProfessionalDashboardTab,
  professionalDashboardRoute,
  professionalRoute,
} from '@/lib/routes';
import type { Professional } from '@/types/catalog';

interface ProfessionalDashboardShellProps {
  activeCoverageAreaCount: number;
  activeProfessional: Professional;
  activeServiceCount: number;
  activeTab: ProfessionalDashboardTab;
  averageServicePriceLabel: string;
  children: ReactNode;
  clampedCompletionScore: number;
  headerLocationLabel?: string;
  notice?: string | null;
  onDismissNotice?: () => void;
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
  onDismissNotice,
  responseTimeGoal,
}: ProfessionalDashboardShellProps) => {
  const router = useRouter();
  const t = useTranslations('ProfessionalPortal');
  const locationLabel = headerLocationLabel || activeProfessional.location;

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-gray-50 pb-10 custom-scrollbar">
      <div className="sticky top-0 z-20 bg-gray-50 px-6 pb-6 pt-14">
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
            aria-label={t('tabs.requests')}
            onClick={() => router.push(professionalDashboardRoute('requests'))}
            className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white bg-white text-gray-800 shadow-sm transition-colors hover:bg-gray-50"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-[9px] top-[9px] h-2.5 w-2.5 rounded-full border-2 border-white bg-rose-400" />
          </button>
        </div>
      </div>

      <div className="space-y-5 px-5 py-6">
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
            className="flex items-center justify-center gap-2 rounded-full py-4 text-[14px] font-bold text-white shadow-lg shadow-pink-500/20 transition-transform active:scale-[0.99]"
            style={{ backgroundColor: APP_CONFIG.colors.primary }}
          >
            {t('actions.viewPublicProfile')}
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => router.push(APP_ROUTES.explore)}
            className="flex items-center justify-center gap-2 rounded-full bg-gray-100 py-4 text-[14px] font-bold text-gray-700 transition-colors hover:bg-gray-200"
          >
            {t('actions.openCatalog')}
          </button>
        </div>

        <hr className="border-t-1 border-gray-400"></hr>

        <div className="flex gap-2 overflow-auto px-0.5 custom-scrollbar">
          {PROFESSIONAL_DASHBOARD_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => router.push(professionalDashboardRoute(tab))}
              className={`whitespace-nowrap rounded-full border px-4 py-2.5 text-[13px] font-semibold transition-all ${
                activeTab === tab
                  ? 'border-gray-900 bg-gray-900 text-white shadow-sm'
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
  <div className="rounded-[24px] border border-gray-100 bg-white px-4 py-3.5 shadow-sm">
    <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-500">
      <span className="text-pink-500">{icon}</span>
      {label}
    </div>
    <p className="mt-2.5 text-[22px] font-bold text-gray-900">{value}</p>
  </div>
);

const DashboardInfoChip = ({ label, value }: { label: string; value: string }) => (
  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3.5 py-2 text-[12px]">
    <span className="font-medium text-slate-500">{label}</span>
    <span className="font-bold text-slate-900">{value}</span>
  </div>
);
