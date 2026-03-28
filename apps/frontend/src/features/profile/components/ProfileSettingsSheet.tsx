'use client';

import { KeyRound, ShieldCheck, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId } from 'react';
import { StandardPhoneInput } from '@/components/ui/form-controls';
import type {
  PasswordDraft,
  PasswordSaveErrorKey,
  ProfileDraft,
  ProfileSaveErrorKey,
  ProfileSaveState,
} from '@/features/profile/hooks/useProfileSettings';
import { APP_CONFIG } from '@/lib/config';
import {
  ProfileSheetField,
  ProfileSheetNotice,
  ProfileSheetRuleRow,
  ProfileSheetSection,
  ProfileSheetShell,
  profileSheetInputClassName,
} from './ProfileSheetPrimitives';

interface ProfileSettingsSheetProps {
  activeSheet: 'account' | 'security' | null;
  onClose: () => void;
  onSavePassword: () => void;
  onSaveProfile: () => void;
  onUpdatePasswordField: <K extends keyof PasswordDraft>(field: K, value: PasswordDraft[K]) => void;
  onUpdateProfileField: <K extends keyof ProfileDraft>(field: K, value: ProfileDraft[K]) => void;
  passwordChecks: {
    minLength: boolean;
    hasUppercase: boolean;
    hasNumber: boolean;
    matches: boolean;
  };
  passwordDraft: PasswordDraft;
  passwordErrorKey: PasswordSaveErrorKey;
  passwordSaveState: ProfileSaveState;
  profileDraft: ProfileDraft;
  profileErrorKey: ProfileSaveErrorKey;
  profileSaveState: ProfileSaveState;
}

export const ProfileSettingsSheet = ({
  activeSheet,
  onClose,
  onSavePassword,
  onSaveProfile,
  onUpdatePasswordField,
  onUpdateProfileField,
  passwordChecks,
  passwordDraft,
  passwordErrorKey,
  passwordSaveState,
  profileDraft,
  profileErrorKey,
  profileSaveState,
}: ProfileSettingsSheetProps) => {
  const t = useTranslations('Profile');
  const identityPrefix = useId();
  const securityPrefix = useId();

  if (!activeSheet) {
    return null;
  }

  const isAccountSheet = activeSheet === 'account';
  const accountStatusMessage =
    profileSaveState === 'success'
      ? t('accountSheet.success')
      : profileSaveState === 'error' && profileErrorKey
        ? t(`accountSheet.errors.${profileErrorKey}`)
        : null;
  const securityStatusMessage =
    passwordSaveState === 'success'
      ? t('securitySheet.success')
      : passwordSaveState === 'error' && passwordErrorKey
        ? t(`securitySheet.errors.${passwordErrorKey}`)
        : null;

  return (
    <ProfileSheetShell
      closeLabel={t('buttons.close')}
      description={isAccountSheet ? t('accountSheet.description') : t('securitySheet.description')}
      onClose={onClose}
      title={isAccountSheet ? t('accountSheet.title') : t('securitySheet.title')}
    >
      <div className="custom-scrollbar flex-1 overflow-y-auto px-5 py-5">
        {isAccountSheet ? (
          <div className="space-y-6">
            {accountStatusMessage ? (
              <ProfileSheetNotice
                message={accountStatusMessage}
                tone={profileSaveState === 'success' ? 'success' : 'error'}
              />
            ) : null}

            <ProfileSheetSection
              icon={<User className="h-5 w-5" />}
              iconClassName="bg-pink-50 text-pink-500"
              title={t('accountSheet.identityTitle')}
              description={t('accountSheet.description')}
            >
              <div className="space-y-4">
                <ProfileSheetField label={t('accountSheet.nameLabel')}>
                  <input
                    id={`${identityPrefix}-full-name`}
                    type="text"
                    value={profileDraft.fullName}
                    onChange={(event) => onUpdateProfileField('fullName', event.target.value)}
                    className={profileSheetInputClassName}
                  />
                </ProfileSheetField>

                <ProfileSheetField label={t('accountSheet.phoneLabel')}>
                  <StandardPhoneInput
                    id={`${identityPrefix}-phone`}
                    value={profileDraft.phone}
                    onValueChange={(nextValue) => onUpdateProfileField('phone', nextValue)}
                    accent="pink"
                    surface="muted"
                    className={profileSheetInputClassName}
                  />
                </ProfileSheetField>

                <ProfileSheetField label={t('accountSheet.cityLabel')}>
                  <input
                    id={`${identityPrefix}-city`}
                    type="text"
                    value={profileDraft.city}
                    onChange={(event) => onUpdateProfileField('city', event.target.value)}
                    className={profileSheetInputClassName}
                  />
                </ProfileSheetField>
              </div>
            </ProfileSheetSection>
          </div>
        ) : (
          <div className="space-y-6">
            {securityStatusMessage ? (
              <ProfileSheetNotice
                message={securityStatusMessage}
                tone={passwordSaveState === 'success' ? 'success' : 'error'}
              />
            ) : null}

            <ProfileSheetSection
              icon={<ShieldCheck className="h-5 w-5" />}
              iconClassName="bg-rose-50 text-rose-500"
              title={t('securitySheet.title')}
              description={t('securitySheet.description')}
            >
              <div className="grid gap-4">
                <ProfileSheetField label={t('securitySheet.currentPasswordLabel')}>
                  <input
                    id={`${securityPrefix}-current-password`}
                    type="password"
                    value={passwordDraft.currentPassword}
                    onChange={(event) => onUpdatePasswordField('currentPassword', event.target.value)}
                    autoComplete="current-password"
                    className={profileSheetInputClassName}
                  />
                </ProfileSheetField>

                <ProfileSheetField label={t('securitySheet.newPasswordLabel')}>
                  <input
                    id={`${securityPrefix}-new-password`}
                    type="password"
                    value={passwordDraft.newPassword}
                    onChange={(event) => onUpdatePasswordField('newPassword', event.target.value)}
                    autoComplete="new-password"
                    className={profileSheetInputClassName}
                  />
                </ProfileSheetField>

                <ProfileSheetField label={t('securitySheet.confirmPasswordLabel')}>
                  <input
                    id={`${securityPrefix}-confirm-password`}
                    type="password"
                    value={passwordDraft.confirmPassword}
                    onChange={(event) => onUpdatePasswordField('confirmPassword', event.target.value)}
                    autoComplete="new-password"
                    className={profileSheetInputClassName}
                  />
                </ProfileSheetField>
              </div>
            </ProfileSheetSection>

            <ProfileSheetSection
              icon={<KeyRound className="h-5 w-5" />}
              iconClassName="bg-pink-50 text-pink-500"
              title={t('securitySheet.helperTitle')}
              description={t('securitySheet.helperDescription')}
            >
              <div className="space-y-3">
                <ProfileSheetRuleRow isComplete={passwordChecks.minLength} label={t('securitySheet.ruleMinLength')} />
                <ProfileSheetRuleRow
                  isComplete={passwordChecks.hasUppercase}
                  label={t('securitySheet.ruleUppercase')}
                />
                <ProfileSheetRuleRow isComplete={passwordChecks.hasNumber} label={t('securitySheet.ruleNumber')} />
                <ProfileSheetRuleRow isComplete={passwordChecks.matches} label={t('securitySheet.ruleMatch')} />
              </div>
            </ProfileSheetSection>
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 bg-white p-5 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
        <button
          type="button"
          onClick={isAccountSheet ? onSaveProfile : onSavePassword}
          className="w-full rounded-[18px] py-4 text-[15px] font-bold text-white shadow-[0_10px_24px_rgba(233,30,140,0.25)] transition-all active:scale-[0.99]"
          style={{ backgroundColor: APP_CONFIG.colors.primary }}
        >
          {isAccountSheet ? t('accountSheet.save') : t('securitySheet.save')}
        </button>
      </div>
    </ProfileSheetShell>
  );
};
