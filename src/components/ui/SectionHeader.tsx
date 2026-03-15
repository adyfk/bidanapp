'use client';
import React from 'react';
import { COLORS } from '@/lib/constants';

interface SectionHeaderProps {
  title: string;
  onSeeAll?: () => void;
}

export const SectionHeader = ({ title, onSeeAll }: SectionHeaderProps) => (
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-[17px] font-bold text-gray-900">{title}</h2>
    <button onClick={onSeeAll} className="text-xs font-semibold" style={{ color: COLORS.primary }}>
      See All
    </button>
  </div>
);
