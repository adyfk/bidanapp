'use client';

import { AlertTriangle, ChevronLeft } from 'lucide-react';
import type { AppointmentClosePreview } from '@/features/appointments/lib/cancellation';
import { APP_CONFIG } from '@/lib/config';
import { useUiText } from '@/lib/ui-text';
import type { Appointment } from '@/types/appointments';

interface AppointmentCancelSheetProps {
  appointment: Appointment;
  cancelPreview: AppointmentClosePreview;
  cancelReason: string;
  onCancelReasonChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export const AppointmentCancelSheet = ({
  appointment,
  cancelPreview,
  cancelReason,
  onCancelReasonChange,
  onClose,
  onSubmit,
}: AppointmentCancelSheetProps) => {
  const uiText = useUiText();
  const outcome = cancelPreview.financialOutcome || 'none';
  const customerPolicyLabel =
    cancelPreview.cutoffHours === null
      ? uiText.appointmentCancellation.customerNoPaymentPolicy
      : uiText.appointmentCancellation.getCutoffPolicyLabel(cancelPreview.cutoffHours);

  return (
    <div className="fixed inset-y-0 left-1/2 z-[70] flex w-full max-w-md -translate-x-1/2 flex-col bg-white animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="sticky top-0 z-10 flex items-center border-b border-gray-100 bg-white p-4">
        <button type="button" onClick={onClose} className="mr-2 -ml-2 rounded-full p-2 hover:bg-gray-100">
          <ChevronLeft className="h-6 w-6 text-gray-800" />
        </button>
        <h2 className="text-[17px] font-bold text-gray-900">{uiText.appointmentCancellation.title}</h2>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto p-5">
        <div className="rounded-[24px] border border-amber-100 bg-[linear-gradient(180deg,#FFF8EB_0%,#FFFFFF_100%)] p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-amber-100 p-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[15px] font-bold text-gray-900">{appointment.service.name}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-gray-600">
                {uiText.appointmentCancellation.description}
              </p>
              <p className="mt-2 text-[12px] font-semibold text-amber-700">{appointment.time}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-[24px] border border-gray-100 bg-white p-4 shadow-[0_18px_36px_-32px_rgba(17,24,39,0.25)]">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
            {uiText.appointmentCancellation.outcomeTitle}
          </p>
          <p className="mt-2 text-[17px] font-bold text-gray-900">
            {uiText.appointmentCancellation.getOutcomeLabel(outcome)}
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-gray-500">
            {uiText.appointmentCancellation.getOutcomeDescription(outcome)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {cancelPreview.cutoffHours !== null ? (
              <span className="rounded-full bg-pink-50 px-3 py-1.5 text-[11px] font-semibold text-pink-600">
                {uiText.appointmentCancellation.getCutoffWindowLabel(cancelPreview.cutoffHours)}
              </span>
            ) : null}
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-600">
              {uiText.appointmentCancellation.getTimingLabel(cancelPreview.isBeforeCutoff, cancelPreview.cutoffHours)}
            </span>
          </div>
        </div>

        <div className="mt-5 rounded-[24px] border border-gray-100 bg-white p-4 shadow-[0_18px_36px_-32px_rgba(17,24,39,0.25)]">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
            {uiText.appointmentCancellation.policyTitle}
          </p>
          <div className="mt-3 space-y-2 text-[13px] leading-relaxed text-gray-600">
            <p>{customerPolicyLabel}</p>
            <p>{uiText.appointmentCancellation.professionalPolicy}</p>
          </div>
        </div>

        <div className="mt-5">
          <label htmlFor="appointment-cancel-reason" className="mb-2 block text-[13px] font-bold text-gray-700">
            {uiText.appointmentCancellation.reasonLabel}
          </label>
          <textarea
            id="appointment-cancel-reason"
            value={cancelReason}
            onChange={(event) => onCancelReasonChange(event.target.value)}
            placeholder={uiText.appointmentCancellation.reasonPlaceholder}
            className="h-32 w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 p-4 text-[14px] text-gray-800 transition-all focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100"
          />
        </div>
      </div>

      <div className="border-t border-gray-100 bg-white p-5 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-[16px] bg-gray-100 py-4 text-[14px] font-bold text-gray-700 transition-colors hover:bg-gray-200"
          >
            {uiText.appointmentCancellation.keepLabel}
          </button>
          <button
            type="button"
            disabled={!cancelReason.trim()}
            onClick={onSubmit}
            className="flex-1 rounded-[16px] py-4 text-[14px] font-bold text-white transition-all disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
            style={{ backgroundColor: cancelReason.trim() ? APP_CONFIG.colors.primary : undefined }}
          >
            {uiText.appointmentCancellation.submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
