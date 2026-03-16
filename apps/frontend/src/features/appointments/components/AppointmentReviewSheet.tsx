'use client';

import { Camera, ChevronLeft, Star } from 'lucide-react';
import Image from 'next/image';
import { useId } from 'react';
import { APP_CONFIG } from '@/lib/config';
import { useUiText } from '@/lib/ui-text';
import type { Appointment } from '@/types/appointments';

interface AppointmentReviewSheetProps {
  appointment: Appointment;
  onClose: () => void;
  onReviewPhotoChange: (fileName: string | null) => void;
  onSubmit: () => void;
  onUpdateRating: (value: number) => void;
  onUpdateReviewText: (value: string) => void;
  rating: number;
  reviewPhotoName: string | null;
  reviewText: string;
}

export const AppointmentReviewSheet = ({
  appointment,
  onClose,
  onReviewPhotoChange,
  onSubmit,
  onUpdateRating,
  onUpdateReviewText,
  rating,
  reviewPhotoName,
  reviewText,
}: AppointmentReviewSheetProps) => {
  const inputId = useId();
  const reviewTextId = useId();
  const uiText = useUiText();

  return (
    <div className="fixed inset-y-0 left-1/2 z-[70] flex w-full max-w-md -translate-x-1/2 flex-col bg-white animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="sticky top-0 z-10 flex items-center border-b border-gray-100 bg-white p-4">
        <button type="button" onClick={onClose} className="mr-2 -ml-2 rounded-full p-2 hover:bg-gray-100">
          <ChevronLeft className="h-6 w-6 text-gray-800" />
        </button>
        <h2 className="text-[17px] font-bold text-gray-900">{uiText.review.title}</h2>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto p-5">
        <div className="mb-8 mt-4 flex flex-col items-center">
          <div className="relative mb-4 h-20 w-20 overflow-hidden rounded-full border border-gray-100 shadow-sm">
            <Image
              src={appointment.professional.image}
              alt={appointment.professional.name}
              fill
              className="object-cover"
            />
          </div>
          <h3 className="text-center text-[18px] font-bold leading-snug text-gray-900">
            {uiText.review.getTitleForProfessional(appointment.professional.name)}
          </h3>
          <p className="mt-1 px-4 text-center text-[13px] text-gray-500">{uiText.review.helperText}</p>
        </div>

        <div className="mb-8 flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onUpdateRating(star)}
              className="p-1 transition-transform active:scale-95"
            >
              <Star className={`h-10 w-10 ${rating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
            </button>
          ))}
        </div>

        <div className="mb-6">
          <label htmlFor={inputId} className="mb-2 block text-[13px] font-bold text-gray-700">
            {uiText.review.photoLabel}
          </label>
          <label
            htmlFor={inputId}
            className="flex h-[100px] w-[120px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 transition-colors hover:border-gray-300 hover:bg-gray-50"
          >
            <Camera className="mb-2 h-6 w-6" />
            <span className="text-[11px] font-medium">{reviewPhotoName || uiText.review.photoButtonLabel}</span>
          </label>
          <input
            id={inputId}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => onReviewPhotoChange(event.target.files?.[0]?.name || null)}
          />
        </div>

        <div className="mb-6">
          <label htmlFor={reviewTextId} className="mb-2 block text-[13px] font-bold text-gray-700">
            {uiText.review.reviewLabel}
          </label>
          <textarea
            id={reviewTextId}
            value={reviewText}
            onChange={(event) => onUpdateReviewText(event.target.value)}
            placeholder={uiText.review.reviewPlaceholder}
            className="h-32 w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 p-4 text-[14px] text-gray-800 transition-all focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100"
          />
        </div>
      </div>

      <div className="border-t border-gray-100 bg-white p-5 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
        <button
          type="button"
          disabled={rating === 0}
          onClick={onSubmit}
          className={`w-full rounded-[16px] py-4 text-[15px] font-bold transition-all ${
            rating > 0
              ? 'text-white shadow-[0_8px_20px_rgba(123,97,255,0.3)] active:scale-[0.98]'
              : 'bg-gray-100 text-gray-400'
          }`}
          style={{ backgroundColor: rating > 0 ? APP_CONFIG.colors.primary : undefined }}
        >
          {uiText.review.submitLabel}
        </button>
      </div>
    </div>
  );
};
