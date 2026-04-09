'use client';

import { createDirectoryController } from '@marketplace/marketplace-core';
import { useMemo } from 'react';

export function usePublicMarketplaceController() {
  return useMemo(() => createDirectoryController(), []);
}
