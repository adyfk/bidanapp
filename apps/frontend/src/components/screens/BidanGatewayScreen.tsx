'use client';

import { ArrowRight, BriefcaseMedical, ChevronLeft, ClipboardList, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { useRouter } from '@/i18n/routing';
import { APP_CONFIG } from '@/lib/config';
import { APP_ROUTES, customerAccessRoute } from '@/lib/routes';
import { useViewerSession } from '@/lib/use-viewer-session';

export const BidanGatewayScreen = () => {
  const router = useRouter();
  const t = useTranslations('BidanGateway');
  const { continueAsVisitor } = useViewerSession();

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#f7fbff] pb-10 custom-scrollbar">
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-blue-100/80 bg-white/90 px-4 pb-4 pt-14 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="text-[15px] font-bold text-gray-900">{t('navTitle')}</p>
        <div className="w-10" />
      </div>

      <div className="space-y-6 px-5 py-6">
        <section className="rounded-[30px] border border-blue-100 bg-gradient-to-br from-sky-600 via-blue-600 to-cyan-500 p-6 text-white shadow-[0_24px_60px_-32px_rgba(37,99,235,0.45)]">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/90">
            <BriefcaseMedical className="h-3.5 w-3.5" />
            {t('eyebrow')}
          </div>
          <h1 className="mt-5 text-[28px] font-bold leading-tight">{t('title')}</h1>
          <p className="mt-3 text-[14px] leading-relaxed text-white/85">{t('description')}</p>
        </section>

        <section className="grid gap-4">
          <CapabilityCard
            icon={<LayoutDashboard className="h-5 w-5" />}
            title={t('capabilities.dashboardTitle')}
            description={t('capabilities.dashboardDescription')}
          />
          <CapabilityCard
            icon={<ClipboardList className="h-5 w-5" />}
            title={t('capabilities.queueTitle')}
            description={t('capabilities.queueDescription')}
          />
          <CapabilityCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title={t('capabilities.separationTitle')}
            description={t('capabilities.separationDescription')}
          />
        </section>

        <section className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-gray-400">{t('nextStepLabel')}</p>
          <p className="mt-3 text-[14px] leading-relaxed text-gray-600">{t('nextStepDescription')}</p>

          <div className="mt-5 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => router.push(customerAccessRoute({ intent: 'general', next: APP_ROUTES.home }))}
              className="flex w-full items-center justify-center gap-2 rounded-full py-4 text-[14px] font-bold text-white shadow-sm transition-transform active:scale-[0.99]"
              style={{ backgroundColor: APP_CONFIG.colors.primary }}
            >
              {t('actions.customer')}
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                continueAsVisitor();
                router.push(APP_ROUTES.home);
              }}
              className="w-full rounded-full bg-gray-100 py-4 text-[14px] font-bold text-gray-700 transition-colors hover:bg-gray-200"
            >
              {t('actions.visitor')}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

const CapabilityCard = ({ description, icon, title }: { description: string; icon: ReactNode; title: string }) => (
  <div className="rounded-[26px] border border-gray-100 bg-white p-5 shadow-sm">
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">{icon}</div>
    <h2 className="mt-4 text-[17px] font-bold text-gray-900">{title}</h2>
    <p className="mt-2 text-[13px] leading-relaxed text-gray-600">{description}</p>
  </div>
);
