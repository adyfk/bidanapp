'use client';

import { ChevronLeft } from 'lucide-react';
import { InlineFeedbackNotice } from '@/components/ui/InlineFeedbackNotice';
import { AppointmentCancelSheet } from '@/features/appointments/components/AppointmentCancelSheet';
import { AppointmentChatSheet } from '@/features/appointments/components/AppointmentChatSheet';
import { AppointmentDetailSheet } from '@/features/appointments/components/AppointmentDetailSheet';
import { AppointmentReviewSheet } from '@/features/appointments/components/AppointmentReviewSheet';
import { useAppointmentFlow } from '@/features/appointments/hooks/useAppointmentFlow';
import { useRouter } from '@/i18n/routing';
import { APP_CONFIG } from '@/lib/config';
import { professionalRoute } from '@/lib/routes';
import { useUiText } from '@/lib/ui-text';

interface AppointmentDetailExperienceProps {
  appointmentId: string;
  onBack: () => void;
}

export const AppointmentDetailExperience = ({ appointmentId, onBack }: AppointmentDetailExperienceProps) => {
  const router = useRouter();
  const uiText = useUiText();
  const {
    cancelPreview,
    cancelReason,
    canChatSelectedAppointment,
    closeCancel,
    chatInput,
    closeChat,
    closeReview,
    isCancelOpen,
    isChatOpen,
    isReviewOpen,
    markPaid,
    notice,
    openCancel,
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
    setCancelReason,
    submitChatMessage,
    submitCancel,
    submitReview,
    selectReviewPhoto,
  } = useAppointmentFlow({ initialSelectedAppointmentId: appointmentId });

  if (!selectedAppointment) {
    return (
      <div
        className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-gray-50"
        style={{ backgroundColor: APP_CONFIG.colors.bgLight }}
      >
        <div className="absolute top-0 z-10 flex w-full items-center border-b border-gray-100 bg-white px-4 py-4">
          <button type="button" onClick={onBack} className="mr-2 -ml-2 rounded-full p-2 hover:bg-gray-100">
            <ChevronLeft className="h-6 w-6 text-gray-800" />
          </button>
          <h2 className="text-[17px] font-bold text-gray-900">{uiText.appointmentDetailTitle}</h2>
        </div>
        <p className="mt-20 text-gray-500">{uiText.appointmentNotFoundMessage}</p>
        <button type="button" onClick={onBack} className="mt-4 rounded-full bg-gray-200 px-6 py-2 font-medium">
          {uiText.appointmentBackLabel}
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
        onBookAgain={() => {
          router.push(
            professionalRoute(selectedAppointment.professional.slug, {
              mode: selectedAppointment.requestedMode,
              serviceId: selectedAppointment.service.serviceId,
            }),
          );
        }}
        onOpenCancel={openCancel}
        onOpenChat={openChat}
        onOpenReview={openReview}
        onPayNow={markPaid}
      />

      {isCancelOpen && cancelPreview ? (
        <AppointmentCancelSheet
          appointment={selectedAppointment}
          cancelPreview={cancelPreview}
          cancelReason={cancelReason}
          onCancelReasonChange={setCancelReason}
          onClose={closeCancel}
          onSubmit={submitCancel}
        />
      ) : null}

      {canChatSelectedAppointment && isChatOpen && selectedChatSession ? (
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
