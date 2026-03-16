import chatMessagesData from '@/data/mock-db/chat_messages.json';
import chatThreadsData from '@/data/mock-db/chat_threads.json';
import { getAppointmentRowById } from '@/lib/mock-db/appointment-records';
import { getProfessionalById } from '@/lib/mock-db/catalog';
import type { ChatMessage, ChatThread } from '@/types/chat';
import type { ChatMessageRow, ChatThreadRow } from '@/types/mock-db';
import { getRequiredItem, sortByIndex } from './utils';

const chatThreadRows = sortByIndex(chatThreadsData as ChatThreadRow[]);
const chatMessageRows = sortByIndex(chatMessagesData as ChatMessageRow[]);

const messagesByThreadId = chatMessageRows.reduce<Map<string, ChatMessage[]>>((accumulator, row) => {
  const threadMessages = accumulator.get(row.threadId) || [];

  threadMessages.push({
    id: row.sourceMessageId,
    text: row.text,
    sender: row.sender,
    time: row.timeLabel,
    isRead: row.isRead,
  });

  accumulator.set(row.threadId, threadMessages);
  return accumulator;
}, new Map());

const hydrateChatThread = (threadRow: ChatThreadRow): ChatThread => {
  const linkedAppointment = threadRow.appointmentId ? getAppointmentRowById(threadRow.appointmentId) : undefined;
  const linkedProfessionalId = linkedAppointment?.professionalId || threadRow.professionalId || '';
  const professionalSlug = linkedProfessionalId
    ? getRequiredItem(
        getProfessionalById(linkedProfessionalId),
        `chat_threads.${threadRow.id}.professionalId -> ${linkedProfessionalId}`,
      ).slug
    : '';

  if (threadRow.appointmentId) {
    getRequiredItem(linkedAppointment, `chat_threads.${threadRow.id}.appointmentId -> ${threadRow.appointmentId}`);
  }

  return {
    index: threadRow.index,
    id: threadRow.id,
    professionalSlug,
    appointmentId: threadRow.appointmentId || undefined,
    dayLabel: threadRow.dayLabel,
    inputPlaceholder: threadRow.inputPlaceholder,
    autoReplyText: threadRow.autoReplyText || undefined,
    messages: messagesByThreadId.get(threadRow.id) || [],
  };
};

const chatDirectThreads: ChatThread[] = chatThreadRows
  .filter((threadRow) => threadRow.threadType === 'direct')
  .map(hydrateChatThread);

const chatAppointmentThreads: ChatThread[] = chatThreadRows
  .filter((threadRow) => threadRow.threadType === 'appointment')
  .map(hydrateChatThread);

export const CHAT_THREADS: ChatThread[] = [...chatDirectThreads, ...chatAppointmentThreads];

const chatThreadsByProfessionalSlug = new Map(chatDirectThreads.map((thread) => [thread.professionalSlug, thread]));
const chatThreadsByAppointmentId = new Map(
  chatAppointmentThreads.map((thread) => [thread.appointmentId as string, thread]),
);

export const getChatThreadByProfessionalSlug = (professionalSlug: string) =>
  chatThreadsByProfessionalSlug.get(professionalSlug);

export const getAppointmentChatThread = (appointmentId: string) => chatThreadsByAppointmentId.get(appointmentId);
