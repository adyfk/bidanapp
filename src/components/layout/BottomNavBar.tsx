'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home as HomeIcon, Calendar, MessageSquare, User } from 'lucide-react';
import { COLORS } from '@/lib/constants';

export const BottomNavBar = () => {
  const pathname = usePathname();

  if (pathname === '/' || pathname.startsWith('/doctor')) return null;

  const navItems = [
    { id: '/home', icon: <HomeIcon className="w-[22px] h-[22px]" />, label: 'Home' },
    { id: '/schedule', icon: <Calendar className="w-[22px] h-[22px]" />, label: 'Schedule' },
    { id: '/messages', icon: <MessageSquare className="w-[22px] h-[22px]" />, label: 'Messages' },
    { id: '/profile', icon: <User className="w-[22px] h-[22px]" />, label: 'Profile' }
  ];

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 w-[85%] max-w-[320px]">
      <div className="bg-[#1E1E1E] rounded-full p-2 flex items-center justify-between shadow-2xl">
        {navItems.map((item) => {
          const isActive = pathname === item.id;
          return (
            <Link
              key={item.id}
              href={item.id}
              className={`flex items-center justify-center rounded-full transition-all duration-300 ${
                isActive ? 'px-5 py-3 text-white' : 'w-12 h-12 text-gray-400 hover:text-white'
              }`}
              style={{ backgroundColor: isActive ? COLORS.primary : 'transparent' }}
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
