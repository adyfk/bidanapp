'use client';

import type React from 'react';
import { APP_CONFIG } from '@/lib/config';

export const professionalSectionClassName =
  'rounded-[30px] bg-white/94 p-5 shadow-[0_18px_40px_rgba(17,24,39,0.08)] backdrop-blur-sm';

interface ProfessionalSectionTitleProps {
  icon: React.ReactNode;
  title: string;
}

export const ProfessionalSectionTitle = ({ icon, title }: ProfessionalSectionTitleProps) => (
  <div className="mb-5 flex items-center gap-3">
    <span
      className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white shadow-sm"
      style={{
        background: `linear-gradient(135deg, ${APP_CONFIG.colors.primaryLight} 0%, #FFFFFF 100%)`,
        color: APP_CONFIG.colors.primary,
      }}
    >
      {icon}
    </span>
    <h3 className="text-[17px] font-bold text-gray-900">{title}</h3>
  </div>
);
