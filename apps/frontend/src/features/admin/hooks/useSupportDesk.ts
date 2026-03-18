'use client';

import { useEffect, useState } from 'react';
import {
  buildDefaultSupportDeskSnapshot,
  DEFAULT_COMMAND_CENTER_STATE,
  DEFAULT_SUPPORT_TICKETS,
  MOCK_ADMIN_STAFF,
  SUPPORT_DESK_SCHEMA_VERSION,
} from '@/lib/mock-db/admin';
import type {
  AdminCommandCenterState,
  SupportCategoryId,
  SupportChannelId,
  SupportDeskSnapshot,
  SupportRole,
  SupportTicket,
  SupportTicketStatus,
  SupportUrgencyId,
} from '@/types/admin';

const supportDeskStorageKey = 'bidanapp:support-desk';
const supportDeskEventName = 'bidanapp:support-desk-change';

interface CreateSupportTicketInput {
  categoryId: SupportCategoryId;
  contactValue: string;
  details: string;
  preferredChannel: SupportChannelId;
  referenceCode?: string;
  relatedAppointmentId?: string;
  relatedProfessionalId?: string;
  reporterName: string;
  reporterPhone: string;
  reporterRole: SupportRole;
  sourceSurface: SupportTicket['sourceSurface'];
  summary: string;
  urgency: SupportUrgencyId;
}

const sortTickets = (tickets: SupportTicket[]) =>
  [...tickets].sort(
    (leftTicket, rightTicket) => new Date(rightTicket.createdAt).getTime() - new Date(leftTicket.createdAt).getTime(),
  );

const normalizeTicketStatus = (value: unknown): SupportTicketStatus =>
  value === 'new' || value === 'triaged' || value === 'reviewing' || value === 'resolved' || value === 'refunded'
    ? value
    : 'new';

const normalizeSupportDeskSnapshot = (value: unknown): SupportDeskSnapshot => {
  const defaultSnapshot = buildDefaultSupportDeskSnapshot();

  if (!value || typeof value !== 'object') {
    return defaultSnapshot;
  }

  const rawSnapshot = value as Partial<SupportDeskSnapshot>;

  if (rawSnapshot.schemaVersion !== SUPPORT_DESK_SCHEMA_VERSION || !Array.isArray(rawSnapshot.tickets)) {
    return defaultSnapshot;
  }

  return {
    commandCenter: {
      activeAdminId: rawSnapshot.commandCenter?.activeAdminId || DEFAULT_COMMAND_CENTER_STATE.activeAdminId,
      commandNote: rawSnapshot.commandCenter?.commandNote?.trim() || DEFAULT_COMMAND_CENTER_STATE.commandNote,
      focusArea: rawSnapshot.commandCenter?.focusArea || DEFAULT_COMMAND_CENTER_STATE.focusArea,
      highlightedProfessionalId:
        rawSnapshot.commandCenter?.highlightedProfessionalId || DEFAULT_COMMAND_CENTER_STATE.highlightedProfessionalId,
      incidentMode: rawSnapshot.commandCenter?.incidentMode || DEFAULT_COMMAND_CENTER_STATE.incidentMode,
      runtimeNarrative:
        rawSnapshot.commandCenter?.runtimeNarrative?.trim() || DEFAULT_COMMAND_CENTER_STATE.runtimeNarrative,
      watchAreaId: rawSnapshot.commandCenter?.watchAreaId || DEFAULT_COMMAND_CENTER_STATE.watchAreaId,
    },
    savedAt: rawSnapshot.savedAt || defaultSnapshot.savedAt,
    schemaVersion: SUPPORT_DESK_SCHEMA_VERSION,
    tickets: sortTickets(
      rawSnapshot.tickets.map((ticket) => ({
        assignedAdminId: ticket.assignedAdminId || undefined,
        categoryId: ticket.categoryId,
        contactValue: ticket.contactValue,
        createdAt: ticket.createdAt,
        details: ticket.details,
        etaKey: ticket.etaKey,
        id: ticket.id,
        preferredChannel: ticket.preferredChannel,
        referenceCode: ticket.referenceCode || undefined,
        relatedAppointmentId: ticket.relatedAppointmentId || undefined,
        relatedProfessionalId: ticket.relatedProfessionalId || undefined,
        reporterName: ticket.reporterName,
        reporterPhone: ticket.reporterPhone,
        reporterRole: ticket.reporterRole,
        sourceSurface: ticket.sourceSurface,
        status: normalizeTicketStatus(ticket.status),
        summary: ticket.summary,
        updatedAt: ticket.updatedAt,
        urgency: ticket.urgency,
      })),
    ),
  };
};

const readSupportDeskSnapshot = (): SupportDeskSnapshot => {
  if (typeof window === 'undefined') {
    return buildDefaultSupportDeskSnapshot();
  }

  try {
    const storedValue = window.localStorage.getItem(supportDeskStorageKey);

    if (!storedValue) {
      return buildDefaultSupportDeskSnapshot();
    }

    return normalizeSupportDeskSnapshot(JSON.parse(storedValue));
  } catch {
    return buildDefaultSupportDeskSnapshot();
  }
};

const persistSupportDeskSnapshot = (snapshot: SupportDeskSnapshot) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(supportDeskStorageKey, JSON.stringify(snapshot));
  window.dispatchEvent(new Event(supportDeskEventName));
};

const buildNextSnapshot = (
  currentSnapshot: SupportDeskSnapshot,
  updater: (snapshot: SupportDeskSnapshot) => SupportDeskSnapshot,
) => {
  const nextSnapshot = updater(currentSnapshot);

  return {
    ...nextSnapshot,
    savedAt: new Date().toISOString(),
  };
};

export const useSupportDesk = () => {
  const [snapshot, setSnapshot] = useState<SupportDeskSnapshot>(() => readSupportDeskSnapshot());

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncSnapshot = () => setSnapshot(readSupportDeskSnapshot());

    syncSnapshot();
    window.addEventListener('storage', syncSnapshot);
    window.addEventListener(supportDeskEventName, syncSnapshot);

    return () => {
      window.removeEventListener('storage', syncSnapshot);
      window.removeEventListener(supportDeskEventName, syncSnapshot);
    };
  }, []);

  const updateSnapshot = (updater: (currentSnapshot: SupportDeskSnapshot) => SupportDeskSnapshot) => {
    setSnapshot((currentSnapshot) => {
      const nextSnapshot = buildNextSnapshot(currentSnapshot, updater);
      persistSupportDeskSnapshot(nextSnapshot);
      return nextSnapshot;
    });
  };

  const submitSupportTicket = ({
    categoryId,
    contactValue,
    details,
    preferredChannel,
    referenceCode,
    relatedAppointmentId,
    relatedProfessionalId,
    reporterName,
    reporterPhone,
    reporterRole,
    sourceSurface,
    summary,
    urgency,
  }: CreateSupportTicketInput) => {
    const now = new Date().toISOString();
    const ticketId = `${reporterRole === 'customer' ? 'ADM-CUS' : 'ADM-PRO'}-${String(Date.now()).slice(-4)}`;
    const nextTicket: SupportTicket = {
      categoryId,
      contactValue,
      createdAt: now,
      details,
      etaKey: urgency,
      id: ticketId,
      preferredChannel,
      referenceCode: referenceCode?.trim() || undefined,
      relatedAppointmentId: relatedAppointmentId?.trim() || undefined,
      relatedProfessionalId: relatedProfessionalId?.trim() || undefined,
      reporterName,
      reporterPhone,
      reporterRole,
      sourceSurface,
      status: 'new',
      summary,
      updatedAt: now,
      urgency,
    };

    updateSnapshot((currentSnapshot) => ({
      ...currentSnapshot,
      tickets: sortTickets([nextTicket, ...currentSnapshot.tickets]),
    }));

    return nextTicket;
  };

  const updateSupportTicket = (
    ticketId: string,
    changes: Partial<Pick<SupportTicket, 'assignedAdminId' | 'etaKey' | 'status' | 'summary' | 'urgency'>>,
  ) => {
    updateSnapshot((currentSnapshot) => ({
      ...currentSnapshot,
      tickets: sortTickets(
        currentSnapshot.tickets.map((ticket) =>
          ticket.id === ticketId
            ? {
                ...ticket,
                ...changes,
                updatedAt: new Date().toISOString(),
              }
            : ticket,
        ),
      ),
    }));
  };

  const updateCommandCenter = (changes: Partial<AdminCommandCenterState>) => {
    updateSnapshot((currentSnapshot) => ({
      ...currentSnapshot,
      commandCenter: {
        ...currentSnapshot.commandCenter,
        ...changes,
      },
    }));
  };

  return {
    adminStaff: MOCK_ADMIN_STAFF,
    commandCenter: snapshot.commandCenter,
    customerTickets: snapshot.tickets.filter((ticket) => ticket.reporterRole === 'customer'),
    defaultCommandCenter: DEFAULT_COMMAND_CENTER_STATE,
    defaultTickets: DEFAULT_SUPPORT_TICKETS,
    professionalTickets: snapshot.tickets.filter((ticket) => ticket.reporterRole === 'professional'),
    submitSupportTicket,
    tickets: snapshot.tickets,
    updateCommandCenter,
    updateSupportTicket,
  };
};
