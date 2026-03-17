import type { Route } from 'next';

export type CustomerNotificationSection = 'today' | 'earlier';
export type CustomerNotificationType = 'appointment' | 'message' | 'payment' | 'account';
export type CustomerNotificationActionKey =
  | 'openActivity'
  | 'replyNow'
  | 'completePayment'
  | 'openProfile'
  | 'leaveReview';

export interface CustomerNotificationItem {
  id: string;
  actionKey: CustomerNotificationActionKey;
  body: string;
  href: Route;
  isUnreadByDefault: boolean;
  section: CustomerNotificationSection;
  timeLabel: string;
  title: string;
  type: CustomerNotificationType;
}

export interface CustomerNotificationState extends CustomerNotificationItem {
  isUnread: boolean;
}

export type ProfessionalNotificationSection = 'actionNeeded' | 'monitoring';
export type ProfessionalNotificationType = 'request' | 'schedule' | 'operations';
export type ProfessionalNotificationActionKey =
  | 'openRequestBoard'
  | 'reviewCoverage'
  | 'reviewProfile'
  | 'reviewServices';

export interface ProfessionalNotificationItem {
  actionKey: ProfessionalNotificationActionKey;
  badgeLabel?: string;
  body: string;
  href: Route;
  id: string;
  isUnreadByDefault: boolean;
  isUrgent?: boolean;
  section: ProfessionalNotificationSection;
  timeLabel: string;
  title: string;
  type: ProfessionalNotificationType;
}

export interface ProfessionalNotificationState extends ProfessionalNotificationItem {
  isUnread: boolean;
}
