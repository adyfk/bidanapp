'use client';

import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';

interface ProfileSheetShellProps {
  children: ReactNode;
  closeLabel?: string;
  description: string;
  onClose: () => void;
  title: string;
}

interface ProfileSheetNoticeProps {
  message: string;
  tone: 'error' | 'success';
}

interface ProfileSheetSectionProps {
  children: ReactNode;
  description?: string;
  icon: ReactNode;
  iconClassName: string;
  title: string;
}

interface ProfileSheetFieldProps {
  children: ReactNode;
  label: string;
}

interface ProfileSheetRuleRowProps {
  isComplete: boolean;
  label: string;
  pendingLabel?: string;
  readyLabel?: string;
}

const inputClassName =
  'w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-[14px] text-gray-800 transition-all focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100';

export const profileSheetInputClassName = inputClassName;

export const ProfileSheetShell = ({
  children,
  closeLabel = 'Close',
  description,
  onClose,
  title,
}: ProfileSheetShellProps) => (
  <div className="fixed inset-0 z-[80] flex items-end justify-center overflow-hidden">
    <button
      type="button"
      aria-label={closeLabel}
      className="absolute inset-0 bg-black/45 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    />

    <div className="relative z-10 flex max-h-[94vh] w-full max-w-md flex-col overflow-hidden rounded-t-[32px] bg-white shadow-2xl animate-in slide-in-from-bottom-full duration-300">
      <div className="mx-auto mb-2 mt-4 h-1.5 w-12 rounded-full bg-gray-200" />

      <div className="flex items-start gap-3 border-b border-gray-100 px-5 pb-4 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex-1">
          <h2 className="text-[20px] font-bold text-gray-900">{title}</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-gray-500">{description}</p>
        </div>
      </div>

      {children}
    </div>
  </div>
);

export const ProfileSheetNotice = ({ message, tone }: ProfileSheetNoticeProps) => (
  <div
    className={`rounded-[22px] border px-4 py-3 text-[13px] font-medium ${
      tone === 'success' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-red-100 bg-red-50 text-red-600'
    }`}
  >
    {message}
  </div>
);

export const ProfileSheetSection = ({
  children,
  description,
  icon,
  iconClassName,
  title,
}: ProfileSheetSectionProps) => (
  <section className="rounded-[26px] border border-gray-100 bg-white p-4 shadow-[0_18px_40px_-32px_rgba(17,24,39,0.38)]">
    <div className="mb-4 flex items-center gap-3">
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconClassName}`}>{icon}</div>
      <div>
        <h3 className="text-[15px] font-bold text-gray-900">{title}</h3>
        {description ? <p className="text-[12px] text-gray-500">{description}</p> : null}
      </div>
    </div>

    {children}
  </section>
);

export const ProfileSheetField = ({ children, label }: ProfileSheetFieldProps) => (
  <div className="block">
    <span className="mb-2 block text-[12px] font-semibold text-gray-500">{label}</span>
    {children}
  </div>
);

export const ProfileSheetRuleRow = ({ isComplete, label, pendingLabel, readyLabel }: ProfileSheetRuleRowProps) => (
  <div className="rounded-[18px] border border-gray-200 bg-gray-50 px-4 py-3">
    <div className="flex items-center justify-between gap-3">
      <p className="text-[13px] font-medium text-gray-700">{label}</p>
      {readyLabel && pendingLabel ? (
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
            isComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
          }`}
        >
          {isComplete ? readyLabel : pendingLabel}
        </span>
      ) : (
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            isComplete ? 'bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]' : 'bg-slate-300'
          }`}
        />
      )}
    </div>
  </div>
);
