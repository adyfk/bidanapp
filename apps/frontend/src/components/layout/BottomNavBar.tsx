'use client';

import { Activity, Home as HomeIcon, Search, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { APP_CONFIG } from '@/lib/config';
import { APP_ROUTES, customerAccessRoute } from '@/lib/routes';
import { useViewerSession } from '@/lib/use-viewer-session';

export const BottomNavBar = () => {
  const pathname = usePathname();
  const t = useTranslations('Navigation');
  const { isCustomer } = useViewerSession();

  if (
    pathname === '/' ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/for-bidan') ||
    pathname.startsWith('/p') ||
    pathname.startsWith('/messages/')
  )
    return null;

  if (!isCustomer && (pathname === APP_ROUTES.appointments || pathname === APP_ROUTES.profile)) {
    return null;
  }

  const navItems = [
    { id: APP_ROUTES.home, icon: <HomeIcon className="w-[22px] h-[22px]" />, label: t('home') },
    { id: APP_ROUTES.services, icon: <Search className="w-[22px] h-[22px]" />, label: t('search') },
    { id: APP_ROUTES.explore, icon: <Users className="w-[22px] h-[22px]" />, label: t('experts') },
    {
      id: isCustomer
        ? APP_ROUTES.appointments
        : customerAccessRoute({ intent: 'activity', next: APP_ROUTES.appointments }),
      icon: <Activity className="w-[22px] h-[22px]" />,
      label: t('activity'),
    },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-[400px] px-6">
      <div
        className="rounded-full p-2 flex items-center justify-between shadow-2xl"
        style={{ backgroundColor: APP_CONFIG.colors.darkNav }}
      >
        {navItems.map((item) => {
          const isActive = pathname === item.id;
          return (
            <Link
              key={item.id}
              href={item.id}
              className={`flex items-center justify-center rounded-full transition-all duration-300 ${
                isActive ? 'px-5 py-3 text-white' : 'w-12 h-12 text-gray-400 hover:text-white'
              }`}
              style={{ backgroundColor: isActive ? APP_CONFIG.colors.primary : 'transparent' }}
            >
              {item.icon}
              {isActive && <span className="text-[13px] font-bold ml-2.5">{item.label}</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
};
