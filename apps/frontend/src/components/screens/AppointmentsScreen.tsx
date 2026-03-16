'use client';

import { useSearchParams } from 'next/navigation';
import { InlineFeedbackNotice } from '@/components/ui/InlineFeedbackNotice';
import { AppointmentChatSheet } from '@/features/appointments/components/AppointmentChatSheet';
import { AppointmentDetailSheet } from '@/features/appointments/components/AppointmentDetailSheet';
import { AppointmentReviewSheet } from '@/features/appointments/components/AppointmentReviewSheet';
import { AppointmentsHeader } from '@/features/appointments/components/AppointmentsHeader';
import { AppointmentsList } from '@/features/appointments/components/AppointmentsList';
import { AppointmentsStatusFilters } from '@/features/appointments/components/AppointmentsStatusFilters';
import { AppointmentsTabs } from '@/features/appointments/components/AppointmentsTabs';
import { useAppointmentFlow } from '@/features/appointments/hooks/useAppointmentFlow';
import {
  getAppointmentStatusFilterOptions,
  isValidAppointmentStatusFilter,
  isValidAppointmentTab,
} from '@/features/appointments/lib/status';
import { APP_CONFIG } from '@/lib/config';

export const AppointmentsScreen = () => {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const statusParam = searchParams.get('status');
  const requestedTab = isValidAppointmentTab(tabParam) ? tabParam : 'active';
  const requestedStatus = isValidAppointmentStatusFilter(statusParam) ? statusParam : 'all';
  const {
    activeTab,
    canChatSelectedAppointment,
    chatInput,
    closeAppointment,
    closeChat,
    closeReview,
    filteredAppointments,
    isChatOpen,
    isReviewOpen,
    markPaid,
    notice,
    openChat,
    openReview,
    rating,
    reviewPhotoName,
    reviewText,
    searchQuery,
    setStatusFilter,
    selectAppointment,
    selectReviewPhoto,
    selectedAppointment,
    selectedChatSession,
    setActiveTab,
    setChatInput,
    setNotice,
    setRating,
    setReviewText,
    setSearchQuery,
    statusFilter,
    submitChatMessage,
    submitReview,
    tabAppointments,
  } = useAppointmentFlow({
    initialStatusFilter:
      requestedStatus !== 'all' && getAppointmentStatusFilterOptions(requestedTab).includes(requestedStatus)
        ? requestedStatus
        : 'all',
    initialTab: requestedTab,
  });

  return (
    <div
      className="relative flex h-full flex-col overflow-y-auto pb-24 custom-scrollbar"
      style={{ backgroundColor: APP_CONFIG.colors.bgLight }}
    >
      <AppointmentsHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <AppointmentsTabs activeTab={activeTab} onChange={setActiveTab} />
      <AppointmentsStatusFilters
        activeTab={activeTab}
        appointments={tabAppointments}
        statusFilter={statusFilter}
        onChange={setStatusFilter}
      />

      {notice ? (
        <div className="fixed left-1/2 top-16 z-[90] w-full max-w-md -translate-x-1/2 px-5">
          <InlineFeedbackNotice message={notice} onDismiss={() => setNotice(null)} />
        </div>
      ) : null}

      <AppointmentsList activeTab={activeTab} appointments={filteredAppointments} onSelect={selectAppointment} />

      {selectedAppointment ? (
        <AppointmentDetailSheet
          appointment={selectedAppointment}
          onClose={closeAppointment}
          onOpenChat={openChat}
          onOpenReview={openReview}
          onPayNow={markPaid}
        />
      ) : null}

      {selectedAppointment && canChatSelectedAppointment && isChatOpen && selectedChatSession ? (
        <AppointmentChatSheet
          appointment={selectedAppointment}
          chatInput={chatInput}
          chatSession={selectedChatSession}
          onChangeChatInput={setChatInput}
          onClose={closeChat}
          onSend={submitChatMessage}
        />
      ) : null}

      {selectedAppointment && isReviewOpen ? (
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
