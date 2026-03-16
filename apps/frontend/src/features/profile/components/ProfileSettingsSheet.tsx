'use client';

import { Check, CheckCircle2, ChevronLeft, KeyRound, ShieldCheck, User, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId } from 'react';
import type {
  PasswordDraft,
  PasswordSaveErrorKey,
  ProfileDraft,
  ProfileSaveErrorKey,
  ProfileSaveState,
} from '@/features/profile/hooks/useProfileSettings';
import { APP_CONFIG } from '@/lib/config';

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

const inputClassName =
  'w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-[14px] text-gray-800 transition-all focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100';

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
    <div className="fixed inset-0 z-[80] flex items-end justify-center overflow-hidden sm:items-center">
      <button
        type="button"
        aria-label={t('buttons.close')}
        className="absolute inset-0 bg-black/45 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative z-10 flex max-h-[94vh] w-full max-w-md flex-col overflow-hidden rounded-t-[32px] bg-white shadow-2xl animate-in slide-in-from-bottom-full duration-300 sm:rounded-[32px]">
        <div className="mx-auto mb-2 mt-4 h-1.5 w-12 rounded-full bg-gray-200 sm:hidden" />

        <div className="flex items-start gap-3 border-b border-gray-100 px-5 pb-4 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex-1">
            <h2 className="text-[20px] font-bold text-gray-900">
              {isAccountSheet ? t('accountSheet.title') : t('securitySheet.title')}
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-gray-500">
              {isAccountSheet ? t('accountSheet.description') : t('securitySheet.description')}
            </p>
          </div>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto px-5 py-5">
          {isAccountSheet ? (
            <div className="space-y-6">
              {accountStatusMessage ? (
                <div
                  className={`rounded-[22px] border px-4 py-3 text-[13px] font-medium ${
                    profileSaveState === 'success'
                      ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                      : 'border-red-100 bg-red-50 text-red-600'
                  }`}
                >
                  {accountStatusMessage}
                </div>
              ) : null}

              <section className="rounded-[26px] border border-gray-100 bg-white p-4 shadow-[0_18px_40px_-32px_rgba(17,24,39,0.38)]">
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: APP_CONFIG.colors.primaryLight, color: APP_CONFIG.colors.primary }}
                  >
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-gray-900">{t('accountSheet.identityTitle')}</h3>
                    <p className="text-[12px] text-gray-500">{t('accountSheet.description')}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-[12px] font-semibold text-gray-500">
                      {t('accountSheet.nameLabel')}
                    </span>
                    <input
                      id={`${identityPrefix}-full-name`}
                      type="text"
                      value={profileDraft.fullName}
                      onChange={(event) => onUpdateProfileField('fullName', event.target.value)}
                      className={inputClassName}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[12px] font-semibold text-gray-500">
                      {t('accountSheet.phoneLabel')}
                    </span>
                    <input
                      id={`${identityPrefix}-phone`}
                      type="tel"
                      value={profileDraft.phone}
                      onChange={(event) => onUpdateProfileField('phone', event.target.value)}
                      className={inputClassName}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[12px] font-semibold text-gray-500">
                      {t('accountSheet.focusLabel')}
                    </span>
                    <textarea
                      id={`${identityPrefix}-care-focus`}
                      value={profileDraft.careFocus}
                      onChange={(event) => onUpdateProfileField('careFocus', event.target.value)}
                      placeholder={t('accountSheet.focusPlaceholder')}
                      className={`${inputClassName} h-28 resize-none`}
                    />
                  </label>
                </div>
              </section>

              <section className="rounded-[26px] border border-gray-100 bg-white p-4 shadow-[0_18px_40px_-32px_rgba(17,24,39,0.38)]">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-gray-900">{t('accountSheet.supportTitle')}</h3>
                    <p className="text-[12px] text-gray-500">{t('accountSheet.supportDescription')}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-[12px] font-semibold text-gray-500">
                      {t('accountSheet.supportNameLabel')}
                    </span>
                    <input
                      id={`${identityPrefix}-support-name`}
                      type="text"
                      value={profileDraft.supportContactName}
                      onChange={(event) => onUpdateProfileField('supportContactName', event.target.value)}
                      className={inputClassName}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[12px] font-semibold text-gray-500">
                      {t('accountSheet.supportRelationLabel')}
                    </span>
                    <input
                      id={`${identityPrefix}-support-relation`}
                      type="text"
                      value={profileDraft.supportContactRelation}
                      onChange={(event) => onUpdateProfileField('supportContactRelation', event.target.value)}
                      placeholder={t('accountSheet.supportPlaceholder')}
                      className={inputClassName}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[12px] font-semibold text-gray-500">
                      {t('accountSheet.supportPhoneLabel')}
                    </span>
                    <input
                      id={`${identityPrefix}-support-phone`}
                      type="tel"
                      value={profileDraft.supportContactPhone}
                      onChange={(event) => onUpdateProfileField('supportContactPhone', event.target.value)}
                      className={inputClassName}
                    />
                  </label>
                </div>
              </section>
            </div>
          ) : (
            <div className="space-y-6">
              {securityStatusMessage ? (
                <div
                  className={`rounded-[22px] border px-4 py-3 text-[13px] font-medium ${
                    passwordSaveState === 'success'
                      ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                      : 'border-red-100 bg-red-50 text-red-600'
                  }`}
                >
                  {securityStatusMessage}
                </div>
              ) : null}

              <section className="rounded-[26px] border border-gray-100 bg-gradient-to-br from-rose-50 via-white to-violet-50 p-4 shadow-[0_18px_40px_-32px_rgba(17,24,39,0.38)]">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-rose-500 shadow-sm">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-gray-900">{t('securitySheet.helperTitle')}</h3>
                    <p className="mt-1 text-[12px] leading-relaxed text-gray-500">{t('securitySheet.description')}</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  <label className="block">
                    <span className="mb-2 block text-[12px] font-semibold text-gray-500">
                      {t('securitySheet.currentPasswordLabel')}
                    </span>
                    <input
                      id={`${securityPrefix}-current-password`}
                      type="password"
                      value={passwordDraft.currentPassword}
                      onChange={(event) => onUpdatePasswordField('currentPassword', event.target.value)}
                      autoComplete="current-password"
                      className={inputClassName}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[12px] font-semibold text-gray-500">
                      {t('securitySheet.newPasswordLabel')}
                    </span>
                    <input
                      id={`${securityPrefix}-new-password`}
                      type="password"
                      value={passwordDraft.newPassword}
                      onChange={(event) => onUpdatePasswordField('newPassword', event.target.value)}
                      autoComplete="new-password"
                      className={inputClassName}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[12px] font-semibold text-gray-500">
                      {t('securitySheet.confirmPasswordLabel')}
                    </span>
                    <input
                      id={`${securityPrefix}-confirm-password`}
                      type="password"
                      value={passwordDraft.confirmPassword}
                      onChange={(event) => onUpdatePasswordField('confirmPassword', event.target.value)}
                      autoComplete="new-password"
                      className={inputClassName}
                    />
                  </label>
                </div>
              </section>

              <section className="rounded-[26px] border border-gray-100 bg-white p-4 shadow-[0_18px_40px_-32px_rgba(17,24,39,0.38)]">
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: APP_CONFIG.colors.primaryLight, color: APP_CONFIG.colors.primary }}
                  >
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-gray-900">{t('securitySheet.helperTitle')}</h3>
                    <p className="text-[12px] text-gray-500">{t('securitySheet.helperDescription')}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { key: 'minLength', label: t('securitySheet.ruleMinLength') },
                    { key: 'hasUppercase', label: t('securitySheet.ruleUppercase') },
                    { key: 'hasNumber', label: t('securitySheet.ruleNumber') },
                    { key: 'matches', label: t('securitySheet.ruleMatch') },
                  ].map((rule) => {
                    const isComplete = passwordChecks[rule.key as keyof typeof passwordChecks];

                    return (
                      <div key={rule.key} className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-3">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full ${
                            isComplete ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'
                          }`}
                        >
                          {isComplete ? <Check className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                        </span>
                        <span className="text-[13px] font-medium text-gray-700">{rule.label}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
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
      </div>
    </div>
  );
};
