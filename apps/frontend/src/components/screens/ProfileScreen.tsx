'use client';

import { BookHeart, BriefcaseMedical, KeyRound, LifeBuoy, LogOut, MapPin, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
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
import { ProfileSupportEntryCard, ProfileSupportSheet } from '@/features/profile/components/ProfileSupportCenter';
import { useProfileSettings } from '@/features/profile/hooks/useProfileSettings';
import { useRouter } from '@/i18n/routing';
import { APP_ROUTES, professionalAccessRoute } from '@/lib/routes';
import { useAppShell } from '@/lib/use-app-shell';
import { useCustomerAuthSession } from '@/lib/use-customer-auth-session';
import { useViewerSession } from '@/lib/use-viewer-session';

export const ProfileScreen = () => {
  const router = useRouter();
  const t = useTranslations('Profile');
  const {
    hasHydrated,
    isAuthenticated,
    logout,
    session: customerSession,
    updateAccount,
    updatePassword,
  } = useCustomerAuthSession();
  const { isProfessional } = useViewerSession();
  const { currentConsumer, currentUserContext } = useAppShell();
  const [isSupportSheetOpen, setIsSupportSheetOpen] = useState(false);
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
  } = useProfileSettings({
    customerSession,
    updateAccount,
    updatePassword,
  });

  useEffect(() => {
    if (isProfessional) {
      router.replace(APP_ROUTES.professionalProfile);
    }
  }, [isProfessional, router]);

  if (isProfessional) {
    return null;
  }

  if (!hasHydrated) {
    return null;
  }

  if (!isAuthenticated) {
    return <CustomerAccessScreen intent="profile" nextHref={APP_ROUTES.profile} />;
  }

  return (
    <>
      <div className="flex h-full flex-col overflow-y-auto bg-gray-50 pb-24 custom-scrollbar">
        <ProfilePageHeader onBack={() => router.back()} title={t('title')} />

        <div className="space-y-6 px-5 py-6">
          <ProfileIdentityCard
            actionLabel={t('buttons.editProfile')}
            avatarName={currentConsumer.name}
            avatarSrc={currentConsumer.avatar}
            chipIcon={<MapPin className="h-3.5 w-3.5" />}
            chipLabel={customerSession.city || currentUserContext.currentArea}
            onAction={() => openSheet('account')}
            subtitle={currentConsumer.phone}
            title={currentConsumer.name}
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

          <ProfileSupportEntryCard namespace="Profile" onOpen={() => setIsSupportSheetOpen(true)} />

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
            />
            <ProfileSettingsRow
              icon={<LifeBuoy className="h-4 w-4" />}
              iconClassName="bg-amber-50 text-amber-600"
              title={t('support.title')}
              description={t('menu.supportDescription')}
              onClick={() => setIsSupportSheetOpen(true)}
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
              void logout().finally(() => {
                router.push(APP_ROUTES.home);
              });
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

      <ProfileSupportSheet
        defaultContact={profileDraft.phone || currentConsumer.phone}
        isOpen={isSupportSheetOpen}
        namespace="Profile"
        onClose={() => setIsSupportSheetOpen(false)}
        reporterName={profileDraft.fullName || currentConsumer.name}
        reporterPhone={profileDraft.phone || currentConsumer.phone}
      />
    </>
  );
};
