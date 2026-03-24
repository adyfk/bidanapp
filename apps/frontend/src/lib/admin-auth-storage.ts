'use client';

const adminAuthSessionHintStorageKey = 'bidanapp:admin-auth-session-hint';
const adminAuthSessionHintEventName = 'bidanapp:admin-auth-session-hint-change';

const isBrowser = () => typeof window !== 'undefined';

export const hasAdminAuthSessionHint = () => {
  if (!isBrowser()) {
    return false;
  }

  return window.localStorage.getItem(adminAuthSessionHintStorageKey) === '1';
};

export const markAdminAuthSessionHint = (isAuthenticated: boolean) => {
  if (!isBrowser()) {
    return;
  }

  if (isAuthenticated) {
    window.localStorage.setItem(adminAuthSessionHintStorageKey, '1');
  } else {
    window.localStorage.removeItem(adminAuthSessionHintStorageKey);
  }

  window.dispatchEvent(new Event(adminAuthSessionHintEventName));
};

export const clearAdminAuthSessionHint = () => {
  markAdminAuthSessionHint(false);
};

export const subscribeAdminAuthSessionHint = (listener: () => void) => {
  if (!isBrowser()) {
    return () => {};
  }

  window.addEventListener(adminAuthSessionHintEventName, listener);

  return () => {
    window.removeEventListener(adminAuthSessionHintEventName, listener);
  };
};
