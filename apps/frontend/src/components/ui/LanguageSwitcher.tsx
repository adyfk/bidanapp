'use client';

import React, { useTransition } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';

interface LanguageSwitcherProps {
  variant?: 'light' | 'dark';
}

export const LanguageSwitcher = ({ variant = 'light' }: LanguageSwitcherProps) => {
  const [isPending, startTransition] = useTransition();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggleLocale = (nextLocale: string) => {
    if (locale === nextLocale) return;

    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  const isLight = variant === 'light';

  return (
    <div
      className={`relative w-[88px] h-[36px] rounded-full flex items-center p-1 transition-all duration-300 ${isLight ? 'bg-gray-100/90 hover:bg-gray-200/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]' : 'bg-black/20 backdrop-blur-md border border-white/10 hover:bg-black/30'
        } ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
    >
      {/* Sliding Active Block */}
      <div
        className={`absolute h-[28px] w-[38px] rounded-full transition-all duration-400 ease-[cubic-bezier(0.25,1,0.5,1)] ${isLight ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]' : 'bg-white/20 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.2)] border border-white/10'
          }`}
        style={{
          transform: locale === 'en' ? 'translateX(41px)' : 'translateX(1px)',
        }}
      />

      {/* Labels */}
      <div className="relative z-10 flex w-full h-full text-[12px] font-bold tracking-wide">
        <button
          onClick={() => toggleLocale('id')}
          className={`flex-1 flex items-center justify-center rounded-full transition-colors duration-300 ${locale === 'id'
              ? (isLight ? 'text-gray-900' : 'text-white')
              : (isLight ? 'text-gray-400 hover:text-gray-600' : 'text-white/50 hover:text-white')
            }`}
        >
          ID
        </button>
        <button
          onClick={() => toggleLocale('en')}
          className={`flex-1 flex items-center justify-center rounded-full transition-colors duration-300 ${locale === 'en'
              ? (isLight ? 'text-gray-900' : 'text-white')
              : (isLight ? 'text-gray-400 hover:text-gray-600' : 'text-white/50 hover:text-white')
            }`}
        >
          EN
        </button>
      </div>
    </div>
  );
};
