'use client';

import { useTranslations } from 'next-intl';
import { segmentedButtonClass, segmentedContainerClass } from '@/components/ui/tokens';

interface AppointmentsTabsProps {
  activeTab: 'active' | 'history';
  onChange: (value: 'active' | 'history') => void;
}

export const AppointmentsTabs = ({ activeTab, onChange }: AppointmentsTabsProps) => {
  const t = useTranslations('Appointments');

  return (
    <div className="mb-5 px-5">
      <div className={`flex ${segmentedContainerClass}`}>
        <button
          type="button"
          onClick={() => onChange('active')}
          className={`flex-1 ${segmentedButtonClass(activeTab === 'active')} text-[14px]`}
        >
          {t('active')}
        </button>
        <button
          type="button"
          onClick={() => onChange('history')}
          className={`flex-1 ${segmentedButtonClass(activeTab === 'history')} text-[14px]`}
        >
          {t('history')}
        </button>
      </div>
    </div>
  );
};
