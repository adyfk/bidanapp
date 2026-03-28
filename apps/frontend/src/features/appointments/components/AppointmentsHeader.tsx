'use client';

import { useTranslations } from 'next-intl';
import { StandardSearchInput } from '@/components/ui/form-controls';
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

      <StandardSearchInput
        accent="pink"
        placeholder={t('searchPlaceholder')}
        surface="soft"
        value={searchQuery}
        onValueChange={onSearchChange}
        className="rounded-xl border-gray-100 bg-white shadow-sm text-[15px]"
      />
    </div>
  );
};
