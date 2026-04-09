'use client';

import { createViewerAuthController } from '@marketplace/marketplace-core';
import { useMemo } from 'react';

export function useViewerAuthController() {
  return useMemo(() => createViewerAuthController(), []);
}
