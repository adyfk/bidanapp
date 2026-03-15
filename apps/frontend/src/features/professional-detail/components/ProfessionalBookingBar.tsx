'use client';

import { InlineFeedbackNotice } from '@/components/ui/InlineFeedbackNotice';
import type { ProfessionalServiceEntry } from '@/features/professional-detail/hooks/useProfessionalDetail';
import { APP_CONFIG } from '@/lib/config';

interface ProfessionalBookingBarProps {
  ctaLabel: string;
  notice: string | null;
  onDismissNotice: () => void;
  onRequestBooking: () => void;
  selectedServiceEntry: ProfessionalServiceEntry | null;
}

export const ProfessionalBookingBar = ({
  ctaLabel,
  notice,
  onDismissNotice,
  onRequestBooking,
  selectedServiceEntry,
}: ProfessionalBookingBarProps) => {
  return (
    <div className="absolute bottom-0 left-0 z-30 w-full rounded-t-[34px] bg-white/90 p-6 pt-5 shadow-[0_-18px_40px_rgba(17,24,39,0.08)] backdrop-blur-xl">
      <div className="mb-5 space-y-4">
        {notice ? <InlineFeedbackNotice message={notice} onDismiss={onDismissNotice} /> : null}

        {selectedServiceEntry ? (
          <div className="rounded-[20px] px-4 py-3" style={{ backgroundColor: APP_CONFIG.colors.primaryLight }}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <p
                  className="text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: APP_CONFIG.colors.primary }}
                >
                  {selectedServiceEntry.catalogService.badge}
                </p>
                <p className="mt-1 text-[14px] font-bold text-gray-900">{selectedServiceEntry.catalogService.name}</p>
              </div>
              <div className="text-right">
                <p className="text-[15px] font-bold text-gray-900">{selectedServiceEntry.serviceMapping.price}</p>
                <p className="mt-1 text-[11px] font-medium text-gray-500">
                  {selectedServiceEntry.serviceMapping.duration}
                </p>
              </div>
            </div>
            <p className="text-[13px] leading-relaxed text-gray-600">
              {selectedServiceEntry.serviceMapping.summary || selectedServiceEntry.catalogService.shortDescription}
            </p>
          </div>
        ) : null}
      </div>

      <button
        type="button"
        className="w-full rounded-full py-4 text-[15px] font-bold text-white transition-transform active:scale-[0.98]"
        style={{
          backgroundColor: APP_CONFIG.colors.primary,
          boxShadow: '0 12px 28px rgba(233, 30, 140, 0.28)',
        }}
        onClick={onRequestBooking}
        disabled={!selectedServiceEntry}
      >
        {ctaLabel}
      </button>
    </div>
  );
};
