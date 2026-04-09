'use client';

import { createAdminConsoleController } from '@marketplace/marketplace-core';
import { useMemo } from 'react';

export function useAdminConsoleController() {
  return useMemo(() => createAdminConsoleController(), []);
}
