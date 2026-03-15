'use client';
import React from 'react';
import { useTranslations } from 'next-intl';
import { APP_CONFIG } from '@/lib/config';

interface SectionHeaderProps {
  title: string;
  onSeeAll?: () => void;
}

export const SectionHeader = ({ title, onSeeAll }: SectionHeaderProps) => {
  const t = useTranslations('UI');
  return (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-[17px] font-bold text-gray-900">{title}</h2>
      <button onClick={onSeeAll} className="text-xs font-semibold" style={{ color: APP_CONFIG.colors.primary }}>
        {t('seeAll')}
      </button>
    </div>
  );
};
