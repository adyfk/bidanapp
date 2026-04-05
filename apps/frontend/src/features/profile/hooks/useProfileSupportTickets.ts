'use client';

import { useEffect, useState } from 'react';
import {
  createCustomerSupportTicketToApi,
  createProfessionalSupportTicketToApi,
  hydrateCustomerSupportTicketsFromApi,
  hydrateProfessionalSupportTicketsFromApi,
} from '@/lib/app-state-api';
import type {
  SupportCategoryId,
  SupportChannelId,
  SupportRole,
  SupportTicket,
  SupportTicketStatus,
  SupportUrgencyId,
} from '@/types/admin';

interface CreateProfileSupportTicketInput {
  categoryId: SupportCategoryId;
  contactValue: string;
  details: string;
  preferredChannel: SupportChannelId;
  referenceCode?: string;
  relatedAppointmentId?: string;
  relatedProfessionalId?: string;
  reporterName: string;
  reporterPhone: string;
  summary: string;
  urgency: SupportUrgencyId;
}

type RawSupportTicket = Partial<
  Omit<
    SupportTicket,
    'categoryId' | 'etaKey' | 'preferredChannel' | 'reporterRole' | 'sourceSurface' | 'status' | 'urgency'
  >
> & {
  categoryId?: string;
  etaKey?: string;
  preferredChannel?: string;
  reporterRole?: string;
  sourceSurface?: string;
  status?: string;
  urgency?: string;
};

const sortTickets = (tickets: SupportTicket[]) =>
  [...tickets].sort(
    (leftTicket, rightTicket) => new Date(rightTicket.createdAt).getTime() - new Date(leftTicket.createdAt).getTime(),
  );

const normalizeTicketStatus = (value: unknown): SupportTicketStatus =>
  value === 'new' || value === 'triaged' || value === 'reviewing' || value === 'resolved' || value === 'refunded'
    ? value
    : 'new';

const normalizeSupportTicket = (ticket: RawSupportTicket): SupportTicket => ({
  categoryId: (ticket.categoryId || 'other') as SupportCategoryId,
  contactValue: ticket.contactValue || '',
  createdAt: ticket.createdAt || new Date().toISOString(),
  details: ticket.details || '',
  etaKey: (ticket.etaKey || ticket.urgency || 'normal') as SupportUrgencyId,
  id: ticket.id || `support-ticket-${Date.now()}`,
  preferredChannel: (ticket.preferredChannel || 'whatsapp') as SupportChannelId,
  referenceCode: ticket.referenceCode || undefined,
  relatedAppointmentId: ticket.relatedAppointmentId || undefined,
  relatedProfessionalId: ticket.relatedProfessionalId || undefined,
  reporterId: ticket.reporterId || undefined,
  reporterName: ticket.reporterName || '',
  reporterPhone: ticket.reporterPhone || '',
  reporterRole: (ticket.reporterRole || 'customer') as SupportRole,
  sourceSurface:
    ticket.sourceSurface === 'admin_manual' ||
    ticket.sourceSurface === 'profile_customer' ||
    ticket.sourceSurface === 'profile_professional'
      ? ticket.sourceSurface
      : 'profile_customer',
  status: normalizeTicketStatus(ticket.status),
  summary: ticket.summary || '',
  updatedAt: ticket.updatedAt || ticket.createdAt || new Date().toISOString(),
  urgency: (ticket.urgency || 'normal') as SupportUrgencyId,
});

export const useProfileSupportTickets = (reporterRole: SupportRole, reporterId?: string) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    if (!reporterId) {
      setTickets([]);
      setHasLoaded(true);
      return () => {
        isCancelled = true;
      };
    }

    setTickets([]);
    setHasLoaded(false);

    const hydrate =
      reporterRole === 'customer' ? hydrateCustomerSupportTicketsFromApi : hydrateProfessionalSupportTicketsFromApi;

    void hydrate()
      .then((snapshot) => {
        if (isCancelled || !snapshot) {
          return;
        }

        const nextTickets = Array.isArray(snapshot.tickets) ? snapshot.tickets.map(normalizeSupportTicket) : [];
        setTickets(sortTickets(nextTickets));
      })
      .finally(() => {
        if (!isCancelled) {
          setHasLoaded(true);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [reporterId, reporterRole]);

  const submitSupportTicket = async (input: CreateProfileSupportTicketInput) => {
    if (!reporterId) {
      return null;
    }

    const createTicket =
      reporterRole === 'customer' ? createCustomerSupportTicketToApi : createProfessionalSupportTicketToApi;
    const sourceSurface = reporterRole === 'customer' ? 'profile_customer' : 'profile_professional';
    const nextTicket = await createTicket({
      categoryId: input.categoryId,
      contactValue: input.contactValue,
      details: input.details,
      preferredChannel: input.preferredChannel,
      referenceCode: input.referenceCode,
      relatedAppointmentId: input.relatedAppointmentId,
      relatedProfessionalId: input.relatedProfessionalId,
      reporterName: input.reporterName,
      reporterPhone: input.reporterPhone,
      sourceSurface,
      summary: input.summary,
      urgency: input.urgency,
    });

    if (!nextTicket) {
      return null;
    }

    const normalizedTicket = normalizeSupportTicket(nextTicket);
    setTickets((currentTickets) => sortTickets([normalizedTicket, ...currentTickets]));
    return normalizedTicket;
  };

  return {
    hasLoaded,
    submitSupportTicket,
    tickets,
  };
};
