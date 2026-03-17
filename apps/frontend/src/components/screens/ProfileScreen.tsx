'use client';

import { BookHeart, BriefcaseMedical, KeyRound, LogOut, MapPin, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { CustomerAccessScreen } from '@/components/screens/CustomerAccessScreen';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import {
  ProfileIdentityCard,
  ProfileLogoutButton,
  ProfilePageHeader,
  ProfileQuickActionCard,
  ProfileSettingsCard,
  ProfileSettingsRow,
} from '@/features/profile/components/ProfilePagePrimitives';
import { ProfileSettingsSheet } from '@/features/profile/components/ProfileSettingsSheet';
import { useProfileSettings } from '@/features/profile/hooks/useProfileSettings';
import { useRouter } from '@/i18n/routing';
import { ACTIVE_CONSUMER, ACTIVE_USER_CONTEXT } from '@/lib/mock-db/runtime';
import { APP_ROUTES, professionalAccessRoute } from '@/lib/routes';
import { useViewerSession } from '@/lib/use-viewer-session';

export const ProfileScreen = () => {
  const router = useRouter();
  const t = useTranslations('Profile');
  const { continueAsVisitor, isCustomer, isProfessional } = useViewerSession();
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

  useEffect(() => {
    if (isProfessional) {
      router.replace(APP_ROUTES.professionalProfile);
    }
  }, [isProfessional, router]);

  if (isProfessional) {
    return null;
  }

  if (!isCustomer) {
    return <CustomerAccessScreen intent="profile" nextHref={APP_ROUTES.profile} />;
  }

  return (
    <>
      <div className="flex h-full flex-col overflow-y-auto bg-gray-50 pb-24 custom-scrollbar">
        <ProfilePageHeader onBack={() => router.back()} title={t('title')} />

        <div className="space-y-6 px-5 py-6">
          <ProfileIdentityCard
            actionLabel={t('buttons.editProfile')}
            avatarName={ACTIVE_CONSUMER.name}
            avatarSrc={ACTIVE_CONSUMER.avatar}
            chipIcon={<MapPin className="h-3.5 w-3.5" />}
            chipLabel={ACTIVE_USER_CONTEXT.currentArea}
            onAction={() => openSheet('account')}
            subtitle={ACTIVE_CONSUMER.phone}
            title={ACTIVE_CONSUMER.name}
          />

          <div className="grid grid-cols-2 gap-3">
            <ProfileQuickActionCard
              icon={<BookHeart className="h-5 w-5" />}
              title={t('quickActions.activityTitle')}
              description={t('quickActions.activityDescription')}
              onClick={() => router.push(APP_ROUTES.appointments)}
            />
            <ProfileQuickActionCard
              icon={<MapPin className="h-5 w-5" />}
              title={t('quickActions.exploreTitle')}
              description={t('quickActions.exploreDescription')}
              onClick={() => router.push(APP_ROUTES.explore)}
            />
          </div>

          <ProfileSettingsCard>
            <ProfileSettingsRow
              icon={<span className="text-[12px] font-bold">ID/EN</span>}
              iconClassName="bg-blue-50 text-blue-500"
              title={t('language')}
              description={t('menu.languageDescription')}
              trailing={<LanguageSwitcher variant="light" />}
            />
            <ProfileSettingsRow
              icon={<User className="h-4 w-4" />}
              iconClassName="bg-pink-50 text-pink-500"
              title={t('account')}
              description={t('menu.accountDescription')}
              onClick={() => openSheet('account')}
            />
            <ProfileSettingsRow
              icon={<KeyRound className="h-4 w-4" />}
              iconClassName="bg-violet-50 text-violet-500"
              title={t('security')}
              description={t('menu.securityDescription')}
              onClick={() => openSheet('security')}
              isLast
            />
          </ProfileSettingsCard>

          <button
            type="button"
            onClick={() => router.push(professionalAccessRoute())}
            className="flex w-full items-center justify-between rounded-[28px] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-5 text-left shadow-sm transition-all hover:shadow-md active:scale-[0.99]"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                <BriefcaseMedical className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[15px] font-bold text-gray-900">{t('professionalCard.title')}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-gray-500">{t('professionalCard.description')}</p>
              </div>
            </div>
          </button>

          <ProfileLogoutButton
            icon={<LogOut className="h-5 w-5" />}
            label={t('logout')}
            onClick={() => {
              continueAsVisitor();
              router.push(APP_ROUTES.home);
            }}
          />
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
