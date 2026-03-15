import chatData from '@/data/simulation/chat.json';
import type { ChatSimulationFile, ChatThread } from '@/types/chat';

const data = chatData as ChatSimulationFile;
const sortByIndex = <T extends { index: number }>(items: T[]) =>
  [...items].sort((left, right) => left.index - right.index);

export const SIMULATION_DIRECT_CHAT_THREADS: ChatThread[] = sortByIndex(data.directThreads);
export const SIMULATION_APPOINTMENT_CHAT_THREADS: ChatThread[] = sortByIndex(data.appointmentThreads);
export const SIMULATION_CHAT_THREADS: ChatThread[] = [
  ...SIMULATION_DIRECT_CHAT_THREADS,
  ...SIMULATION_APPOINTMENT_CHAT_THREADS,
];

const chatThreadsByProfessionalSlug = new Map(
  SIMULATION_DIRECT_CHAT_THREADS.map((thread) => [thread.professionalSlug, thread]),
);
const chatThreadsByAppointmentId = new Map(
  SIMULATION_APPOINTMENT_CHAT_THREADS.map((thread) => [thread.appointmentId as string, thread]),
);

export const getChatThreadByProfessionalSlug = (professionalSlug: string) =>
  chatThreadsByProfessionalSlug.get(professionalSlug);
export const getAppointmentChatThread = (appointmentId: string) => chatThreadsByAppointmentId.get(appointmentId);
