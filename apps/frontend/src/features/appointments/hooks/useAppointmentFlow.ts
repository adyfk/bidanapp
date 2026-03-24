'use client';

import { useEffect, useMemo, useState } from 'react';
import { getAppointmentClosePreview } from '@/features/appointments/lib/cancellation';
import {
  ACTIVE_APPOINTMENT_STATUSES,
  type AppointmentStatusFilter,
  type AppointmentTab,
  getAppointmentStatusFilterOptions,
  HISTORY_APPOINTMENT_STATUSES,
  isAppointmentChatAvailable,
} from '@/features/appointments/lib/status';
import { useUiText } from '@/lib/ui-text';
import { useAppShell } from '@/lib/use-app-shell';
import { useProfessionalPortal } from '@/lib/use-professional-portal';
import { useRealtimeChatThread } from '@/lib/use-realtime-chat-thread';
import type { Appointment } from '@/types/appointments';
import type { ChatMessage } from '@/types/chat';

export interface AppointmentChatSession {
  dayLabel: string;
  inputPlaceholder: string;
  autoReplyText: string;
  messages: ChatMessage[];
}

const getStableChatMessageId = (seed: string) =>
  Array.from(seed).reduce((hash, character) => (hash * 31 + character.charCodeAt(0)) % 1_000_000_000, 17);

const createFallbackChatSession = (
  appointment: Appointment,
  uiText: ReturnType<typeof useUiText>,
): AppointmentChatSession => ({
  dayLabel: uiText.appointmentChatDayLabel,
  inputPlaceholder: uiText.appointmentChatInputPlaceholder,
  autoReplyText: uiText.chatAutoReply,
  messages: [
    {
      id: String(getStableChatMessageId(`${appointment.id}:${appointment.service.name}`)),
      text: uiText.getAppointmentWelcomeMessage(appointment.service.name),
      sender: 'professional',
      time: '10:41',
      isRead: true,
    },
  ],
});

export const useAppointmentFlow = ({
  initialSelectedAppointmentId = null,
  initialStatusFilter = 'all',
  initialTab = 'active',
}: {
  initialSelectedAppointmentId?: string | null;
  initialStatusFilter?: AppointmentStatusFilter;
  initialTab?: AppointmentTab;
} = {}) => {
  const uiText = useUiText();
  const { currentConsumer } = useAppShell();
  const { cancelCustomerAppointment, customerAppointments, markCustomerAppointmentPaid } = useProfessionalPortal();
  const [activeTab, setActiveTab] = useState<AppointmentTab>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatusFilter>(initialStatusFilter);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(initialSelectedAppointmentId);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewPhotoName, setReviewPhotoName] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const appointments = useMemo(() => customerAppointments, [customerAppointments]);

  const searchedAppointments = appointments.filter((appointment) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return (
      appointment.professional.name.toLowerCase().includes(query) ||
      appointment.service.name.toLowerCase().includes(query)
    );
  });

  const tabAppointments = searchedAppointments.filter((appointment) => {
    const allowedStatuses = activeTab === 'active' ? ACTIVE_APPOINTMENT_STATUSES : HISTORY_APPOINTMENT_STATUSES;

    return allowedStatuses.includes(appointment.status);
  });

  useEffect(() => {
    const allowedStatuses = getAppointmentStatusFilterOptions(activeTab);

    if (statusFilter !== 'all' && !allowedStatuses.includes(statusFilter)) {
      setStatusFilter('all');
    }
  }, [activeTab, statusFilter]);

  const filteredAppointments = tabAppointments.filter((appointment) => {
    if (statusFilter === 'all') {
      return true;
    }

    return appointment.status === statusFilter;
  });

  const selectedAppointment =
    selectedAppointmentId === null
      ? null
      : appointments.find((appointment) => appointment.id === selectedAppointmentId) || null;

  const selectedChatSession = useMemo(
    () => (selectedAppointment === null ? null : createFallbackChatSession(selectedAppointment, uiText)),
    [selectedAppointment, uiText],
  );
  const canChatSelectedAppointment = selectedAppointment
    ? isAppointmentChatAvailable(selectedAppointment.status)
    : false;
  const { messages: realtimeMessages, sendMessage: sendRealtimeMessage } = useRealtimeChatThread({
    enabled: Boolean(selectedAppointment && canChatSelectedAppointment && isChatOpen),
    fallbackMessages: selectedChatSession?.messages ?? [],
    professionalName: selectedAppointment?.professional.name || '',
    senderName: currentConsumer.name,
    threadId: selectedAppointment?.id || null,
  });
  const activeChatSession =
    selectedChatSession === null
      ? null
      : {
          ...selectedChatSession,
          messages: realtimeMessages,
        };
  const cancelPreview = useMemo(
    () =>
      selectedAppointment
        ? getAppointmentClosePreview({
            actor: 'customer',
            policySnapshot: selectedAppointment.cancellationPolicySnapshot,
            scheduleSnapshot: selectedAppointment.scheduleSnapshot,
            status: selectedAppointment.status,
          })
        : null,
    [selectedAppointment],
  );

  const selectAppointment = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
    setIsChatOpen(false);
    setIsCancelOpen(false);
    setIsReviewOpen(false);
  };

  const closeAppointment = () => {
    setSelectedAppointmentId(null);
    setIsChatOpen(false);
    setIsCancelOpen(false);
    setIsReviewOpen(false);
    setCancelReason('');
    setChatInput('');
  };

  const closeChat = () => {
    setIsChatOpen(false);
    setChatInput('');
  };

  const openChat = () => {
    if (!selectedAppointment || !isAppointmentChatAvailable(selectedAppointment.status)) {
      setIsChatOpen(false);
      setChatInput('');
      setNotice(uiText.chatUnavailableAlert);
      return;
    }

    setIsChatOpen(true);
  };

  const openReview = () => {
    setIsReviewOpen(true);
  };

  const closeReview = () => {
    setIsReviewOpen(false);
  };

  const openCancel = () => {
    if (!selectedAppointment || !cancelPreview?.allowed) {
      return;
    }

    setIsCancelOpen(true);
  };

  const closeCancel = () => {
    setIsCancelOpen(false);
    setCancelReason('');
  };

  const markPaid = () => {
    if (!selectedAppointment) {
      return;
    }

    markCustomerAppointmentPaid(selectedAppointment.id);
    setNotice(uiText.paymentSuccessAlert);
  };

  const submitCancel = () => {
    if (!selectedAppointment || !cancelPreview?.allowed || !cancelReason.trim()) {
      return;
    }

    const result = cancelCustomerAppointment(selectedAppointment.id, cancelReason);

    if (!result.ok) {
      return;
    }

    setNotice(uiText.getAppointmentCancellationNotice(cancelPreview.financialOutcome || 'none'));
    closeCancel();
  };

  const selectReviewPhoto = (fileName: string | null) => {
    setReviewPhotoName(fileName);

    if (fileName) {
      setNotice(uiText.getReviewPhotoReadyNotice(fileName));
    }
  };

  const submitChatMessage = () => {
    if (
      !selectedAppointment ||
      !activeChatSession ||
      !chatInput.trim() ||
      !isAppointmentChatAvailable(selectedAppointment.status)
    ) {
      return;
    }

    if (!sendRealtimeMessage(chatInput)) {
      setNotice(uiText.chatUnavailableAlert);
      return;
    }

    setChatInput('');
    setNotice(uiText.chatSentAlert);
  };

  useEffect(() => {
    if (!selectedAppointment || isAppointmentChatAvailable(selectedAppointment.status)) {
      return;
    }

    setIsChatOpen(false);
    setChatInput('');
  }, [selectedAppointment]);

  const submitReview = () => {
    if (!selectedAppointment || rating === 0) {
      return;
    }

    setNotice(uiText.getReviewSuccessNotice(reviewPhotoName));
    setIsReviewOpen(false);
    setReviewText('');
    setRating(0);
    setReviewPhotoName(null);
  };

  return {
    activeTab,
    canChatSelectedAppointment,
    chatInput,
    closeAppointment,
    closeCancel,
    closeChat,
    closeReview,
    filteredAppointments,
    cancelPreview,
    cancelReason,
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
    searchQuery,
    searchedAppointments,
    selectAppointment,
    selectReviewPhoto,
    selectedAppointment,
    selectedChatSession: activeChatSession,
    setActiveTab,
    setCancelReason,
    setChatInput,
    setNotice,
    setRating,
    setReviewText,
    setSearchQuery,
    setStatusFilter,
    submitChatMessage,
    submitReview,
    statusFilter,
    submitCancel,
    tabAppointments,
  };
};
