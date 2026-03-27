'use client';

import { ArrowRight, BriefcaseMedical, Sparkles, UserRound } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { type CSSProperties, type ReactNode, useState } from 'react';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useRouter } from '@/i18n/routing';
import { APP_MEDIA_PRESET } from '@/lib/app-media';
import { APP_CONFIG } from '@/lib/config';
import { APP_ROUTES, customerAccessRoute, professionalAccessRoute } from '@/lib/routes';
import { useViewerSession } from '@/lib/use-viewer-session';

interface AccessOptionCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  onClick: () => void;
  className: string;
  iconClassName: string;
  titleClassName: string;
  descriptionClassName: string;
  arrowClassName: string;
  style?: CSSProperties;
}

const AccessOptionCard = ({
  title,
  description,
  icon,
  onClick,
  className,
  iconClassName,
  titleClassName,
  descriptionClassName,
  arrowClassName,
  style,
}: AccessOptionCardProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`group flex w-full items-start gap-4 rounded-[28px] px-4 py-4 text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99] ${className}`}
    style={style}
  >
    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] ${iconClassName}`}>{icon}</div>
    <div className="min-w-0 flex-1">
      <p className={`text-[15px] font-bold leading-5 ${titleClassName}`}>{title}</p>
      <p className={`mt-2 text-[12px] leading-5 ${descriptionClassName}`}>{description}</p>
    </div>
    <div
      className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors ${arrowClassName}`}
    >
      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
    </div>
  </button>
);

export const OnboardingScreen = () => {
  const t = useTranslations('Onboarding');
  const router = useRouter();
  const { continueAsVisitor, isProfessional } = useViewerSession();
  const [hasHeroImageError, setHasHeroImageError] = useState(false);

  return (
    <div
      className="relative flex min-h-full flex-col overflow-hidden text-white"
      style={{
        background: `linear-gradient(180deg, ${APP_CONFIG.colors.primaryDark} 0%, ${APP_CONFIG.colors.primary} 34%, #f29ac4 58%, #fff3f9 79%, #fffafc 100%)`,
      }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-[-20%] top-[-10%] h-[32%] rounded-[100%] bg-white/16 blur-3xl" />
        <div className="absolute -right-14 top-[18%] h-52 w-52 rounded-full bg-white/12 blur-3xl" />
        <div
          className="absolute -left-10 bottom-[22%] h-48 w-48 rounded-full blur-3xl"
          style={{ backgroundColor: `${APP_CONFIG.colors.secondary}44` }}
        />
        <div className="absolute inset-x-0 bottom-0 h-[36%] bg-gradient-to-t from-white/75 via-white/10 to-transparent" />
      </div>

      <div className="relative z-10 flex items-center justify-between px-5 pt-5">
        <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/78 backdrop-blur-md">
          {t('getStarted')}
        </div>
        <LanguageSwitcher variant="dark" />
      </div>

      <div className="relative z-10 px-5 pt-7 text-center">
        <h1 className="text-[42px] font-bold leading-[0.95] tracking-[-0.04em] drop-shadow-sm">{APP_CONFIG.appName}</h1>
        <p className="mx-auto mt-4 max-w-[22rem] text-[15px] font-medium leading-6 text-white/82">
          {APP_CONFIG.seoDescription}
        </p>
      </div>

      <div className="relative z-10 flex flex-1 flex-col px-5 pb-8 pt-6">
        <section className="relative overflow-hidden rounded-[36px] border border-white/18 bg-white/10 p-5 shadow-[0_32px_80px_-44px_rgba(76,14,45,0.62)] backdrop-blur-md">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-12 top-0 h-32 w-32 rounded-full bg-white/12 blur-3xl" />
            <div className="absolute -left-6 bottom-8 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
          </div>

          <div className="relative flex items-start justify-between gap-3">
            <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/74 backdrop-blur-md">
              {t('getStarted')}
            </div>
            <div className="rounded-full border border-white/15 bg-white/12 px-3 py-1.5 text-[12px] font-semibold text-white/82 backdrop-blur-md">
              {t('modeCount')}
            </div>
          </div>

          <div className="relative mt-5 grid grid-cols-[minmax(0,1fr)_132px] items-end gap-4">
            <div className="min-w-0 pb-1 text-left">
              <h2 className="max-w-[11rem] text-[28px] font-bold leading-[1.06] tracking-[-0.03em] text-white">
                {t('heroHint')}
              </h2>
              <p className="mt-3 max-w-[15rem] text-[13px] leading-6 text-white/78">{t('accessPrompt')}</p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/14 bg-black/12 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/72 backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-white/70" />
                {t('accessBadge')}
              </div>
            </div>

            <div className="relative h-[224px] overflow-hidden rounded-[28px] border border-white/18 bg-[radial-gradient(circle_at_top,#ffffff_0%,#fad1e4_42%,#ee4f9d_100%)] shadow-[0_20px_54px_-34px_rgba(17,24,39,0.58)]">
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.24)_0%,rgba(255,255,255,0.02)_38%,rgba(253,242,248,0.65)_100%)]" />
              {hasHeroImageError ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/35 bg-white/30 text-white shadow-[0_20px_40px_-26px_rgba(236,72,153,0.95)] backdrop-blur-md">
                    <BriefcaseMedical className="h-8 w-8" />
                  </div>
                </div>
              ) : (
                <div className="absolute inset-x-0 bottom-0 top-3">
                  <Image
                    src={APP_MEDIA_PRESET.onboardingHeroImage}
                    alt={APP_MEDIA_PRESET.onboardingHeroAlt}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 768px) 132px, 160px"
                    priority
                    onError={() => setHasHeroImageError(true)}
                  />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#fdebf5] via-[#fdebf5]/56 to-transparent" />
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[32px] border border-white/55 bg-white/92 p-4 text-left text-gray-900 shadow-[0_28px_60px_-38px_rgba(15,23,42,0.45)] backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between gap-3 px-1">
            <div>
              <p className="text-[14px] font-bold text-gray-900">{t('getStarted')}</p>
              <p className="text-[12px] text-gray-500">{t('accessPrompt')}</p>
            </div>
            <div className="rounded-full bg-rose-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-500">
              {t('accessBadge')}
            </div>
          </div>

          <div className="space-y-3">
            <AccessOptionCard
              title={t('visitorTitle')}
              description={t('visitorDescription')}
              icon={<Sparkles className="h-5 w-5" />}
              onClick={() => {
                continueAsVisitor();
                router.push(APP_ROUTES.home);
              }}
              className="bg-slate-950 text-white shadow-[0_22px_40px_-30px_rgba(15,23,42,0.88)]"
              iconClassName="bg-white/12 text-white"
              titleClassName="text-white"
              descriptionClassName="text-white/72"
              arrowClassName="border border-white/10 bg-white/10 text-white"
            />

            <AccessOptionCard
              title={t('customerTitle')}
              description={t('customerDescription')}
              icon={<UserRound className="h-5 w-5" />}
              onClick={() => router.push(customerAccessRoute({ intent: 'general', next: APP_ROUTES.home }))}
              className="text-white shadow-[0_22px_42px_-28px_rgba(194,23,122,0.78)]"
              iconClassName="bg-white/16 text-white"
              titleClassName="text-white"
              descriptionClassName="text-white/80"
              arrowClassName="border border-white/12 bg-white/12 text-white"
              style={{
                background: `linear-gradient(135deg, ${APP_CONFIG.colors.primary} 0%, ${APP_CONFIG.colors.primaryDark} 58%, #a81367 100%)`,
              }}
            />

            <AccessOptionCard
              title={t('professionalTitle')}
              description={t('professionalDescription')}
              icon={<BriefcaseMedical className="h-5 w-5" />}
              onClick={() => router.push(isProfessional ? APP_ROUTES.professionalDashboard : professionalAccessRoute())}
              className="border border-rose-100 bg-[linear-gradient(180deg,#FFF9FC_0%,#FFFFFF_100%)] text-slate-900 shadow-[0_16px_30px_-28px_rgba(15,23,42,0.35)]"
              iconClassName="bg-rose-50 text-rose-500"
              titleClassName="text-slate-900"
              descriptionClassName="text-slate-500"
              arrowClassName="bg-white text-slate-500 shadow-sm"
            />
          </div>
        </section>
      </div>
    </div>
  );
};
