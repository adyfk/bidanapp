import {
  type CreateSupportTicketInput,
  createViewerSupportTicket,
  fetchAdminSupportTickets,
  fetchViewerSupportTicket,
  fetchViewerSupportTickets,
  type SupportTicket,
  type TriageSupportTicketInput,
  triageAdminSupportTicket,
} from '@marketplace/sdk';
import { formatDateTime, supportStatusLabel } from './formatters';

export interface SupportFlowController {
  createTicket: typeof createViewerSupportTicket;
  fetchTicket: typeof fetchViewerSupportTicket;
  fetchTickets: typeof fetchViewerSupportTickets;
  triageTicket: typeof triageAdminSupportTicket;
}

export interface SupportTicketVM {
  createdAtLabel: string;
  id: string;
  priority: string;
  statusLabel: string;
  title: string;
}

export function mapSupportTicketToVM(ticket: SupportTicket, locale: string): SupportTicketVM {
  return {
    createdAtLabel: formatDateTime(ticket.createdAt, locale),
    id: ticket.id,
    priority: ticket.priority,
    statusLabel: supportStatusLabel(ticket.status, locale),
    title: ticket.subject,
  };
}

export function createSupportFlowController(): SupportFlowController {
  return {
    createTicket: createViewerSupportTicket,
    fetchTicket: fetchViewerSupportTicket,
    fetchTickets: fetchViewerSupportTickets,
    triageTicket: triageAdminSupportTicket,
  };
}

export type { CreateSupportTicketInput, SupportTicket, TriageSupportTicketInput };
export {
  createViewerSupportTicket,
  fetchAdminSupportTickets,
  fetchViewerSupportTicket,
  fetchViewerSupportTickets,
  triageAdminSupportTicket,
};
