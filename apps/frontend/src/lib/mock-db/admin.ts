import adminStaffData from '@/data/mock-db/admin_staff.json';
import supportTicketsData from '@/data/mock-db/support_tickets.json';
import type {
  AdminCommandCenterState,
  AdminStaffMember,
  SupportDeskSnapshot,
  SupportTicket,
  SupportTicketStatus,
} from '@/types/admin';
import type { AdminStaffRow, SupportTicketRow } from '@/types/mock-db';
import { sortByIndex } from './utils';

const adminStaffRows = sortByIndex(adminStaffData as AdminStaffRow[]);
const supportTicketRows = sortByIndex(supportTicketsData as SupportTicketRow[]);

export const MOCK_ADMIN_STAFF: AdminStaffMember[] = adminStaffRows.map((row) => ({
  email: row.email,
  focusArea: row.focusArea,
  id: row.id,
  index: row.index,
  name: row.name,
  phone: row.phone,
  presence: row.presence,
  shiftLabel: row.shiftLabel,
  title: row.title,
}));

export const DEFAULT_SUPPORT_TICKETS: SupportTicket[] = supportTicketRows
  .map((row) => ({
    assignedAdminId: row.assignedAdminId || undefined,
    categoryId: row.categoryId,
    contactValue: row.contactValue,
    createdAt: row.createdAt,
    details: row.details,
    etaKey: row.etaKey,
    id: row.id,
    preferredChannel: row.preferredChannel,
    referenceCode: row.referenceCode || undefined,
    relatedAppointmentId: row.relatedAppointmentId || undefined,
    relatedProfessionalId: row.relatedProfessionalId || undefined,
    reporterName: row.reporterName,
    reporterPhone: row.reporterPhone,
    reporterRole: row.reporterRole,
    sourceSurface: row.sourceSurface,
    status: row.status,
    summary: row.summary,
    updatedAt: row.updatedAt,
    urgency: row.urgency,
  }))
  .sort(
    (leftTicket, rightTicket) => new Date(rightTicket.createdAt).getTime() - new Date(leftTicket.createdAt).getTime(),
  );

export const DEFAULT_COMMAND_CENTER_STATE: AdminCommandCenterState = {
  activeAdminId: MOCK_ADMIN_STAFF[0]?.id || 'adm-01',
  commandNote:
    'Fokuskan triase pada pembayaran ganda, sengketa service aktif, dan profil profesional yang menunggu publish.',
  focusArea: 'support',
  highlightedProfessionalId: '4',
  incidentMode: 'monitoring',
  runtimeNarrative:
    'Frontend demo masih berjalan dengan mock lokal di browser. Setiap perubahan operasional admin disimpan secara lokal.',
  watchAreaId: 'jakarta-selatan-kebayoran-baru',
};

export const SUPPORT_DESK_SCHEMA_VERSION = 1;

export const buildDefaultSupportDeskSnapshot = (): SupportDeskSnapshot => ({
  commandCenter: DEFAULT_COMMAND_CENTER_STATE,
  savedAt: new Date().toISOString(),
  schemaVersion: SUPPORT_DESK_SCHEMA_VERSION,
  tickets: DEFAULT_SUPPORT_TICKETS,
});

export const supportTicketStatusOrder: SupportTicketStatus[] = ['new', 'triaged', 'reviewing', 'resolved', 'refunded'];
