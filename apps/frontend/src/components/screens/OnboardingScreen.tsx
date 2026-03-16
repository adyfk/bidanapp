'use client';

import { ArrowRight, BriefcaseMedical, Sparkles, UserRound } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useRouter } from '@/i18n/routing';
import { APP_CONFIG } from '@/lib/config';
import { ACTIVE_MEDIA_PRESET } from '@/lib/mock-db/runtime';
import { APP_ROUTES, customerAccessRoute } from '@/lib/routes';
import { useViewerSession } from '@/lib/use-viewer-session';

export const OnboardingScreen = () => {
  const t = useTranslations('Onboarding');
  const router = useRouter();
  const { continueAsVisitor } = useViewerSession();

  return (
    <div
      className="flex flex-col h-full text-white relative overflow-hidden"
      style={{ backgroundColor: APP_CONFIG.colors.primary }}
    >
      {/* Dekorasi Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] -left-[20%] w-[140%] h-[40%] bg-white/10 rounded-[100%] rotate-[-10deg]"></div>
        <div className="absolute top-[40%] -left-[20%] w-[140%] h-[40%] bg-white/10 rounded-[100%] rotate-[10deg]"></div>
      </div>

      {/* Header / Top Bar */}
      <div className="absolute top-0 w-full flex justify-end p-6 z-20">
        <LanguageSwitcher variant="dark" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-start pt-24 px-8 z-10 text-center relative">
        <h1 className="text-[32px] font-bold leading-[1.2] mb-4 drop-shadow-sm">{APP_CONFIG.appName}</h1>
        <p className="text-white/80 text-[15px] mb-10 font-medium">{APP_CONFIG.seoDescription}</p>
        <div className="w-full max-w-sm space-y-3">
          <button
            type="button"
            onClick={() => {
              continueAsVisitor();
              router.push(APP_ROUTES.home);
            }}
            className="flex w-full items-center justify-between rounded-[24px] border border-white/10 bg-black/20 px-5 py-4 text-left text-white backdrop-blur-md transition-colors hover:bg-black/30 active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[15px] font-bold">{t('visitorTitle')}</p>
                <p className="text-[12px] text-white/75">{t('visitorDescription')}</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => router.push(customerAccessRoute({ intent: 'general', next: APP_ROUTES.home }))}
            className="flex w-full items-center justify-between rounded-[24px] border border-white/10 bg-white px-5 py-4 text-left text-gray-900 shadow-xl shadow-pink-900/10 transition-transform active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl"
                style={{ backgroundColor: APP_CONFIG.colors.primaryLight, color: APP_CONFIG.colors.primary }}
              >
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[15px] font-bold">{t('customerTitle')}</p>
                <p className="text-[12px] text-gray-500">{t('customerDescription')}</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => router.push(APP_ROUTES.bidanAccess)}
            className="flex w-full items-center justify-between rounded-[24px] border border-white/10 bg-white/10 px-5 py-4 text-left text-white backdrop-blur-md transition-colors hover:bg-white/15 active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                <BriefcaseMedical className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[15px] font-bold">{t('bidanTitle')}</p>
                <p className="text-[12px] text-white/75">{t('bidanDescription')}</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="relative h-[55%] flex justify-center items-end z-10 w-full max-w-sm mx-auto">
        <Image
          src={ACTIVE_MEDIA_PRESET.onboardingHeroImage}
          alt={ACTIVE_MEDIA_PRESET.onboardingHeroAlt}
          fill
          className="object-cover object-top drop-shadow-2xl"
          style={{
            maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 100%)',
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 100%)',
          }}
        />
      </div>
    </div>
  );
};
