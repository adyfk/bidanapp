'use client';

import { MarketplaceFadeIn, MarketplaceLocalePills, MarketplaceMobileShell, MotionAnchor } from '@marketplace/ui';
import { useReducedMotion } from 'framer-motion';
import { ArrowRight, Clock3, Sparkles } from 'lucide-react';
import { type MouseEvent, useEffect, useRef, useState } from 'react';
import { createLocaleSwitcherItems } from '../../../layout/navigation';
import { isEnglishLocale } from '../../../lib/marketplace-copy';

const DEFAULT_REDIRECT_DELAY_MS = 2400;
const REDUCED_MOTION_REDIRECT_DELAY_MS = 1500;
const DEFAULT_PROGRESS_TICK_MS = 80;
const REDUCED_MOTION_PROGRESS_TICK_MS = 160;

export function MarketplaceOnboardingView({
  currentPath,
  locale,
  platformName,
  visitorHref,
}: {
  currentPath: string;
  locale: string;
  platformName: string;
  visitorHref: string;
}) {
  const en = isEnglishLocale(locale);
  const prefersReducedMotion = useReducedMotion();
  const redirectDelayMs = prefersReducedMotion ? REDUCED_MOTION_REDIRECT_DELAY_MS : DEFAULT_REDIRECT_DELAY_MS;
  const redirectedRef = useRef(false);
  const hiddenStartedAtRef = useRef<number | null>(null);
  const pausedMsRef = useRef(0);
  const copy = {
    brandLabel: en ? 'Trusted maternal care' : 'Layanan bidan tepercaya',
    description: en
      ? 'Trusted midwives for mothers, babies, and every follow-up.'
      : 'Bidan tepercaya untuk ibu, bayi, dan setiap tindak lanjut.',
    heroEyebrow: en ? 'Care that feels calmer' : 'Langkah awal yang lebih tenang',
    manualAction: en ? 'Enter now' : 'Masuk sekarang',
    manualHint: en ? 'Skip the splash and continue directly.' : 'Lewati splash dan lanjut langsung.',
    progressCaption: en ? 'Opening your home' : 'Membuka beranda Anda',
    progressHint: en ? 'You will be redirected automatically.' : 'Anda akan diarahkan otomatis.',
    progressLabel: en ? 'Automatic redirect progress' : 'Progres pengalihan otomatis',
    redirectNow: en ? 'Opening home now.' : 'Membuka home sekarang.',
    redirectStatus: en ? 'Preparing your home.' : 'Sedang menyiapkan home Anda.',
    footerNote: en ? 'A short intro before the main home opens.' : 'Intro singkat sebelum home utama terbuka.',
  };
  const [statusMessage, setStatusMessage] = useState(copy.redirectStatus);
  const [remainingMs, setRemainingMs] = useState(redirectDelayMs);

  const remainingSeconds = Math.max(1, Math.ceil(remainingMs / 1000));
  const progressValue = Math.min(
    100,
    Math.max(0, Math.round(((redirectDelayMs - remainingMs) / redirectDelayMs) * 100)),
  );
  const remainingLabel = en ? `Automatic in ${remainingSeconds}s` : `Otomatis dalam ${remainingSeconds} detik`;

  useEffect(() => {
    setRemainingMs(redirectDelayMs);
  }, [redirectDelayMs]);

  useEffect(() => {
    pausedMsRef.current = 0;
    hiddenStartedAtRef.current = document.hidden ? Date.now() : null;
    const startedAt = Date.now();
    const finishRedirect = () => {
      if (redirectedRef.current) {
        return;
      }
      redirectedRef.current = true;
      setStatusMessage(copy.redirectNow);
      window.location.replace(visitorHref);
    };
    const updateRemaining = () => {
      if (redirectedRef.current || document.hidden) {
        return;
      }
      const now = Date.now();
      if (hiddenStartedAtRef.current !== null) {
        pausedMsRef.current += now - hiddenStartedAtRef.current;
        hiddenStartedAtRef.current = null;
      }
      const elapsed = now - startedAt - pausedMsRef.current;
      const next = Math.max(0, redirectDelayMs - elapsed);
      setRemainingMs(next);
      if (next === 0) {
        finishRedirect();
      }
    };
    const handleVisibilityChange = () => {
      if (document.hidden) {
        hiddenStartedAtRef.current = Date.now();
        return;
      }
      updateRemaining();
    };
    const interval = window.setInterval(
      updateRemaining,
      prefersReducedMotion ? REDUCED_MOTION_PROGRESS_TICK_MS : DEFAULT_PROGRESS_TICK_MS,
    );

    updateRemaining();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [copy.redirectNow, prefersReducedMotion, redirectDelayMs, visitorHref]);

  const handleNavigateHome = (event?: MouseEvent<HTMLAnchorElement>) => {
    event?.preventDefault();
    if (redirectedRef.current) {
      return;
    }
    redirectedRef.current = true;
    setStatusMessage(copy.redirectNow);
    window.location.replace(visitorHref);
  };

  return (
    <MarketplaceMobileShell showNav={false}>
      <section
        className="relative flex min-h-[100dvh] flex-col overflow-hidden"
        style={{
          background:
            'radial-gradient(circle at top, rgba(219,234,254,0.98) 0%, rgba(239,246,255,0.96) 34%, rgba(248,250,252,0.98) 68%, #ffffff 100%)',
        }}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-12 top-16 h-44 w-44 rounded-full bg-[#dbeafe] blur-3xl" />
          <div className="absolute -right-16 top-28 h-52 w-52 rounded-full bg-[#e0f2fe] blur-3xl" />
          <div className="absolute inset-x-10 bottom-16 h-28 rounded-full bg-[#f0f9ff] blur-3xl" />
        </div>

        <div className="relative z-10 flex min-h-[100dvh] flex-col px-5 pb-6 pt-5">
          <div className="flex items-center justify-between gap-3">
            <div
              className="rounded-full border bg-white/88 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] shadow-[0_12px_28px_-24px_rgba(15,23,42,0.24)] backdrop-blur-md"
              style={{ borderColor: 'var(--ui-border)', color: 'var(--ui-primary)' }}
            >
              {copy.brandLabel}
            </div>
            <MarketplaceLocalePills activeValue={locale} items={createLocaleSwitcherItems(currentPath, locale)} />
          </div>

          <div className="flex flex-1 items-center justify-center pb-4 pt-2">
            <MarketplaceFadeIn className="w-full">
              <div
                className="mx-auto w-full max-w-[360px] rounded-[36px] border bg-white/94 p-6 shadow-[0_34px_70px_-44px_rgba(15,23,42,0.24)] backdrop-blur-xl"
                style={{ borderColor: 'var(--ui-border)' }}
              >
                <div
                  className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] border text-[var(--ui-primary)] shadow-[0_18px_34px_-24px_rgba(3,105,161,0.2)]"
                  style={{
                    borderColor: 'var(--ui-border)',
                    background:
                      'linear-gradient(145deg, #ffffff 0%, color-mix(in srgb, var(--ui-surface-muted) 74%, white) 100%)',
                  }}
                >
                  <Sparkles className="h-9 w-9" />
                </div>

                <div className="mt-6 text-center">
                  <div
                    className="text-[12px] font-semibold uppercase tracking-[0.24em]"
                    style={{ color: 'var(--ui-primary)' }}
                  >
                    {copy.heroEyebrow}
                  </div>
                  <h1 className="mt-3 text-[46px] font-black leading-[0.94] tracking-[-0.06em] text-slate-950">
                    {platformName}
                  </h1>
                  <p className="mx-auto mt-4 max-w-[18rem] text-[16px] leading-relaxed text-slate-600">
                    {copy.description}
                  </p>
                </div>

                <div
                  className="mt-6 rounded-[28px] border p-4"
                  style={{ backgroundColor: 'var(--ui-surface-muted)', borderColor: 'var(--ui-border)' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[15px] font-semibold text-slate-900">{copy.progressCaption}</div>
                      <div className="mt-1 text-[13px] leading-5 text-slate-600">{copy.progressHint}</div>
                    </div>
                    <div
                      className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-[12px] font-semibold shadow-[0_10px_20px_-18px_rgba(15,23,42,0.22)]"
                      style={{ color: 'var(--ui-primary)' }}
                    >
                      <Clock3 className="h-4 w-4" />
                      <span>{remainingSeconds}s</span>
                    </div>
                  </div>

                  <div
                    aria-label={copy.progressLabel}
                    aria-valuemax={100}
                    aria-valuemin={0}
                    aria-valuenow={progressValue}
                    aria-valuetext={remainingLabel}
                    className="mt-4"
                    role="progressbar"
                  >
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full"
                        style={{
                          background: 'linear-gradient(90deg, var(--ui-secondary) 0%, var(--ui-primary) 100%)',
                          transform: `scaleX(${Math.max(0.04, progressValue / 100)})`,
                          transformOrigin: 'left',
                          transition: prefersReducedMotion ? 'none' : 'transform 120ms linear',
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-3 text-[12px] text-slate-600">{remainingLabel}</div>
                </div>

                <MotionAnchor
                  className="mt-5 inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--ui-primary)] px-4 py-3 text-[14px] font-semibold text-white shadow-[0_20px_30px_-22px_rgba(3,105,161,0.38)]"
                  href={visitorHref}
                  onClick={handleNavigateHome}
                >
                  <span>{copy.manualAction}</span>
                  <ArrowRight className="h-4 w-4" />
                </MotionAnchor>

                <p className="mt-3 text-center text-[12px] leading-5 text-slate-600">{copy.manualHint}</p>
              </div>
            </MarketplaceFadeIn>
          </div>

          <MarketplaceFadeIn>
            <p className="text-center text-[12px] leading-5 text-slate-500">{copy.footerNote}</p>
          </MarketplaceFadeIn>

          <div aria-live="polite" className="sr-only">
            {statusMessage}
          </div>
        </div>
      </section>
    </MarketplaceMobileShell>
  );
}
