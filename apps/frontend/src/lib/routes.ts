import type { Route } from 'next';
import type { AppointmentStatus } from '@/types/appointments';

export type CustomerAccessIntent = 'general' | 'activity' | 'profile' | 'booking' | 'notifications';
export type ProfessionalAccessTab = 'login' | 'register';
export const PROFESSIONAL_DASHBOARD_TABS = [
  'overview',
  'requests',
  'services',
  'portfolio',
  'coverage',
  'trust',
] as const;
export type ProfessionalDashboardTab = (typeof PROFESSIONAL_DASHBOARD_TABS)[number];
export const PROFESSIONAL_DASHBOARD_DEFAULT_TAB: ProfessionalDashboardTab = 'overview';

export const APP_ROUTES = {
  customerAccess: '/auth/customer' as Route,
  professionalAccess: '/for-professionals' as Route,
  professionalDashboard: '/for-professionals/dashboard' as Route,
  professionalProfile: '/for-professionals/profile' as Route,
  professionalSetup: '/for-professionals/setup' as Route,
  home: '/home' as Route,
  services: '/services' as Route,
  explore: '/explore' as Route,
  profile: '/profile' as Route,
  appointments: '/appointments' as Route,
  notifications: '/notifications' as Route,
} as const;

export function professionalRoute(slug: string): Route {
  return `/p/${slug}` as Route;
}

export function professionalDashboardRoute(tab: ProfessionalDashboardTab = PROFESSIONAL_DASHBOARD_DEFAULT_TAB): Route {
  return `/for-professionals/dashboard/${tab}` as Route;
}

export function isProfessionalDashboardTab(value: string): value is ProfessionalDashboardTab {
  return PROFESSIONAL_DASHBOARD_TABS.includes(value as ProfessionalDashboardTab);
}

export function activityRoute(appointmentId: string): Route {
  return `/activity/${appointmentId}` as Route;
}

export function appointmentsRoute(
  params: { tab?: 'active' | 'history'; status?: AppointmentStatus | 'all' } = {},
): Route {
  const query = new URLSearchParams();

  if (params.tab) {
    query.set('tab', params.tab);
  }

  if (params.status && params.status !== 'all') {
    query.set('status', params.status);
  }

  const queryString = query.toString();

  if (!queryString) {
    return APP_ROUTES.appointments;
  }

  return `/appointments?${queryString}` as Route;
}

export function customerAccessRoute(params: { intent?: CustomerAccessIntent; next?: Route | string } = {}): Route {
  const query = new URLSearchParams();

  if (params.intent) {
    query.set('intent', params.intent);
  }

  if (params.next) {
    query.set('next', String(params.next));
  }

  const queryString = query.toString();

  if (!queryString) {
    return APP_ROUTES.customerAccess;
  }

  return `/auth/customer?${queryString}` as Route;
}

export function professionalAccessRoute(params: { tab?: ProfessionalAccessTab } = {}): Route {
  const query = new URLSearchParams();

  if (params.tab) {
    query.set('tab', params.tab);
  }

  const queryString = query.toString();

  if (!queryString) {
    return APP_ROUTES.professionalAccess;
  }

  return `/for-professionals?${queryString}` as Route;
}

export function exploreRoute(params: { category?: string; q?: string } = {}): Route {
  const query = new URLSearchParams();

  if (params.category) {
    query.set('category', params.category);
  }

  if (params.q) {
    query.set('q', params.q);
  }

  const queryString = query.toString();
  if (!queryString) {
    return APP_ROUTES.explore;
  }

  return `/explore?${queryString}` as Route;
}
