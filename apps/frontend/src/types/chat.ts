export type ChatSender = 'user' | 'professional';

export interface ChatMessage {
  id: number;
  text: string;
  sender: ChatSender;
  time: string;
  isRead: boolean;
}

export interface ChatThread {
  index: number;
  id: string;
  professionalSlug: string;
  appointmentId?: string;
  dayLabel: string;
  inputPlaceholder: string;
  autoReplyText?: string;
  messages: ChatMessage[];
}

export interface ChatSimulationFile {
  directThreads: ChatThread[];
  appointmentThreads: ChatThread[];
}
