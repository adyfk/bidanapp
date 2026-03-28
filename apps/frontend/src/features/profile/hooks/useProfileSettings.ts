'use client';

import { useEffect, useState } from 'react';
import { sanitizePhoneValue } from '@/lib/form-input';
import { useAppShell } from '@/lib/use-app-shell';
import type { CustomerAuthSessionState } from '@/types/customer-auth';

export type ProfileSheetKey = 'account' | 'security' | null;
export type ProfileSaveState = 'idle' | 'success' | 'error';
export type ProfileSaveErrorKey = 'nameRequired' | 'phoneRequired' | 'saveFailed' | null;
export type PasswordSaveErrorKey = 'currentRequired' | 'newPasswordWeak' | 'confirmMismatch' | 'saveFailed' | null;

export interface ProfileDraft {
  city: string;
  fullName: string;
  phone: string;
}

export interface PasswordDraft {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const buildInitialProfileDraft = (fullName: string, phone: string, city: string): ProfileDraft => ({
  city,
  fullName,
  phone,
});

const initialPasswordDraft: PasswordDraft = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

const hasValue = (value: string) => value.trim().length > 0;

interface UseProfileSettingsOptions {
  customerSession: CustomerAuthSessionState;
  updateAccount: (input: {
    city?: string;
    displayName: string;
    phone: string;
  }) => Promise<CustomerAuthSessionState | undefined>;
  updatePassword: (input: {
    currentPassword: string;
    newPassword: string;
  }) => Promise<CustomerAuthSessionState | undefined>;
}

export const useProfileSettings = ({ customerSession, updateAccount, updatePassword }: UseProfileSettingsOptions) => {
  const { currentConsumer } = useAppShell();
  const [activeSheet, setActiveSheet] = useState<ProfileSheetKey>(null);
  const [profileDraft, setProfileDraft] = useState<ProfileDraft>(() =>
    buildInitialProfileDraft(currentConsumer.name, currentConsumer.phone, customerSession.city || ''),
  );
  const [passwordDraft, setPasswordDraft] = useState<PasswordDraft>(initialPasswordDraft);
  const [profileSaveState, setProfileSaveState] = useState<ProfileSaveState>('idle');
  const [profileErrorKey, setProfileErrorKey] = useState<ProfileSaveErrorKey>(null);
  const [passwordSaveState, setPasswordSaveState] = useState<ProfileSaveState>('idle');
  const [passwordErrorKey, setPasswordErrorKey] = useState<PasswordSaveErrorKey>(null);

  useEffect(() => {
    setProfileDraft((current) => ({
      ...current,
      city: customerSession.city || '',
      fullName: currentConsumer.name,
      phone: currentConsumer.phone,
    }));
  }, [currentConsumer.name, currentConsumer.phone, customerSession.city]);

  const passwordChecks = {
    minLength: passwordDraft.newPassword.length >= 8,
    hasUppercase: /[A-Z]/.test(passwordDraft.newPassword),
    hasNumber: /\d/.test(passwordDraft.newPassword),
    matches: passwordDraft.confirmPassword.length > 0 && passwordDraft.confirmPassword === passwordDraft.newPassword,
  };

  const openSheet = (sheet: Exclude<ProfileSheetKey, null>) => setActiveSheet(sheet);
  const closeSheet = () => setActiveSheet(null);

  const updateProfileField = <K extends keyof ProfileDraft>(field: K, value: ProfileDraft[K]) => {
    setProfileSaveState('idle');
    setProfileErrorKey(null);

    setProfileDraft((current) => ({
      ...current,
      [field]: field === 'phone' ? sanitizePhoneValue(String(value)) : value,
    }));
  };

  const saveProfile = async () => {
    if (!hasValue(profileDraft.fullName)) {
      setProfileSaveState('error');
      setProfileErrorKey('nameRequired');
      return false;
    }

    if (!hasValue(profileDraft.phone)) {
      setProfileSaveState('error');
      setProfileErrorKey('phoneRequired');
      return false;
    }

    try {
      const nextSession = await updateAccount({
        city: profileDraft.city.trim(),
        displayName: profileDraft.fullName.trim(),
        phone: profileDraft.phone.trim(),
      });
      if (!nextSession) {
        throw new Error('customer profile sync failed');
      }

      setProfileDraft((current) => ({
        ...current,
        city: nextSession.city || '',
        fullName: nextSession.displayName,
        phone: nextSession.phone,
      }));
      setProfileSaveState('success');
      setProfileErrorKey(null);
      return true;
    } catch {
      setProfileSaveState('error');
      setProfileErrorKey('saveFailed');
      return false;
    }
  };

  const updatePasswordField = <K extends keyof PasswordDraft>(field: K, value: PasswordDraft[K]) => {
    setPasswordSaveState('idle');
    setPasswordErrorKey(null);

    setPasswordDraft((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const savePassword = async () => {
    if (!hasValue(passwordDraft.currentPassword)) {
      setPasswordSaveState('error');
      setPasswordErrorKey('currentRequired');
      return false;
    }

    if (!passwordChecks.minLength || !passwordChecks.hasUppercase || !passwordChecks.hasNumber) {
      setPasswordSaveState('error');
      setPasswordErrorKey('newPasswordWeak');
      return false;
    }

    if (!passwordChecks.matches) {
      setPasswordSaveState('error');
      setPasswordErrorKey('confirmMismatch');
      return false;
    }

    try {
      const nextSession = await updatePassword({
        currentPassword: passwordDraft.currentPassword,
        newPassword: passwordDraft.newPassword,
      });
      if (!nextSession) {
        throw new Error('customer password sync failed');
      }

      setPasswordSaveState('success');
      setPasswordErrorKey(null);
      setPasswordDraft(initialPasswordDraft);
      return true;
    } catch {
      setPasswordSaveState('error');
      setPasswordErrorKey('saveFailed');
      return false;
    }
  };

  return {
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
  };
};
