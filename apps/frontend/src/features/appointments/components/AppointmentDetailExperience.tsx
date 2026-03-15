'use client';

import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { APP_CONFIG } from '@/lib/config';
import { SIMULATION_MESSAGES } from '@/lib/constants';
import { AppointmentChatSheet } from '@/features/appointments/components/AppointmentChatSheet';
import { AppointmentDetailSheet } from '@/features/appointments/components/AppointmentDetailSheet';
import { AppointmentReviewSheet } from '@/features/appointments/components/AppointmentReviewSheet';
import { useAppointmentFlow } from '@/features/appointments/hooks/useAppointmentFlow';
import { InlineFeedbackNotice } from '@/components/ui/InlineFeedbackNotice';

interface AppointmentDetailExperienceProps {
  appointmentId: string;
  onBack: () => void;
}

export const AppointmentDetailExperience = ({
  appointmentId,
  onBack,
}: AppointmentDetailExperienceProps) => {
  const {
    chatInput,
    closeChat,
    closeReview,
    isChatOpen,
    isReviewOpen,
    markPaid,
    notice,
    openChat,
    openReview,
    rating,
    reviewPhotoName,
    reviewText,
    selectedAppointment,
    selectedChatSession,
    setChatInput,
    setNotice,
    setRating,
    setReviewText,
    submitChatMessage,
    submitReview,
    selectReviewPhoto,
  } = useAppointmentFlow(appointmentId);

  if (!selectedAppointment) {
    return (
      <div
        className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-gray-50"
        style={{ backgroundColor: APP_CONFIG.colors.bgLight }}
      >
        <div className="absolute top-0 z-10 flex w-full items-center border-b border-gray-100 bg-white px-4 py-4">
          <button onClick={onBack} className="mr-2 -ml-2 rounded-full p-2 hover:bg-gray-100">
            <ChevronLeft className="h-6 w-6 text-gray-800" />
          </button>
          <h2 className="text-[17px] font-bold text-gray-900">{SIMULATION_MESSAGES.appointmentDetailTitle}</h2>
        </div>
        <p className="mt-20 text-gray-500">{SIMULATION_MESSAGES.appointmentNotFoundMessage}</p>
        <button onClick={onBack} className="mt-4 rounded-full bg-gray-200 px-6 py-2 font-medium">
          {SIMULATION_MESSAGES.appointmentBackLabel}
        </button>
      </div>
    );
  }

  return (
    <div
      className="relative flex h-full flex-col overflow-y-auto custom-scrollbar"
      style={{ backgroundColor: APP_CONFIG.colors.bgLight }}
    >
      {notice ? (
        <div className="fixed left-1/2 top-16 z-[90] w-full max-w-md -translate-x-1/2 px-5">
          <InlineFeedbackNotice message={notice} onDismiss={() => setNotice(null)} />
        </div>
      ) : null}

      <AppointmentDetailSheet
        appointment={selectedAppointment}
        onClose={onBack}
        onOpenChat={openChat}
        onOpenReview={openReview}
        onPayNow={markPaid}
      />

      {isChatOpen && selectedChatSession ? (
        <AppointmentChatSheet
          appointment={selectedAppointment}
          chatInput={chatInput}
          chatSession={selectedChatSession}
          onChangeChatInput={setChatInput}
          onClose={closeChat}
          onSend={submitChatMessage}
        />
      ) : null}

      {isReviewOpen ? (
        <AppointmentReviewSheet
          appointment={selectedAppointment}
          onClose={closeReview}
          onReviewPhotoChange={selectReviewPhoto}
          onSubmit={submitReview}
          onUpdateRating={setRating}
          onUpdateReviewText={setReviewText}
          rating={rating}
          reviewPhotoName={reviewPhotoName}
          reviewText={reviewText}
        />
      ) : null}
    </div>
  );
};
