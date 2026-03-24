'use client';

import { useEffect, useState } from 'react';
import { hasAdminAuthSessionHint, subscribeAdminAuthSessionHint } from '@/lib/admin-auth-storage';
import { hydrateAdminConsoleTableFromApi } from '@/lib/app-state-api';
import type { AdminStaffMember } from '@/types/admin';
import type { AdminStaffRow } from '@/types/seed-data';

const adminDirectoryChangeEventName = 'bidanapp:admin-directory-change';
let cachedAdminStaff: AdminStaffMember[] = [];
let hydrateAdminDirectoryPromise: Promise<AdminStaffMember[] | null> | null = null;

const normalizeAdminStaff = (value: unknown): AdminStaffMember[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalizedRows = value.filter(
    (row): row is AdminStaffRow =>
      !!row &&
      typeof row === 'object' &&
      typeof row.id === 'string' &&
      typeof row.email === 'string' &&
      typeof row.focusArea === 'string' &&
      typeof row.name === 'string' &&
      typeof row.phone === 'string' &&
      typeof row.presence === 'string' &&
      typeof row.shiftLabel === 'string' &&
      typeof row.title === 'string',
  );

  if (normalizedRows.length === 0) {
    return [];
  }

  return normalizedRows
    .map((row, index) => ({
      email: row.email,
      focusArea: row.focusArea,
      id: row.id,
      index: typeof row.index === 'number' ? row.index : index + 1,
      name: row.name,
      phone: row.phone,
      presence: row.presence,
      shiftLabel: row.shiftLabel,
      title: row.title,
    }))
    .sort((leftAdmin, rightAdmin) => leftAdmin.index - rightAdmin.index);
};

const writeCachedAdminStaff = (nextAdminStaff: AdminStaffMember[]) => {
  cachedAdminStaff = nextAdminStaff;

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(adminDirectoryChangeEventName));
  }
};

const hydrateAdminDirectoryFromApi = async (): Promise<AdminStaffMember[] | null> => {
  if (!hasAdminAuthSessionHint()) {
    writeCachedAdminStaff([]);
    return [];
  }

  if (hydrateAdminDirectoryPromise) {
    return hydrateAdminDirectoryPromise;
  }

  hydrateAdminDirectoryPromise = hydrateAdminConsoleTableFromApi('admin_staff')
    .then((apiState) => {
      const nextAdminStaff = normalizeAdminStaff(apiState?.rows);

      writeCachedAdminStaff(nextAdminStaff);
      return nextAdminStaff;
    })
    .catch(() => null)
    .finally(() => {
      hydrateAdminDirectoryPromise = null;
    });

  return hydrateAdminDirectoryPromise;
};

export const useAdminDirectory = () => {
  const [adminStaff, setAdminStaff] = useState<AdminStaffMember[]>(cachedAdminStaff);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncAdminStaff = () => {
      setAdminStaff(cachedAdminStaff);
    };

    const handleAuthChange = () => {
      if (!hasAdminAuthSessionHint()) {
        writeCachedAdminStaff([]);
        setAdminStaff([]);
        setHasHydrated(true);
        return;
      }

      void hydrateAdminDirectoryFromApi().finally(() => {
        setHasHydrated(true);
      });
    };

    syncAdminStaff();
    window.addEventListener(adminDirectoryChangeEventName, syncAdminStaff);
    const unsubscribeAuth = subscribeAdminAuthSessionHint(handleAuthChange);

    if (hasAdminAuthSessionHint()) {
      void hydrateAdminDirectoryFromApi().finally(() => {
        setHasHydrated(true);
      });
    } else {
      setHasHydrated(true);
    }

    return () => {
      window.removeEventListener(adminDirectoryChangeEventName, syncAdminStaff);
      unsubscribeAuth();
    };
  }, []);

  return {
    adminStaff,
    hasHydrated,
  };
};
