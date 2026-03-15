'use client';
import { APP_CONFIG } from '@/lib/config';

interface ServiceOptionProps {
  title: string;
  price: string;
  active: boolean;
  onClick: () => void;
}

export const ServiceOption = ({ title, price, active, onClick }: ServiceOptionProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex-1 py-3 px-2 rounded-[20px] border flex flex-col items-center justify-center transition-all ${
      active
        ? 'bg-white shadow-[0_4px_20px_rgba(123,97,255,0.15)] ring-1 z-10'
        : 'border-gray-100 bg-white hover:bg-gray-50 text-gray-400'
    }`}
    style={{ borderColor: active ? APP_CONFIG.colors.primary : '#F3F4F6' }}
  >
    <span
      className={`text-[12px] font-medium ${active ? '' : 'text-gray-500'}`}
      style={{ color: active ? APP_CONFIG.colors.primary : undefined }}
    >
      {title}
    </span>
    <span
      className={`text-[15px] font-bold mt-1`}
      style={{ color: active ? APP_CONFIG.colors.primary : APP_CONFIG.colors.textMain }}
    >
      {price}
    </span>
  </button>
);
