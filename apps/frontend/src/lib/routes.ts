import type { Route } from 'next';
import type { AppointmentStatus } from '@/types/appointments';

export const APP_ROUTES = {
  home: '/home' as Route,
  services: '/services' as Route,
  explore: '/explore' as Route,
  profile: '/profile' as Route,
  appointments: '/appointments' as Route,
} as const;

export function professionalRoute(slug: string): Route {
  return `/p/${slug}` as Route;
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
