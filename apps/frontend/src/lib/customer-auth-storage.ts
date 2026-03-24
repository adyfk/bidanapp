'use client';

const customerAuthSessionHintStorageKey = 'bidanapp:customer-auth-session-hint';
const customerAuthSessionHintEventName = 'bidanapp:customer-auth-session-hint-change';

const isBrowser = () => typeof window !== 'undefined';

export const hasCustomerAuthSessionHint = () => {
  if (!isBrowser()) {
    return false;
  }

  return window.localStorage.getItem(customerAuthSessionHintStorageKey) === '1';
};

export const markCustomerAuthSessionHint = (isAuthenticated: boolean) => {
  if (!isBrowser()) {
    return;
  }

  if (isAuthenticated) {
    window.localStorage.setItem(customerAuthSessionHintStorageKey, '1');
  } else {
    window.localStorage.removeItem(customerAuthSessionHintStorageKey);
  }

  window.dispatchEvent(new Event(customerAuthSessionHintEventName));
};

export const clearCustomerAuthSessionHint = () => {
  markCustomerAuthSessionHint(false);
};

export const subscribeCustomerAuthSessionHint = (listener: () => void) => {
  if (!isBrowser()) {
    return () => {};
  }

  window.addEventListener(customerAuthSessionHintEventName, listener);

  return () => {
    window.removeEventListener(customerAuthSessionHintEventName, listener);
  };
};
