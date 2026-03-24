'use client';

import { KeyRound, LayoutDashboard, LifeBuoy, LogOut, MapPin, UserRound } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { ProfessionalAccessScreen } from '@/components/screens/ProfessionalAccessScreen';
import { ProfessionalPageSkeleton } from '@/components/screens/ProfessionalPageSkeleton';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import type {
  ProfessionalPasswordDraft,
  ProfessionalProfileDraft,
  ProfessionalProfileErrorKey,
  ProfessionalProfileSaveState,
  ProfessionalProfileSheetKey,
  ProfessionalSecurityErrorKey,
  ProfessionalSecurityResetErrorKey,
} from '@/features/profile/components/ProfessionalProfileSettingsSheet';
import { ProfessionalProfileSettingsSheet } from '@/features/profile/components/ProfessionalProfileSettingsSheet';
import {
  ProfileIdentityCard,
  ProfileLogoutButton,
  ProfilePageHeader,
  ProfileQuickActionCard,
  ProfileSettingsCard,
  ProfileSettingsRow,
} from '@/features/profile/components/ProfilePagePrimitives';
import { ProfileSupportEntryCard, ProfileSupportSheet } from '@/features/profile/components/ProfileSupportCenter';
import { useRouter } from '@/i18n/routing';
import { APP_ROUTES, professionalDashboardRoute, professionalRoute } from '@/lib/routes';
import { useProfessionalAuthSession } from '@/lib/use-professional-auth-session';
import { useProfessionalPortal } from '@/lib/use-professional-portal';

const buildProfileDraft = ({
  city,
  credentialNumber,
  displayName,
  phone,
  publicBio,
  responseTimeGoal,
}: ProfessionalProfileDraft): ProfessionalProfileDraft => ({
  city,
  credentialNumber,
  displayName,
  phone,
  publicBio,
  responseTimeGoal,
});

const buildPasswordDraft = (phone: string): ProfessionalPasswordDraft => ({
  confirmPassword: '',
  currentPassword: '',
  newPassword: '',
  resetPhone: phone,
});

const hasValue = (value: string) => value.trim().length > 0;
const sanitizePhone = (value: string) => value.replace(/[^\d+\s()-]/g, '');

export const ProfessionalProfileScreen = () => {
  const router = useRouter();
  const t = useTranslations('ProfessionalProfile');
  const {
    hasHydrated,
    isAuthenticated,
    logout,
    requestPasswordRecovery,
    session: professionalSession,
    updateAccount,
    updatePassword,
  } = useProfessionalAuthSession();
  const { activeProfessional, portalState, profileCompletionScore, saveBusinessSettings } = useProfessionalPortal();
  const [hasMounted, setHasMounted] = useState(false);
  const [activeSheet, setActiveSheet] = useState<ProfessionalProfileSheetKey>(null);
  const [isSupportSheetOpen, setIsSupportSheetOpen] = useState(false);
  const [profileDraft, setProfileDraft] = useState<ProfessionalProfileDraft>(() =>
    buildProfileDraft({
      city: portalState.city,
      credentialNumber: portalState.credentialNumber,
      displayName: portalState.displayName,
      phone: portalState.phone,
      publicBio: portalState.publicBio,
      responseTimeGoal: portalState.responseTimeGoal,
    }),
  );
  const [passwordDraft, setPasswordDraft] = useState<ProfessionalPasswordDraft>(() =>
    buildPasswordDraft(portalState.phone),
  );
  const [profileSaveState, setProfileSaveState] = useState<ProfessionalProfileSaveState>('idle');
  const [securitySaveState, setSecuritySaveState] = useState<ProfessionalProfileSaveState>('idle');
  const [resetSaveState, setResetSaveState] = useState<ProfessionalProfileSaveState>('idle');
  const [profileErrorKey, setProfileErrorKey] = useState<ProfessionalProfileErrorKey>(null);
  const [securityErrorKey, setSecurityErrorKey] = useState<ProfessionalSecurityErrorKey>(null);
  const [resetErrorKey, setResetErrorKey] = useState<ProfessionalSecurityResetErrorKey>(null);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    setProfileDraft(
      buildProfileDraft({
        city: portalState.city,
        credentialNumber: portalState.credentialNumber,
        displayName: portalState.displayName,
        phone: portalState.phone,
        publicBio: portalState.publicBio,
        responseTimeGoal: portalState.responseTimeGoal,
      }),
    );
    setPasswordDraft((currentDraft) => ({
      ...currentDraft,
      resetPhone: currentDraft.resetPhone || professionalSession.phone || portalState.phone,
    }));
  }, [
    professionalSession.phone,
    portalState.city,
    portalState.credentialNumber,
    portalState.displayName,
    portalState.phone,
    portalState.publicBio,
    portalState.responseTimeGoal,
  ]);

  if (!hasMounted || !hasHydrated) {
    return <ProfessionalPageSkeleton />;
  }

  if (!isAuthenticated || !activeProfessional) {
    return <ProfessionalAccessScreen defaultTab="login" />;
  }

  const passwordChecks = {
    hasNumber: /\d/.test(passwordDraft.newPassword),
    hasUppercase: /[A-Z]/.test(passwordDraft.newPassword),
    matches: passwordDraft.confirmPassword.length > 0 && passwordDraft.confirmPassword === passwordDraft.newPassword,
    minLength: passwordDraft.newPassword.length >= 8,
  };
  const openSheet = (sheet: Exclude<ProfessionalProfileSheetKey, null>) => setActiveSheet(sheet);
  const closeSheet = () => setActiveSheet(null);
  const displayName = profileDraft.displayName || activeProfessional.name;
  const locationLabel =
    portalState.practiceLabel ||
    activeProfessional.practiceLocation?.label ||
    profileDraft.city ||
    activeProfessional.location;

  const updateProfileField = <K extends keyof ProfessionalProfileDraft>(
    field: K,
    value: ProfessionalProfileDraft[K],
  ) => {
    setProfileSaveState('idle');
    setProfileErrorKey(null);

    setProfileDraft((currentDraft) => ({
      ...currentDraft,
      [field]: field === 'phone' ? sanitizePhone(String(value)) : value,
    }));
  };

  const updatePasswordField = <K extends keyof ProfessionalPasswordDraft>(
    field: K,
    value: ProfessionalPasswordDraft[K],
  ) => {
    if (field === 'resetPhone') {
      setResetSaveState('idle');
      setResetErrorKey(null);
    } else {
      setSecuritySaveState('idle');
      setSecurityErrorKey(null);
    }

    setPasswordDraft((currentDraft) => ({
      ...currentDraft,
      [field]: field === 'resetPhone' ? sanitizePhone(String(value)) : value,
    }));
  };

  const handleSaveProfile = async () => {
    if (!hasValue(profileDraft.displayName)) {
      setProfileSaveState('error');
      setProfileErrorKey('displayNameRequired');
      return;
    }

    if (!hasValue(profileDraft.phone)) {
      setProfileSaveState('error');
      setProfileErrorKey('phoneRequired');
      return;
    }

    if (!hasValue(profileDraft.credentialNumber)) {
      setProfileSaveState('error');
      setProfileErrorKey('credentialRequired');
      return;
    }

    try {
      saveBusinessSettings({
        city: profileDraft.city.trim(),
        credentialNumber: profileDraft.credentialNumber.trim(),
        displayName: profileDraft.displayName.trim(),
        phone: profileDraft.phone.trim(),
        publicBio: profileDraft.publicBio.trim(),
        responseTimeGoal: profileDraft.responseTimeGoal.trim(),
      });
      await updateAccount({
        city: profileDraft.city.trim(),
        credentialNumber: profileDraft.credentialNumber.trim(),
        displayName: profileDraft.displayName.trim(),
        phone: profileDraft.phone.trim(),
      });
      setProfileSaveState('success');
      setProfileErrorKey(null);
    } catch {
      setProfileSaveState('error');
      setProfileErrorKey('saveFailed');
    }
  };

  const handleSavePassword = async () => {
    if (!hasValue(passwordDraft.currentPassword)) {
      setSecuritySaveState('error');
      setSecurityErrorKey('currentRequired');
      return;
    }

    if (!passwordChecks.minLength || !passwordChecks.hasUppercase || !passwordChecks.hasNumber) {
      setSecuritySaveState('error');
      setSecurityErrorKey('newPasswordWeak');
      return;
    }

    if (!passwordChecks.matches) {
      setSecuritySaveState('error');
      setSecurityErrorKey('confirmMismatch');
      return;
    }

    try {
      await updatePassword({
        currentPassword: passwordDraft.currentPassword,
        newPassword: passwordDraft.newPassword,
      });
      setSecuritySaveState('success');
      setSecurityErrorKey(null);
      setPasswordDraft((currentDraft) => ({
        ...currentDraft,
        confirmPassword: '',
        currentPassword: '',
        newPassword: '',
      }));
    } catch {
      setSecuritySaveState('error');
      setSecurityErrorKey('saveFailed');
    }
  };

  const handleSendReset = async () => {
    if (!hasValue(passwordDraft.resetPhone)) {
      setResetSaveState('error');
      setResetErrorKey('resetPhoneRequired');
      return;
    }

    try {
      await requestPasswordRecovery({
        phone: passwordDraft.resetPhone.trim(),
        professionalId: professionalSession.professionalId,
      });
      setResetSaveState('success');
      setResetErrorKey(null);
    } catch {
      setResetSaveState('error');
      setResetErrorKey('resetFailed');
    }
  };

  return (
    <>
      <div className="flex h-full flex-col overflow-y-auto bg-[linear-gradient(180deg,#F8FAFC_0%,#F4F6FA_100%)] pb-10 custom-scrollbar">
        <ProfilePageHeader onBack={() => router.push(professionalDashboardRoute('requests'))} title={t('navTitle')} />

        <div className="space-y-5 px-5 py-6">
          <ProfileIdentityCard
            actionLabel={t('buttons.editProfile')}
            avatarName={displayName}
            avatarSrc={activeProfessional.image}
            chipIcon={<MapPin className="h-3.5 w-3.5" />}
            chipLabel={locationLabel}
            onAction={() => openSheet('account')}
            subtitle={profileDraft.phone}
            title={displayName}
          />

          <div className="grid grid-cols-2 gap-3">
            <ProfileQuickActionCard
              icon={<LayoutDashboard className="h-5 w-5" />}
              title={t('quickActions.dashboardTitle')}
              description={t('quickActions.dashboardDescription')}
              onClick={() => router.push(professionalDashboardRoute('requests'))}
            />
            <ProfileQuickActionCard
              icon={<UserRound className="h-5 w-5" />}
              title={t('quickActions.publicProfileTitle')}
              description={t('quickActions.publicProfileDescription')}
              onClick={() => router.push(professionalRoute(activeProfessional.slug))}
            />
          </div>

          <ProfileSupportEntryCard namespace="ProfessionalProfile" onOpen={() => setIsSupportSheetOpen(true)} />

          <ProfileSettingsCard>
            <ProfileSettingsRow
              icon={<span className="text-[12px] font-bold">ID/EN</span>}
              iconClassName="bg-blue-50 text-blue-500"
              title={t('language.title')}
              description={t('language.compactDescription')}
              trailing={<LanguageSwitcher variant="light" />}
            />
            <ProfileSettingsRow
              icon={<UserRound className="h-4 w-4" />}
              iconClassName="bg-pink-50 text-pink-500"
              title={t('account.title')}
              description={t('menu.accountDescription')}
              onClick={() => openSheet('account')}
            />
            <ProfileSettingsRow
              icon={<KeyRound className="h-4 w-4" />}
              iconClassName="bg-violet-50 text-violet-500"
              title={t('security.title')}
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

          <ProfileLogoutButton
            icon={<LogOut className="h-5 w-5" />}
            label={t('actions.logout')}
            onClick={async () => {
              await logout();
              router.push(APP_ROUTES.home);
            }}
          />
        </div>
      </div>

      <ProfessionalProfileSettingsSheet
        activeSheet={activeSheet}
        onClose={closeSheet}
        onSavePassword={handleSavePassword}
        onSaveProfile={handleSaveProfile}
        onSendReset={handleSendReset}
        onUpdatePasswordField={updatePasswordField}
        onUpdateProfileField={updateProfileField}
        passwordChecks={passwordChecks}
        passwordDraft={passwordDraft}
        profileCompletionScore={profileCompletionScore}
        profileDraft={profileDraft}
        profileErrorKey={profileErrorKey}
        profileSaveState={profileSaveState}
        resetErrorKey={resetErrorKey}
        resetSaveState={resetSaveState}
        securityErrorKey={securityErrorKey}
        securitySaveState={securitySaveState}
      />

      <ProfileSupportSheet
        defaultContact={profileDraft.phone || portalState.phone}
        isOpen={isSupportSheetOpen}
        namespace="ProfessionalProfile"
        onClose={() => setIsSupportSheetOpen(false)}
        reporterName={profileDraft.displayName || activeProfessional.name}
        reporterPhone={profileDraft.phone || portalState.phone}
      />
    </>
  );
};
