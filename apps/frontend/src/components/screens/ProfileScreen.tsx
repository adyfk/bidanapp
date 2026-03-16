'use client';

import { BookHeart, BriefcaseMedical, ChevronLeft, ChevronRight, KeyRound, LogOut, MapPin, User } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { CustomerAccessScreen } from '@/components/screens/CustomerAccessScreen';
import { IconButton } from '@/components/ui/IconButton';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { ProfileSettingsSheet } from '@/features/profile/components/ProfileSettingsSheet';
import { useProfileSettings } from '@/features/profile/hooks/useProfileSettings';
import { useRouter } from '@/i18n/routing';
import { APP_CONFIG } from '@/lib/config';
import { ACTIVE_CONSUMER, ACTIVE_USER_CONTEXT } from '@/lib/mock-db/runtime';
import { APP_ROUTES } from '@/lib/routes';
import { useViewerSession } from '@/lib/use-viewer-session';

export const ProfileScreen = () => {
  const router = useRouter();
  const t = useTranslations('Profile');
  const { continueAsVisitor, isCustomer } = useViewerSession();
  const {
    activeSheet,
    closeSheet,
    openSheet,
    passwordChecks,
    passwordDraft,
    passwordErrorKey,
    passwordSaveState,
    profileDraft,
    profileErrorKey,
    profileSaveState,
    savePassword,
    saveProfile,
    updatePasswordField,
    updateProfileField,
  } = useProfileSettings();

  if (!isCustomer) {
    return <CustomerAccessScreen intent="profile" nextHref={APP_ROUTES.profile} />;
  }

  return (
    <>
      <div className="flex h-full flex-col overflow-y-auto bg-gray-50 pb-24 custom-scrollbar">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-100 bg-white px-4 pb-4 pt-14 shadow-sm">
          <IconButton icon={<ChevronLeft className="h-6 w-6 text-gray-800" />} onClick={() => router.back()} />
          <h1 className="text-[16px] font-bold tracking-wide text-gray-900">{t('title')}</h1>
          <div className="w-10" />
        </div>

        <div className="space-y-6 px-5 py-6">
          <div className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border-2 border-white bg-gray-200 shadow-sm">
                <Image src={ACTIVE_CONSUMER.avatar} alt={ACTIVE_CONSUMER.name} fill className="object-cover" />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-[18px] font-bold leading-tight text-gray-900">{ACTIVE_CONSUMER.name}</h2>
                <p className="mt-1 text-[13px] font-medium text-gray-500">{ACTIVE_CONSUMER.phone}</p>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-pink-50 px-3 py-1.5 text-[11px] font-semibold text-pink-600">
                  <MapPin className="h-3.5 w-3.5" />
                  {ACTIVE_USER_CONTEXT.currentArea}
                </div>
              </div>

              <button
                type="button"
                onClick={() => openSheet('account')}
                className="flex items-center gap-1 rounded-full bg-gray-50 px-3 py-2 text-[12px] font-semibold text-gray-600 transition-colors hover:bg-gray-100"
              >
                {t('buttons.editProfile')}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <QuickActionCard
              icon={<BookHeart className="h-5 w-5" />}
              title={t('quickActions.activityTitle')}
              description={t('quickActions.activityDescription')}
              onClick={() => router.push(APP_ROUTES.appointments)}
            />
            <QuickActionCard
              icon={<MapPin className="h-5 w-5" />}
              title={t('quickActions.exploreTitle')}
              description={t('quickActions.exploreDescription')}
              onClick={() => router.push(APP_ROUTES.explore)}
            />
          </div>

          <div className="overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-50 p-4">
              <div className="flex items-center gap-3 text-gray-700">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                  <span className="text-[12px] font-bold">ID/EN</span>
                </div>
                <div>
                  <p className="text-[15px] font-medium">{t('language')}</p>
                  <p className="text-[12px] text-gray-500">{t('menu.languageDescription')}</p>
                </div>
              </div>
              <LanguageSwitcher variant="light" />
            </div>

            <SettingRow
              icon={<User className="h-4 w-4" />}
              iconClassName="bg-pink-50 text-pink-500"
              title={t('account')}
              description={t('menu.accountDescription')}
              onClick={() => openSheet('account')}
            />
            <SettingRow
              icon={<KeyRound className="h-4 w-4" />}
              iconClassName="bg-violet-50 text-violet-500"
              title={t('security')}
              description={t('menu.securityDescription')}
              onClick={() => openSheet('security')}
              isLast
            />
          </div>

          <button
            type="button"
            onClick={() => router.push(APP_ROUTES.bidanAccess)}
            className="flex w-full items-center justify-between rounded-[28px] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-5 text-left shadow-sm transition-all hover:shadow-md active:scale-[0.99]"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                <BriefcaseMedical className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[15px] font-bold text-gray-900">{t('bidanCard.title')}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-gray-500">{t('bidanCard.description')}</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-blue-300" />
          </button>

          <button
            type="button"
            onClick={() => {
              continueAsVisitor();
              router.push(APP_ROUTES.home);
            }}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-[24px] bg-red-50 p-4 font-bold text-red-500 shadow-sm transition-colors active:bg-red-100"
          >
            <LogOut className="h-5 w-5" />
            {t('logout')}
          </button>
        </div>
      </div>

      <ProfileSettingsSheet
        activeSheet={activeSheet}
        onClose={closeSheet}
        onSavePassword={savePassword}
        onSaveProfile={saveProfile}
        onUpdatePasswordField={updatePasswordField}
        onUpdateProfileField={updateProfileField}
        passwordChecks={passwordChecks}
        passwordDraft={passwordDraft}
        passwordErrorKey={passwordErrorKey}
        passwordSaveState={passwordSaveState}
        profileDraft={profileDraft}
        profileErrorKey={profileErrorKey}
        profileSaveState={profileSaveState}
      />
    </>
  );
};

interface QuickActionCardProps {
  description: string;
  icon: ReactNode;
  onClick: () => void;
  title: string;
}

const QuickActionCard = ({ description, icon, onClick, title }: QuickActionCardProps) => (
  <button
    type="button"
    onClick={onClick}
    className="rounded-[26px] border border-gray-100 bg-white p-4 text-left shadow-sm transition-all hover:shadow-md active:scale-[0.99]"
  >
    <div
      className="flex h-11 w-11 items-center justify-center rounded-2xl"
      style={{ backgroundColor: APP_CONFIG.colors.primaryLight, color: APP_CONFIG.colors.primary }}
    >
      {icon}
    </div>
    <h3 className="mt-4 text-[15px] font-bold text-gray-900">{title}</h3>
    <p className="mt-1 text-[12px] leading-relaxed text-gray-500">{description}</p>
  </button>
);

interface SettingRowProps {
  description: string;
  icon: ReactNode;
  iconClassName: string;
  isLast?: boolean;
  onClick: () => void;
  title: string;
}

const SettingRow = ({ description, icon, iconClassName, isLast = false, onClick, title }: SettingRowProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-gray-50 ${
      isLast ? '' : 'border-b border-gray-50'
    }`}
  >
    <div className="flex items-center gap-3 text-gray-700">
      <div className={`flex h-9 w-9 items-center justify-center rounded-full ${iconClassName}`}>{icon}</div>
      <div>
        <p className="text-[15px] font-medium">{title}</p>
        <p className="text-[12px] text-gray-500">{description}</p>
      </div>
    </div>
    <ChevronRight className="h-5 w-5 text-gray-300" />
  </button>
);
