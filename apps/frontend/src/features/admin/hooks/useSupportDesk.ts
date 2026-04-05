'use client';

import { useEffect, useRef, useState } from 'react';
import { hydrateSupportDeskFromApi, syncSupportDeskToApi } from '@/lib/app-state-api';
import { useAdminDirectory } from '@/lib/use-admin-directory';
import type {
  AdminCommandCenterState,
  AdminStaffMember,
  SupportCategoryId,
  SupportChannelId,
  SupportDeskSnapshot,
  SupportRole,
  SupportTicket,
  SupportTicketStatus,
  SupportUrgencyId,
} from '@/types/admin';

const supportDeskEventName = 'bidanapp:support-desk-change';
const SUPPORT_DESK_SCHEMA_VERSION = 1;
let cachedSupportDeskSnapshot: SupportDeskSnapshot | null = null;

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

const buildDefaultCommandCenterState = (adminStaff: AdminStaffMember[] = []): AdminCommandCenterState => ({
  activeAdminId: adminStaff[0]?.id || '',
  commandNote: '',
  focusArea: 'support',
  highlightedProfessionalId: '',
  incidentMode: 'monitoring',
  runtimeNarrative: '',
  watchAreaId: '',
});

const buildDefaultSupportDeskSnapshot = (adminStaff: AdminStaffMember[] = []): SupportDeskSnapshot => ({
  commandCenter: buildDefaultCommandCenterState(adminStaff),
  savedAt: new Date().toISOString(),
  schemaVersion: SUPPORT_DESK_SCHEMA_VERSION,
  tickets: [],
});

const normalizeSupportDeskSnapshot = (value: unknown, adminStaff: AdminStaffMember[] = []): SupportDeskSnapshot => {
  const defaultSnapshot = buildDefaultSupportDeskSnapshot(adminStaff);

  if (!value || typeof value !== 'object') {
    return defaultSnapshot;
  }

  const rawSnapshot = value as Partial<SupportDeskSnapshot>;

  if (rawSnapshot.schemaVersion !== SUPPORT_DESK_SCHEMA_VERSION || !Array.isArray(rawSnapshot.tickets)) {
    return defaultSnapshot;
  }

  return {
    commandCenter: {
      activeAdminId: rawSnapshot.commandCenter?.activeAdminId || defaultSnapshot.commandCenter.activeAdminId,
      commandNote: rawSnapshot.commandCenter?.commandNote?.trim() || defaultSnapshot.commandCenter.commandNote,
      focusArea: rawSnapshot.commandCenter?.focusArea || defaultSnapshot.commandCenter.focusArea,
      highlightedProfessionalId:
        rawSnapshot.commandCenter?.highlightedProfessionalId || defaultSnapshot.commandCenter.highlightedProfessionalId,
      incidentMode: rawSnapshot.commandCenter?.incidentMode || defaultSnapshot.commandCenter.incidentMode,
      runtimeNarrative:
        rawSnapshot.commandCenter?.runtimeNarrative?.trim() || defaultSnapshot.commandCenter.runtimeNarrative,
      watchAreaId: rawSnapshot.commandCenter?.watchAreaId || defaultSnapshot.commandCenter.watchAreaId,
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
        reporterId: ticket.reporterId || undefined,
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

const readSupportDeskSnapshot = (adminStaff: AdminStaffMember[] = []): SupportDeskSnapshot => {
  return cachedSupportDeskSnapshot
    ? normalizeSupportDeskSnapshot(cachedSupportDeskSnapshot, adminStaff)
    : buildDefaultSupportDeskSnapshot(adminStaff);
};

const writeSupportDeskSnapshotToStorage = (snapshot: SupportDeskSnapshot) => {
  cachedSupportDeskSnapshot = normalizeSupportDeskSnapshot(snapshot);

  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(supportDeskEventName));
};

export const clearSupportDeskSnapshotCache = (adminStaff: AdminStaffMember[] = []) => {
  writeSupportDeskSnapshotToStorage(buildDefaultSupportDeskSnapshot(adminStaff));
};

const persistSupportDeskSnapshot = (snapshot: SupportDeskSnapshot, syncBackend: boolean) => {
  writeSupportDeskSnapshotToStorage(snapshot);

  if (syncBackend) {
    syncSupportDeskToApi(snapshot);
  }
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
  const { adminStaff } = useAdminDirectory();
  const [snapshot, setSnapshot] = useState<SupportDeskSnapshot>(() => readSupportDeskSnapshot(adminStaff));
  const [baselineSnapshot, setBaselineSnapshot] = useState<SupportDeskSnapshot>(() =>
    readSupportDeskSnapshot(adminStaff),
  );
  const hasLoadedBackendRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncSnapshot = () => setSnapshot(readSupportDeskSnapshot(adminStaff));

    syncSnapshot();
    window.addEventListener(supportDeskEventName, syncSnapshot);

    void hydrateSupportDeskFromApi()
      .then((apiState) => {
        if (!apiState) {
          return;
        }

        const nextSnapshot = normalizeSupportDeskSnapshot(apiState, adminStaff);
        setBaselineSnapshot(nextSnapshot);
        setSnapshot(nextSnapshot);
        writeSupportDeskSnapshotToStorage(nextSnapshot);
      })
      .finally(() => {
        hasLoadedBackendRef.current = true;
      });

    return () => {
      window.removeEventListener(supportDeskEventName, syncSnapshot);
    };
  }, [adminStaff]);

  const updateSnapshot = (updater: (currentSnapshot: SupportDeskSnapshot) => SupportDeskSnapshot) => {
    setSnapshot((currentSnapshot) => {
      const nextSnapshot = buildNextSnapshot(currentSnapshot, updater);
      persistSupportDeskSnapshot(nextSnapshot, hasLoadedBackendRef.current);
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

  const resetSupportDesk = () => {
    const nextSnapshot = normalizeSupportDeskSnapshot(baselineSnapshot, adminStaff);
    setSnapshot(nextSnapshot);
    persistSupportDeskSnapshot(nextSnapshot, hasLoadedBackendRef.current);
  };

  const importSnapshot = (value: string) => {
    const parsed = JSON.parse(value) as unknown;
    const nextSnapshot = normalizeSupportDeskSnapshot(parsed, adminStaff);
    setSnapshot(nextSnapshot);
    persistSupportDeskSnapshot(nextSnapshot, hasLoadedBackendRef.current);
  };

  return {
    adminStaff,
    commandCenter: snapshot.commandCenter,
    customerTickets: snapshot.tickets.filter((ticket) => ticket.reporterRole === 'customer'),
    defaultCommandCenter: baselineSnapshot.commandCenter,
    defaultTickets: baselineSnapshot.tickets,
    exportSnapshot: () => JSON.stringify(snapshot, null, 2),
    importSnapshot,
    professionalTickets: snapshot.tickets.filter((ticket) => ticket.reporterRole === 'professional'),
    resetSupportDesk,
    savedAt: snapshot.savedAt,
    submitSupportTicket,
    tickets: snapshot.tickets,
    updateCommandCenter,
    updateSupportTicket,
  };
};
