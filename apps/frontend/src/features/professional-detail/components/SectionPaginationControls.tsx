'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { APP_CONFIG } from '@/lib/config';

interface SectionPaginationControlsProps {
  currentPage: number;
  nextLabel: string;
  onNext: () => void;
  onPrevious: () => void;
  previousLabel: string;
  statusLabel: string;
  totalPages: number;
}

export const SectionPaginationControls = ({
  currentPage,
  nextLabel,
  onNext,
  onPrevious,
  previousLabel,
  statusLabel,
  totalPages,
}: SectionPaginationControlsProps) => {
  if (totalPages <= 1) {
    return null;
  }

  const isPreviousDisabled = currentPage === 1;
  const isNextDisabled = currentPage === totalPages;

  return (
    <div className="mt-4 flex items-center justify-between gap-3 rounded-[20px] bg-[#FCFCFC] px-4 py-3 shadow-[0_14px_26px_-24px_rgba(17,24,39,0.28)]">
      <button
        type="button"
        onClick={onPrevious}
        disabled={isPreviousDisabled}
        className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-[12px] font-semibold text-gray-600 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
      >
        <ChevronLeft className="h-4 w-4" />
        {previousLabel}
      </button>

      <span className="text-[12px] font-semibold text-gray-500">{statusLabel}</span>

      <button
        type="button"
        onClick={onNext}
        disabled={isNextDisabled}
        className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-[12px] font-semibold transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
        style={{ color: APP_CONFIG.colors.primary }}
      >
        {nextLabel}
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};
