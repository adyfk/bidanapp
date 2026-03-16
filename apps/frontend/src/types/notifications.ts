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
