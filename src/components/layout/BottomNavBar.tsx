'use client';

import React from 'react';
import { Link, usePathname } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Home as HomeIcon, Search, Activity, Users } from 'lucide-react';
import { APP_CONFIG } from '@/lib/config';

export const BottomNavBar = () => {
  const pathname = usePathname();
  const t = useTranslations('Navigation');

  if (pathname === '/' || pathname.startsWith('/p') || pathname.startsWith('/messages/')) return null;

  const navItems = [
    { id: '/home', icon: <HomeIcon className="w-[22px] h-[22px]" />, label: t('home') },
    { id: '/services', icon: <Search className="w-[22px] h-[22px]" />, label: t('search') },
    { id: '/explore', icon: <Users className="w-[22px] h-[22px]" />, label: t('experts') },
    { id: '/appointments', icon: <Activity className="w-[22px] h-[22px]" />, label: t('activity') }
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-[400px] px-6">
      <div className="rounded-full p-2 flex items-center justify-between shadow-2xl" style={{ backgroundColor: APP_CONFIG.colors.darkNav }}>
        {navItems.map((item) => {
          const isActive = pathname === item.id;
          return (
            <Link
              key={item.id}
              href={item.id}
              className={`flex items-center justify-center rounded-full transition-all duration-300 ${isActive ? 'px-5 py-3 text-white' : 'w-12 h-12 text-gray-400 hover:text-white'
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
