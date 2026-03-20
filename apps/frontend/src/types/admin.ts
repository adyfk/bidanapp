export type SupportRole = 'customer' | 'professional';
export type SupportChannelId = 'call' | 'email' | 'whatsapp';
export type SupportUrgencyId = 'high' | 'normal' | 'urgent';
export type SupportEtaKey = SupportUrgencyId;
export type SupportTicketStatus = 'new' | 'refunded' | 'resolved' | 'reviewing' | 'triaged';
export type CustomerSupportCategoryId =
  | 'accountAccess'
  | 'other'
  | 'paymentIssue'
  | 'refundRequest'
  | 'reportProfessional'
  | 'serviceComplaint';
export type ProfessionalSupportCategoryId =
  | 'accountAccess'
  | 'other'
  | 'refundClarification'
  | 'reportCustomer'
  | 'serviceDispute'
  | 'technicalIssue';
export type SupportCategoryId = CustomerSupportCategoryId | ProfessionalSupportCategoryId;
export type AdminFocusArea = 'catalog' | 'ops' | 'reviews' | 'support';
export type AdminIncidentMode = 'degraded' | 'monitoring' | 'stable';
export type AdminStaffPresence = 'away' | 'busy' | 'online';

export interface AdminStaffMember {
  email: string;
  focusArea: AdminFocusArea;
  id: string;
  index: number;
  name: string;
  phone: string;
  presence: AdminStaffPresence;
  shiftLabel: string;
  title: string;
}

export interface SupportTicket {
  assignedAdminId?: string;
  categoryId: SupportCategoryId;
  contactValue: string;
  createdAt: string;
  details: string;
  etaKey: SupportEtaKey;
  id: string;
  preferredChannel: SupportChannelId;
  referenceCode?: string;
  relatedAppointmentId?: string;
  relatedProfessionalId?: string;
  reporterName: string;
  reporterPhone: string;
  reporterRole: SupportRole;
  sourceSurface: 'admin_manual' | 'profile_customer' | 'profile_professional';
  status: SupportTicketStatus;
  summary: string;
  updatedAt: string;
  urgency: SupportUrgencyId;
}

export interface AdminCommandCenterState {
  activeAdminId: string;
  commandNote: string;
  focusArea: AdminFocusArea;
  highlightedProfessionalId: string;
  incidentMode: AdminIncidentMode;
  runtimeNarrative: string;
  watchAreaId: string;
}

export interface SupportDeskSnapshot {
  commandCenter: AdminCommandCenterState;
  savedAt: string;
  schemaVersion: number;
  tickets: SupportTicket[];
}

export interface AdminSessionState {
  adminId: string;
  email: string;
  focusArea: AdminFocusArea;
  isAuthenticated: boolean;
  lastLoginAt?: string;
  lastVisitedRoute?: string;
}
