'use client';
import { ChevronLeft, ChevronRight, Info, LogOut, User } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { IconButton } from '@/components/ui/IconButton';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useRouter } from '@/i18n/routing';
import { SIMULATION_CURRENT_USER } from '@/lib/constants';

export const ProfileScreen = () => {
  const router = useRouter();
  const t = useTranslations('Profile');

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-24 relative overflow-y-auto custom-scrollbar">
      {/* Simple Header */}
      <div className="flex items-center justify-between px-4 pt-14 pb-4 bg-white sticky top-0 z-20 shadow-sm border-b border-gray-100">
        <IconButton icon={<ChevronLeft className="w-6 h-6 text-gray-800" />} onClick={() => router.back()} />
        <h1 className="text-[16px] font-bold text-gray-900 tracking-wide">{t('title')}</h1>
        <div className="w-10" />
      </div>

      <div className="px-5 py-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6 flex items-center gap-4">
          <div className="w-16 h-16 relative rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-sm flex-shrink-0">
            <Image
              src={SIMULATION_CURRENT_USER.avatar}
              alt={SIMULATION_CURRENT_USER.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-[18px] text-gray-900 leading-tight mb-1">{SIMULATION_CURRENT_USER.name}</h2>
            <p className="text-[13px] text-gray-500 font-medium">{SIMULATION_CURRENT_USER.phone}</p>
          </div>
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Menu */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Language Toggle Row */}
          <div className="flex items-center justify-between p-4 border-b border-gray-50 active:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3 text-gray-700">
              <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                <span className="font-bold text-[12px]">ID/EN</span>
              </div>
              <span className="font-medium text-[15px]">{t('language')}</span>
            </div>
            {/* Clean Segmented Control for light background */}
            <LanguageSwitcher variant="light" />
          </div>

          {/* Account */}
          <div className="flex items-center justify-between p-4 border-b border-gray-50 active:bg-gray-50 cursor-pointer transition-colors">
            <div className="flex items-center gap-3 text-gray-700">
              <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center text-purple-500">
                <User className="w-4 h-4" />
              </div>
              <span className="font-medium text-[15px]">{t('account')}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </div>

          {/* About */}
          <div className="flex items-center justify-between p-4 active:bg-gray-50 cursor-pointer transition-colors">
            <div className="flex items-center gap-3 text-gray-700">
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                <Info className="w-4 h-4" />
              </div>
              <span className="font-medium text-[15px]">{t('aboutApp')}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </div>
        </div>

        {/* Logout */}
        <button
          type="button"
          className="mt-8 w-full flex items-center justify-center gap-2 p-4 bg-red-50 text-red-500 rounded-2xl font-bold active:bg-red-100 transition-colors shadow-sm"
        >
          <LogOut className="w-5 h-5" />
          {t('logout')}
        </button>
      </div>
    </div>
  );
};
