'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ACTIVE_APPOINTMENT_STATUSES,
  type AppointmentStatusFilter,
  type AppointmentTab,
  getAppointmentStatusFilterOptions,
  HISTORY_APPOINTMENT_STATUSES,
  isAppointmentChatAvailable,
} from '@/features/appointments/lib/status';
import { getAppointmentChatThread } from '@/lib/mock-db/chat';
import { useUiText } from '@/lib/ui-text';
import { useProfessionalPortal } from '@/lib/use-professional-portal';
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

const formatMessageTime = () =>
  new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

const createFallbackChatSession = (
  appointment: Appointment,
  uiText: ReturnType<typeof useUiText>,
): AppointmentChatSession => ({
  dayLabel: uiText.appointmentChatDayLabel,
  inputPlaceholder: uiText.appointmentChatInputPlaceholder,
  autoReplyText: uiText.chatAutoReply,
  messages: [
    {
      id: getStableChatMessageId(`${appointment.id}:${appointment.service.name}`),
      text: uiText.getAppointmentWelcomeMessage(appointment.service.name),
      sender: 'professional',
      time: '10:41',
      isRead: true,
    },
  ],
});

const hasSameChatSessionReferences = (
  currentSessions: Record<string, AppointmentChatSession>,
  nextSessions: Record<string, AppointmentChatSession>,
) => {
  const currentAppointmentIds = Object.keys(currentSessions);
  const nextAppointmentIds = Object.keys(nextSessions);

  if (currentAppointmentIds.length !== nextAppointmentIds.length) {
    return false;
  }

  return nextAppointmentIds.every((appointmentId) => currentSessions[appointmentId] === nextSessions[appointmentId]);
};

const buildInitialChatState = (appointments: Appointment[], uiText: ReturnType<typeof useUiText>) =>
  Object.fromEntries(
    appointments.map((appointment) => {
      const existingThread = getAppointmentChatThread(appointment.id);

      return [
        appointment.id,
        existingThread
          ? {
              dayLabel: existingThread.dayLabel,
              inputPlaceholder: existingThread.inputPlaceholder,
              autoReplyText: existingThread.autoReplyText || uiText.chatAutoReply,
              messages: existingThread.messages,
            }
          : createFallbackChatSession(appointment, uiText),
      ] as const;
    }),
  ) as Record<string, AppointmentChatSession>;

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
  const { customerAppointments, markCustomerAppointmentPaid } = useProfessionalPortal();
  const [activeTab, setActiveTab] = useState<AppointmentTab>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatusFilter>(initialStatusFilter);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(initialSelectedAppointmentId);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewPhotoName, setReviewPhotoName] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [chatSessions, setChatSessions] = useState<Record<string, AppointmentChatSession>>({});
  const timeoutIdsRef = useRef<number[]>([]);

  useEffect(() => {
    const timeoutIds = timeoutIdsRef.current;

    return () => {
      timeoutIds.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
    };
  }, []);

  const appointments = useMemo(() => customerAppointments, [customerAppointments]);

  useEffect(() => {
    setChatSessions((currentSessions) => {
      const nextSessions = buildInitialChatState(appointments, uiText);

      for (const [appointmentId, session] of Object.entries(currentSessions)) {
        if (nextSessions[appointmentId]) {
          nextSessions[appointmentId] = session;
        }
      }

      if (hasSameChatSessionReferences(currentSessions, nextSessions)) {
        return currentSessions;
      }

      return nextSessions;
    });
  }, [appointments, uiText]);

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

  const selectedChatSession =
    selectedAppointment === null
      ? null
      : chatSessions[selectedAppointment.id] || createFallbackChatSession(selectedAppointment, uiText);
  const canChatSelectedAppointment = selectedAppointment
    ? isAppointmentChatAvailable(selectedAppointment.status)
    : false;

  const selectAppointment = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
    setIsChatOpen(false);
    setIsReviewOpen(false);
  };

  const closeAppointment = () => {
    setSelectedAppointmentId(null);
    setIsChatOpen(false);
    setIsReviewOpen(false);
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

  const markPaid = () => {
    if (!selectedAppointment) {
      return;
    }

    markCustomerAppointmentPaid(selectedAppointment.id);
    setNotice(uiText.paymentSuccessAlert);
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
      !selectedChatSession ||
      !chatInput.trim() ||
      !isAppointmentChatAvailable(selectedAppointment.status)
    ) {
      return;
    }

    const trimmedMessage = chatInput.trim();
    const sentMessage: ChatMessage = {
      id: Date.now(),
      text: trimmedMessage,
      sender: 'user',
      time: formatMessageTime(),
      isRead: false,
    };

    setChatSessions((current) => ({
      ...current,
      [selectedAppointment.id]: {
        ...selectedChatSession,
        messages: [...selectedChatSession.messages, sentMessage],
      },
    }));
    setChatInput('');
    setNotice(uiText.chatSentAlert);

    const timeoutId = window.setTimeout(() => {
      setChatSessions((current) => {
        const nextSession = current[selectedAppointment.id];

        if (!nextSession) {
          return current;
        }

        const replyMessage: ChatMessage = {
          id: Date.now() + 1,
          text: nextSession.autoReplyText,
          sender: 'professional',
          time: formatMessageTime(),
          isRead: true,
        };

        return {
          ...current,
          [selectedAppointment.id]: {
            ...nextSession,
            messages: [...nextSession.messages, replyMessage],
          },
        };
      });
    }, 900);

    timeoutIdsRef.current.push(timeoutId);
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
    searchedAppointments,
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
    setStatusFilter,
    submitChatMessage,
    submitReview,
    statusFilter,
    tabAppointments,
  };
};
