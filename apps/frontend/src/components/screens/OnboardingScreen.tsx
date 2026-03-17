'use client';

import { ArrowRight, BriefcaseMedical, Sparkles, UserRound } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useRouter } from '@/i18n/routing';
import { APP_CONFIG } from '@/lib/config';
import { ACTIVE_MEDIA_PRESET } from '@/lib/mock-db/runtime';
import { APP_ROUTES, customerAccessRoute, professionalAccessRoute } from '@/lib/routes';
import { useViewerSession } from '@/lib/use-viewer-session';

export const OnboardingScreen = () => {
  const t = useTranslations('Onboarding');
  const router = useRouter();
  const { continueAsVisitor, isProfessional } = useViewerSession();

  return (
    <div
      className="relative flex min-h-full flex-col overflow-hidden text-white"
      style={{
        background: `linear-gradient(180deg, ${APP_CONFIG.colors.primaryDark} 0%, ${APP_CONFIG.colors.primary} 40%, ${APP_CONFIG.colors.primaryLight} 100%)`,
      }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-[-22%] top-[-8%] h-[34%] rounded-[100%] bg-white/14 blur-3xl" />
        <div className="absolute -right-10 top-[22%] h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div
          className="absolute -left-8 bottom-[18%] h-52 w-52 rounded-full blur-3xl"
          style={{ backgroundColor: `${APP_CONFIG.colors.secondary}44` }}
        />
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

      <div className="relative z-10 flex flex-1 flex-col px-5 pb-5 pt-6">
        <div className="relative h-[clamp(260px,37vh,360px)] w-full">
          <div className="absolute inset-x-6 bottom-2 top-8 rounded-[40px] bg-black/18 blur-2xl" />
          <div className="absolute inset-0 overflow-hidden rounded-[38px] border border-white/18 bg-white/10 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.6)] backdrop-blur-md">
            <div className="absolute inset-x-5 top-5 z-20 flex items-start justify-between gap-3">
              <div className="max-w-[11rem] rounded-[22px] border border-white/12 bg-black/16 px-4 py-3 text-left backdrop-blur-md">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/65">{t('getStarted')}</p>
                <p className="mt-1 text-[14px] font-semibold leading-5 text-white">{t('heroHint')}</p>
              </div>
              <div className="rounded-full border border-white/12 bg-white/12 px-3 py-2 text-[12px] font-semibold text-white/80 backdrop-blur-md">
                {t('modeCount')}
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 top-14">
              <Image
                src={ACTIVE_MEDIA_PRESET.onboardingHeroImage}
                alt={ACTIVE_MEDIA_PRESET.onboardingHeroAlt}
                fill
                className="object-contain object-bottom"
                sizes="100vw"
                priority
              />
            </div>
            <div className="absolute inset-x-0 bottom-0 z-10 h-[45%] bg-gradient-to-t from-[#fdf2f8] via-[#fdf2f8]/55 to-transparent" />
          </div>
        </div>

        <div className="-mt-5 rounded-[32px] border border-white/40 bg-white/92 p-4 text-left text-gray-900 shadow-[0_28px_70px_-38px_rgba(15,23,42,0.65)] backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <div>
              <p className="text-[14px] font-bold text-gray-900">{t('getStarted')}</p>
              <p className="text-[12px] text-gray-500">{t('accessPrompt')}</p>
            </div>
            <div className="rounded-full bg-gray-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
              {t('accessBadge')}
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                continueAsVisitor();
                router.push(APP_ROUTES.home);
              }}
              className="flex w-full items-center justify-between rounded-[26px] bg-slate-950 px-4 py-4 text-left text-white shadow-[0_18px_34px_-26px_rgba(15,23,42,0.8)] transition-transform hover:translate-y-[-1px] active:scale-[0.99]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-white/12">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[15px] font-bold leading-5">{t('visitorTitle')}</p>
                  <p className="mt-1 text-[12px] leading-5 text-white/72">{t('visitorDescription')}</p>
                </div>
              </div>
              <div className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10">
                <ArrowRight className="h-4 w-4" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => router.push(customerAccessRoute({ intent: 'general', next: APP_ROUTES.home }))}
              className="flex w-full items-center justify-between rounded-[26px] px-4 py-4 text-left text-white shadow-[0_20px_38px_-26px_rgba(194,23,122,0.75)] transition-transform hover:translate-y-[-1px] active:scale-[0.99]"
              style={{
                background: `linear-gradient(135deg, ${APP_CONFIG.colors.primary} 0%, ${APP_CONFIG.colors.primaryDark} 100%)`,
              }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-white/16">
                  <UserRound className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[15px] font-bold leading-5">{t('customerTitle')}</p>
                  <p className="mt-1 text-[12px] leading-5 text-white/78">{t('customerDescription')}</p>
                </div>
              </div>
              <div className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/12">
                <ArrowRight className="h-4 w-4" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => router.push(isProfessional ? APP_ROUTES.professionalDashboard : professionalAccessRoute())}
              className="flex w-full items-center justify-between rounded-[26px] border border-slate-200 bg-slate-50 px-4 py-4 text-left text-slate-900 transition-transform hover:translate-y-[-1px] active:scale-[0.99]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px]"
                  style={{ backgroundColor: APP_CONFIG.colors.primaryLight, color: APP_CONFIG.colors.primary }}
                >
                  <BriefcaseMedical className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[15px] font-bold leading-5">{t('professionalTitle')}</p>
                  <p className="mt-1 text-[12px] leading-5 text-slate-500">{t('professionalDescription')}</p>
                </div>
              </div>
              <div className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm">
                <ArrowRight className="h-4 w-4" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
