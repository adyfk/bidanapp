import type { Route } from 'next';
import { PUBLIC_ENV } from '@/lib/env';
import type { AdminFocusArea } from '@/types/admin';

export const ADMIN_ROUTES = {
  root: '/admin' as Route,
  login: '/admin/login' as Route,
  overview: '/admin/overview' as Route,
  customers: '/admin/customers' as Route,
  professionals: '/admin/professionals' as Route,
  services: '/admin/services' as Route,
  appointments: '/admin/appointments' as Route,
  support: '/admin/support' as Route,
  studio: '/admin/studio' as Route,
} as const;

export interface AdminNavItem {
  description: string;
  focusArea: AdminFocusArea | 'all';
  href: Route;
  keywords: string[];
  label: string;
  shortLabel: string;
}

const BASE_ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    description: 'Command center, KPI harian, dan quick actions lintas operasional.',
    focusArea: 'all',
    href: ADMIN_ROUTES.overview,
    keywords: ['dashboard', 'kpi', 'command center', 'ringkasan', 'overview'],
    label: 'Overview',
    shortLabel: 'Ops',
  },
  {
    description: 'Profil customer, user context, linked appointments, dan runtime aktif.',
    focusArea: 'ops',
    href: ADMIN_ROUTES.customers,
    keywords: ['consumer', 'customer', 'runtime', 'context', 'pelanggan'],
    label: 'Customers',
    shortLabel: 'Cust',
  },
  {
    description: 'Approval FIFO, publish control, dan review lifecycle profesional.',
    focusArea: 'reviews',
    href: ADMIN_ROUTES.professionals,
    keywords: ['approval', 'review', 'publish', 'provider', 'profesional'],
    label: 'Professionals',
    shortLabel: 'Pro',
  },
  {
    description: 'Catalog global, category, service offering, dan mode delivery.',
    focusArea: 'catalog',
    href: ADMIN_ROUTES.services,
    keywords: ['catalog', 'layanan', 'service', 'offering', 'kategori'],
    label: 'Services',
    shortLabel: 'Svc',
  },
  {
    description: 'Operasional booking, timeline, dan status delivery appointment.',
    focusArea: 'ops',
    href: ADMIN_ROUTES.appointments,
    keywords: ['booking', 'appointment', 'timeline', 'schedule', 'ops'],
    label: 'Appointments',
    shortLabel: 'Appt',
  },
  {
    description: 'Triage desk, assignment PIC, eskalasi, refund, dan SLA support.',
    focusArea: 'support',
    href: ADMIN_ROUTES.support,
    keywords: ['support', 'ticket', 'triage', 'sla', 'refund'],
    label: 'Support',
    shortLabel: 'Desk',
  },
  {
    description: 'Raw tables, import-export snapshot, reset baseline backend, dan audit data operasional.',
    focusArea: 'all',
    href: ADMIN_ROUTES.studio,
    keywords: ['studio', 'snapshot', 'baseline', 'import', 'export', 'reset'],
    label: 'Data Studio',
    shortLabel: 'Data',
  },
];

export const getAdminNavItems = (): AdminNavItem[] =>
  BASE_ADMIN_NAV_ITEMS.filter((item) => item.href !== ADMIN_ROUTES.studio || PUBLIC_ENV.adminStudioEnabled);

export const ADMIN_NAV_ITEMS: AdminNavItem[] = getAdminNavItems();

export const getAdminNavItem = (pathname?: string | null) =>
  getAdminNavItems().find((item) => item.href === pathname) || null;
