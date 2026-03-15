'use client';

import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { APP_CONFIG } from '@/lib/config';

interface AppointmentsHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export const AppointmentsHeader = ({ searchQuery, onSearchChange }: AppointmentsHeaderProps) => {
  const t = useTranslations('Appointments');

  return (
    <div className="sticky top-0 z-20 px-5 pb-4 pt-14" style={{ backgroundColor: APP_CONFIG.colors.bgLight }}>
      <h1 className="mb-4 ml-1 text-[26px] font-bold tracking-tight text-gray-900">{t('title')}</h1>

      <div className="flex items-center rounded-xl border border-gray-100 bg-white px-4 py-2.5 shadow-sm transition-all focus-within:ring-2 focus-within:ring-pink-500/20">
        <Search className="mr-2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          className="w-full border-none bg-transparent text-[15px] text-gray-700 outline-none placeholder:text-gray-400"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
    </div>
  );
};
