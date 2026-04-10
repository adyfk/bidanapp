'use client';

import { MarketplaceFadeIn, MarketplaceMobileShell, MotionAnchor } from '@marketplace/ui';
import { useReducedMotion } from 'framer-motion';
import { ArrowRight, Heart } from 'lucide-react';
import { type MouseEvent, useEffect, useRef, useState } from 'react';
import { isEnglishLocale } from '../../../lib/marketplace-copy';

const DEFAULT_REDIRECT_DELAY_MS = 5400;
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

  const tagline = en ? 'Care you can trust.' : 'Perawatan yang bisa Anda percaya.';
  const ctaLabel = en ? 'Get Started' : 'Mulai Sekarang';
  const redirectNowText = en ? 'Opening home now.' : 'Membuka home sekarang.';
  const redirectStatusText = en ? 'Preparing your home.' : 'Sedang menyiapkan home Anda.';

  const [statusMessage, setStatusMessage] = useState(redirectStatusText);
  const [remainingMs, setRemainingMs] = useState(redirectDelayMs);

  const progressValue = Math.min(
    100,
    Math.max(0, Math.round(((redirectDelayMs - remainingMs) / redirectDelayMs) * 100)),
  );

  useEffect(() => {
    setRemainingMs(redirectDelayMs);
  }, [redirectDelayMs]);

  useEffect(() => {
    pausedMsRef.current = 0;
    hiddenStartedAtRef.current = document.hidden ? Date.now() : null;
    const startedAt = Date.now();
    const finishRedirect = () => {
      if (redirectedRef.current) return;
      redirectedRef.current = true;
      setStatusMessage(redirectNowText);
      window.location.replace(visitorHref);
    };
    const updateRemaining = () => {
      if (redirectedRef.current || document.hidden) return;
      const now = Date.now();
      if (hiddenStartedAtRef.current !== null) {
        pausedMsRef.current += now - hiddenStartedAtRef.current;
        hiddenStartedAtRef.current = null;
      }
      const elapsed = now - startedAt - pausedMsRef.current;
      const next = Math.max(0, redirectDelayMs - elapsed);
      setRemainingMs(next);
      if (next === 0) finishRedirect();
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
  }, [redirectNowText, prefersReducedMotion, redirectDelayMs, visitorHref]);

  const handleNavigateHome = (event?: MouseEvent<HTMLAnchorElement>) => {
    event?.preventDefault();
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    setStatusMessage(redirectNowText);
    window.location.replace(visitorHref);
  };

  return (
    <MarketplaceMobileShell showNav={false}>
      <section className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-white">
        {/* ── Background: soft pink glow ── */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-[18%] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#FFD6E5] opacity-40 blur-[120px]" />
          <div className="absolute -right-20 top-[45%] h-[200px] w-[200px] rounded-full bg-[#FFE0EC] opacity-30 blur-[80px]" />
        </div>

        {/* ── Content ── */}
        <div className="relative z-10 flex min-h-[100dvh] flex-col items-center justify-center px-8">
          <MarketplaceFadeIn>
            <div className="flex flex-col items-center text-center">
              {/* Icon */}
              <div
                className="flex h-16 w-16 items-center justify-center rounded-[22px]"
                style={{
                  background: 'linear-gradient(135deg, #E8588A 0%, #FF7EB3 100%)',
                  boxShadow: '0 16px 40px -12px rgba(232,88,138,0.4)',
                }}
              >
                <Heart className="h-7 w-7 text-white" fill="white" />
              </div>

              {/* Brand */}
              <h1 className="mt-8 text-[36px] font-black tracking-[-0.04em] text-[#1A1A1A]">{platformName}</h1>

              {/* Tagline */}
              <p className="mt-3 text-[16px] font-light tracking-wide text-[#888888]">{tagline}</p>

              {/* CTA */}
              <MotionAnchor
                className="mt-10 inline-flex min-h-[52px] w-full max-w-[260px] cursor-pointer items-center justify-center gap-2 rounded-full px-8 py-3.5 text-[15px] font-bold text-white"
                href={visitorHref}
                onClick={handleNavigateHome}
                style={{
                  background: 'linear-gradient(135deg, #E8588A 0%, #FF7EB3 100%)',
                  boxShadow: '0 20px 48px -14px rgba(232,88,138,0.45)',
                }}
              >
                <span>{ctaLabel}</span>
                <ArrowRight className="h-4 w-4" />
              </MotionAnchor>

              {/* Progress */}
              <div className="mt-8 w-full max-w-[200px]">
                <div aria-valuemax={100} aria-valuemin={0} aria-valuenow={progressValue} role="progressbar">
                  <div className="h-[2px] overflow-hidden rounded-full bg-[#F0F0F0]">
                    <div
                      className="h-full rounded-full bg-[#E8588A]"
                      style={{
                        transform: `scaleX(${Math.max(0.04, progressValue / 100)})`,
                        transformOrigin: 'left',
                        transition: prefersReducedMotion ? 'none' : 'transform 120ms linear',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </MarketplaceFadeIn>

          <div aria-live="polite" className="sr-only">
            {statusMessage}
          </div>
        </div>
      </section>
    </MarketplaceMobileShell>
  );
}
