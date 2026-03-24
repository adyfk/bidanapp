'use client';

const professionalAuthSessionHintStorageKey = 'bidanapp:professional-auth-session-hint';
const professionalAuthSessionHintEventName = 'bidanapp:professional-auth-session-hint-change';

const isBrowser = () => typeof window !== 'undefined';

export const hasProfessionalAuthSessionHint = () => {
  if (!isBrowser()) {
    return false;
  }

  return window.localStorage.getItem(professionalAuthSessionHintStorageKey) === '1';
};

export const markProfessionalAuthSessionHint = (isAuthenticated: boolean) => {
  if (!isBrowser()) {
    return;
  }

  if (isAuthenticated) {
    window.localStorage.setItem(professionalAuthSessionHintStorageKey, '1');
  } else {
    window.localStorage.removeItem(professionalAuthSessionHintStorageKey);
  }

  window.dispatchEvent(new Event(professionalAuthSessionHintEventName));
};

export const clearProfessionalAuthSessionHint = () => {
  markProfessionalAuthSessionHint(false);
};

export const subscribeProfessionalAuthSessionHint = (listener: () => void) => {
  if (!isBrowser()) {
    return () => {};
  }

  window.addEventListener(professionalAuthSessionHintEventName, listener);

  return () => {
    window.removeEventListener(professionalAuthSessionHintEventName, listener);
  };
};
