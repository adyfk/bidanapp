'use client';

import { CircleCheckBig, X } from 'lucide-react';

interface InlineFeedbackNoticeProps {
  message: string;
  onDismiss?: () => void;
}

export const InlineFeedbackNotice = ({ message, onDismiss }: InlineFeedbackNoticeProps) => {
  return (
    <div
      className="flex items-start gap-3 rounded-[22px] border border-emerald-100 bg-emerald-50 px-4 py-3 text-emerald-900 shadow-sm"
      role="status"
      aria-live="polite"
    >
      <CircleCheckBig className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
      <p className="flex-1 text-[13px] font-medium leading-relaxed">{message}</p>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-full p-1 text-emerald-600 transition-colors hover:bg-emerald-100"
          aria-label="Dismiss notice"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
};
