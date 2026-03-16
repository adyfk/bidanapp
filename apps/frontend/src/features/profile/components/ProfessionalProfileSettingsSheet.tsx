'use client';

import { MessageSquareMore, ShieldCheck, UserRound } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId } from 'react';
import { APP_CONFIG } from '@/lib/config';
import {
  ProfileSheetField,
  ProfileSheetNotice,
  ProfileSheetRuleRow,
  ProfileSheetSection,
  ProfileSheetShell,
  profileSheetInputClassName,
} from './ProfileSheetPrimitives';

export type ProfessionalProfileSheetKey = 'account' | 'security' | null;
export type ProfessionalProfileSaveState = 'idle' | 'success' | 'error';
export type ProfessionalProfileErrorKey = 'displayNameRequired' | 'phoneRequired' | 'credentialRequired' | null;
export type ProfessionalSecurityErrorKey = 'currentRequired' | 'newPasswordWeak' | 'confirmMismatch' | null;

export interface ProfessionalProfileDraft {
  city: string;
  credentialNumber: string;
  displayName: string;
  phone: string;
  publicBio: string;
  responseTimeGoal: string;
}

export interface ProfessionalPasswordDraft {
  confirmPassword: string;
  currentPassword: string;
  newPassword: string;
  resetPhone: string;
}

interface ProfessionalProfileSettingsSheetProps {
  activeSheet: ProfessionalProfileSheetKey;
  onClose: () => void;
  onSavePassword: () => void;
  onSaveProfile: () => void;
  onSendReset: () => void;
  onUpdatePasswordField: <K extends keyof ProfessionalPasswordDraft>(
    field: K,
    value: ProfessionalPasswordDraft[K],
  ) => void;
  onUpdateProfileField: <K extends keyof ProfessionalProfileDraft>(
    field: K,
    value: ProfessionalProfileDraft[K],
  ) => void;
  passwordChecks: {
    hasNumber: boolean;
    hasUppercase: boolean;
    matches: boolean;
    minLength: boolean;
  };
  passwordDraft: ProfessionalPasswordDraft;
  profileCompletionScore: number;
  profileDraft: ProfessionalProfileDraft;
  profileErrorKey: ProfessionalProfileErrorKey;
  profileSaveState: ProfessionalProfileSaveState;
  resetSaveState: ProfessionalProfileSaveState;
  securityErrorKey: ProfessionalSecurityErrorKey;
  securitySaveState: ProfessionalProfileSaveState;
}

export const ProfessionalProfileSettingsSheet = ({
  activeSheet,
  onClose,
  onSavePassword,
  onSaveProfile,
  onSendReset,
  onUpdatePasswordField,
  onUpdateProfileField,
  passwordChecks,
  passwordDraft,
  profileCompletionScore,
  profileDraft,
  profileErrorKey,
  profileSaveState,
  resetSaveState,
  securityErrorKey,
  securitySaveState,
}: ProfessionalProfileSettingsSheetProps) => {
  const t = useTranslations('ProfessionalProfile');
  const fieldPrefix = useId();

  if (!activeSheet) {
    return null;
  }

  const isAccountSheet = activeSheet === 'account';
  const accountStatusMessage =
    profileSaveState === 'success'
      ? t('account.success')
      : profileSaveState === 'error' && profileErrorKey
        ? t(`account.errors.${profileErrorKey}`)
        : null;
  const securityStatusMessage =
    securitySaveState === 'success'
      ? t('security.success')
      : securitySaveState === 'error' && securityErrorKey
        ? t(`security.errors.${securityErrorKey}`)
        : null;
  const resetStatusMessage =
    resetSaveState === 'success'
      ? t('security.resetSuccess')
      : resetSaveState === 'error'
        ? t('security.errors.resetPhoneRequired')
        : null;

  return (
    <ProfileSheetShell
      closeLabel={t('buttons.close')}
      description={isAccountSheet ? t('account.description') : t('security.description')}
      onClose={onClose}
      title={isAccountSheet ? t('account.title') : t('security.title')}
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
              icon={<UserRound className="h-5 w-5" />}
              iconClassName="bg-pink-50 text-pink-500"
              title={t('account.title')}
              description={t('account.description')}
            >
              <div className="grid gap-4">
                <ProfileSheetField label={t('account.fields.displayName')}>
                  <input
                    id={`${fieldPrefix}-display-name`}
                    type="text"
                    value={profileDraft.displayName}
                    onChange={(event) => onUpdateProfileField('displayName', event.target.value)}
                    className={profileSheetInputClassName}
                  />
                </ProfileSheetField>

                <ProfileSheetField label={t('account.fields.phone')}>
                  <input
                    id={`${fieldPrefix}-phone`}
                    type="tel"
                    value={profileDraft.phone}
                    onChange={(event) => onUpdateProfileField('phone', event.target.value)}
                    className={profileSheetInputClassName}
                  />
                </ProfileSheetField>

                <ProfileSheetField label={t('account.fields.city')}>
                  <input
                    id={`${fieldPrefix}-city`}
                    type="text"
                    value={profileDraft.city}
                    onChange={(event) => onUpdateProfileField('city', event.target.value)}
                    className={profileSheetInputClassName}
                  />
                </ProfileSheetField>

                <ProfileSheetField label={t('account.fields.credentialNumber')}>
                  <input
                    id={`${fieldPrefix}-credential`}
                    type="text"
                    value={profileDraft.credentialNumber}
                    onChange={(event) => onUpdateProfileField('credentialNumber', event.target.value)}
                    className={profileSheetInputClassName}
                  />
                </ProfileSheetField>

                <ProfileSheetField label={t('account.fields.responseTimeGoal')}>
                  <input
                    id={`${fieldPrefix}-response-time`}
                    type="text"
                    value={profileDraft.responseTimeGoal}
                    onChange={(event) => onUpdateProfileField('responseTimeGoal', event.target.value)}
                    className={profileSheetInputClassName}
                  />
                </ProfileSheetField>

                <ProfileSheetField label={t('account.fields.publicBio')}>
                  <textarea
                    id={`${fieldPrefix}-public-bio`}
                    value={profileDraft.publicBio}
                    onChange={(event) => onUpdateProfileField('publicBio', event.target.value)}
                    className={`${profileSheetInputClassName} h-32 resize-none`}
                  />
                </ProfileSheetField>

                <div className="rounded-[20px] border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-[12px] font-semibold text-gray-500">{t('account.fields.profileCompletion')}</p>
                  <p className="mt-2 text-[20px] font-bold text-gray-900">{profileCompletionScore}%</p>
                  <p className="mt-2 text-[12px] leading-relaxed text-gray-500">{t('account.profileCompletionHint')}</p>
                </div>
              </div>
            </ProfileSheetSection>
          </div>
        ) : (
          <div className="space-y-6">
            {securityStatusMessage ? (
              <ProfileSheetNotice
                message={securityStatusMessage}
                tone={securitySaveState === 'success' ? 'success' : 'error'}
              />
            ) : null}

            <ProfileSheetSection
              icon={<ShieldCheck className="h-5 w-5" />}
              iconClassName="bg-rose-50 text-rose-500"
              title={t('security.title')}
              description={t('security.description')}
            >
              <div className="grid gap-4">
                <ProfileSheetField label={t('security.fields.currentPassword')}>
                  <input
                    id={`${fieldPrefix}-current-password`}
                    type="password"
                    value={passwordDraft.currentPassword}
                    onChange={(event) => onUpdatePasswordField('currentPassword', event.target.value)}
                    autoComplete="current-password"
                    className={profileSheetInputClassName}
                  />
                </ProfileSheetField>

                <ProfileSheetField label={t('security.fields.newPassword')}>
                  <input
                    id={`${fieldPrefix}-new-password`}
                    type="password"
                    value={passwordDraft.newPassword}
                    onChange={(event) => onUpdatePasswordField('newPassword', event.target.value)}
                    autoComplete="new-password"
                    className={profileSheetInputClassName}
                  />
                </ProfileSheetField>

                <ProfileSheetField label={t('security.fields.confirmPassword')}>
                  <input
                    id={`${fieldPrefix}-confirm-password`}
                    type="password"
                    value={passwordDraft.confirmPassword}
                    onChange={(event) => onUpdatePasswordField('confirmPassword', event.target.value)}
                    autoComplete="new-password"
                    className={profileSheetInputClassName}
                  />
                </ProfileSheetField>
              </div>

              <div className="mt-4 space-y-3">
                <ProfileSheetRuleRow
                  isComplete={passwordChecks.minLength}
                  label={t('security.rules.minLength')}
                  readyLabel={t('security.status.ready')}
                  pendingLabel={t('security.status.pending')}
                />
                <ProfileSheetRuleRow
                  isComplete={passwordChecks.hasUppercase}
                  label={t('security.rules.hasUppercase')}
                  readyLabel={t('security.status.ready')}
                  pendingLabel={t('security.status.pending')}
                />
                <ProfileSheetRuleRow
                  isComplete={passwordChecks.hasNumber}
                  label={t('security.rules.hasNumber')}
                  readyLabel={t('security.status.ready')}
                  pendingLabel={t('security.status.pending')}
                />
                <ProfileSheetRuleRow
                  isComplete={passwordChecks.matches}
                  label={t('security.rules.matches')}
                  readyLabel={t('security.status.ready')}
                  pendingLabel={t('security.status.pending')}
                />
              </div>
            </ProfileSheetSection>

            <ProfileSheetSection
              icon={<MessageSquareMore className="h-5 w-5" />}
              iconClassName="bg-gray-100 text-gray-700"
              title={t('security.resetTitle')}
              description={t('security.resetDescription')}
            >
              {resetStatusMessage ? (
                <div className="mb-4">
                  <ProfileSheetNotice
                    message={resetStatusMessage}
                    tone={resetSaveState === 'success' ? 'success' : 'error'}
                  />
                </div>
              ) : null}

              <div className="grid gap-4">
                <ProfileSheetField label={t('security.fields.resetPhone')}>
                  <input
                    id={`${fieldPrefix}-reset-phone`}
                    type="tel"
                    value={passwordDraft.resetPhone}
                    onChange={(event) => onUpdatePasswordField('resetPhone', event.target.value)}
                    className={profileSheetInputClassName}
                  />
                </ProfileSheetField>

                <button
                  type="button"
                  onClick={onSendReset}
                  className="w-full rounded-[18px] border border-gray-200 bg-white py-3.5 text-[14px] font-bold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  {t('security.resetButton')}
                </button>
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
          {isAccountSheet ? t('account.saveButton') : t('security.saveButton')}
        </button>
      </div>
    </ProfileSheetShell>
  );
};
