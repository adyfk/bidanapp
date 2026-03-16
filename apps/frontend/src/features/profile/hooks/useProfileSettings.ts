'use client';

import { useState } from 'react';
import { ACTIVE_CONSUMER } from '@/lib/mock-db/runtime';

export type ProfileSheetKey = 'account' | 'security' | null;
export type ProfileSaveState = 'idle' | 'success' | 'error';
export type ProfileSaveErrorKey = 'nameRequired' | 'phoneRequired' | 'supportContactIncomplete' | null;
export type PasswordSaveErrorKey = 'currentRequired' | 'newPasswordWeak' | 'confirmMismatch' | null;

export interface ProfileDraft {
  fullName: string;
  phone: string;
  careFocus: string;
  supportContactName: string;
  supportContactRelation: string;
  supportContactPhone: string;
}

export interface PasswordDraft {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const initialProfileDraft: ProfileDraft = {
  fullName: ACTIVE_CONSUMER.name,
  phone: ACTIVE_CONSUMER.phone,
  careFocus: 'Pendampingan rumah, edukasi keluarga, dan follow-up terjadwal.',
  supportContactName: '',
  supportContactRelation: '',
  supportContactPhone: '',
};

const initialPasswordDraft: PasswordDraft = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

const sanitizePhone = (value: string) => value.replace(/[^\d+\s()-]/g, '');
const hasValue = (value: string) => value.trim().length > 0;

export const useProfileSettings = () => {
  const [activeSheet, setActiveSheet] = useState<ProfileSheetKey>(null);
  const [profileDraft, setProfileDraft] = useState<ProfileDraft>(initialProfileDraft);
  const [passwordDraft, setPasswordDraft] = useState<PasswordDraft>(initialPasswordDraft);
  const [profileSaveState, setProfileSaveState] = useState<ProfileSaveState>('idle');
  const [profileErrorKey, setProfileErrorKey] = useState<ProfileSaveErrorKey>(null);
  const [passwordSaveState, setPasswordSaveState] = useState<ProfileSaveState>('idle');
  const [passwordErrorKey, setPasswordErrorKey] = useState<PasswordSaveErrorKey>(null);

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
      [field]: field === 'phone' || field === 'supportContactPhone' ? sanitizePhone(String(value)) : value,
    }));
  };

  const saveProfile = () => {
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

    const hasAnySupportField = [
      profileDraft.supportContactName,
      profileDraft.supportContactRelation,
      profileDraft.supportContactPhone,
    ].some(hasValue);

    const hasEverySupportField = [
      profileDraft.supportContactName,
      profileDraft.supportContactRelation,
      profileDraft.supportContactPhone,
    ].every(hasValue);

    if (hasAnySupportField && !hasEverySupportField) {
      setProfileSaveState('error');
      setProfileErrorKey('supportContactIncomplete');
      return false;
    }

    setProfileSaveState('success');
    setProfileErrorKey(null);
    return true;
  };

  const updatePasswordField = <K extends keyof PasswordDraft>(field: K, value: PasswordDraft[K]) => {
    setPasswordSaveState('idle');
    setPasswordErrorKey(null);

    setPasswordDraft((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const savePassword = () => {
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

    setPasswordSaveState('success');
    setPasswordErrorKey(null);
    setPasswordDraft(initialPasswordDraft);
    return true;
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
