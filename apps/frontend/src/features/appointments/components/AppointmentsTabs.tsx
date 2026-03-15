'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

interface AppointmentsTabsProps {
  activeTab: 'active' | 'history';
  onChange: (value: 'active' | 'history') => void;
}

export const AppointmentsTabs = ({ activeTab, onChange }: AppointmentsTabsProps) => {
  const t = useTranslations('Appointments');

  return (
    <div className="mb-5 px-5">
      <div className="flex rounded-[16px] bg-gray-100/80 p-1">
        <button
          type="button"
          onClick={() => onChange('active')}
          className={`flex-1 rounded-[12px] py-2 text-[14px] font-bold transition-all duration-300 ${
            activeTab === 'active' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('active')}
        </button>
        <button
          type="button"
          onClick={() => onChange('history')}
          className={`flex-1 rounded-[12px] py-2 text-[14px] font-bold transition-all duration-300 ${
            activeTab === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('history')}
        </button>
      </div>
    </div>
  );
};
