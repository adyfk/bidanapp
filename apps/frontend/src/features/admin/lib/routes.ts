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
    description: 'Ringkasan utama untuk KPI harian, shortcut kerja, dan status operasional lintas modul.',
    focusArea: 'all',
    href: ADMIN_ROUTES.overview,
    keywords: ['dashboard', 'kpi', 'command center', 'ringkasan', 'overview'],
    label: 'Overview',
    shortLabel: 'Ops',
  },
  {
    description: 'Profil customer, user context, appointment terkait, dan runtime yang sedang aktif.',
    focusArea: 'ops',
    href: ADMIN_ROUTES.customers,
    keywords: ['consumer', 'customer', 'runtime', 'context', 'pelanggan'],
    label: 'Customers',
    shortLabel: 'Cust',
  },
  {
    description: 'Antrean approval profesional, kontrol publish, dan tindak lanjut review yang tertahan.',
    focusArea: 'reviews',
    href: ADMIN_ROUTES.professionals,
    keywords: ['approval', 'review', 'publish', 'provider', 'profesional'],
    label: 'Professionals',
    shortLabel: 'Pro',
  },
  {
    description: 'Master katalog, category, service offering, dan mode delivery yang tersedia.',
    focusArea: 'catalog',
    href: ADMIN_ROUTES.services,
    keywords: ['catalog', 'layanan', 'service', 'offering', 'kategori'],
    label: 'Services',
    shortLabel: 'Svc',
  },
  {
    description: 'Booking desk untuk timeline, status delivery, dan progres appointment yang aktif.',
    focusArea: 'ops',
    href: ADMIN_ROUTES.appointments,
    keywords: ['booking', 'appointment', 'timeline', 'schedule', 'ops'],
    label: 'Appointments',
    shortLabel: 'Appt',
  },
  {
    description: 'Helpdesk untuk triage ticket, assignment PIC, refund, dan pemantauan SLA support.',
    focusArea: 'support',
    href: ADMIN_ROUTES.support,
    keywords: ['support', 'ticket', 'triage', 'sla', 'refund'],
    label: 'Support',
    shortLabel: 'Desk',
  },
  {
    description: 'Data studio untuk raw tables, import-export snapshot, reset baseline, dan audit perubahan data.',
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
