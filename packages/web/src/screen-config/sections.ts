export const professionalConsoleSections = [
  { id: 'overview', label: 'Ringkasan', path: '' },
  { id: 'orders', label: 'Permintaan', path: '/orders' },
  { id: 'offerings', label: 'Layanan', path: '/offerings' },
  { id: 'portfolio', label: 'Portofolio', path: '/portfolio' },
  { id: 'trust', label: 'Kepercayaan', path: '/trust' },
  { id: 'coverage', label: 'Jangkauan', path: '/coverage' },
  { id: 'availability', label: 'Jadwal', path: '/availability' },
  { id: 'notifications', label: 'Notifikasi', path: '/notifications' },
  { id: 'profile', label: 'Profil', path: '/profile' },
] as const;

export type ProfessionalDashboardSection = (typeof professionalConsoleSections)[number]['id'];

export const adminConsoleSections = [
  { id: 'login', label: 'Login', href: '/login' },
  { id: 'overview', label: 'Overview', href: '/overview' },
  { id: 'customers', label: 'Customers', href: '/customers' },
  { id: 'professionals', label: 'Professionals', href: '/professionals' },
  { id: 'orders', label: 'Orders', href: '/orders' },
  { id: 'support', label: 'Support', href: '/support' },
  { id: 'refunds', label: 'Refunds', href: '/refunds' },
  { id: 'payouts', label: 'Payouts', href: '/payouts' },
  { id: 'studio', label: 'Studio', href: '/studio' },
] as const;

export type AdminConsoleSection = (typeof adminConsoleSections)[number]['id'];
