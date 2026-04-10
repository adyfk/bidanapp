'use client';

import { createViewerAuthController } from '@marketplace/marketplace-core/viewer-auth';
import { useMemo } from 'react';

export function useViewerAuthController() {
  return useMemo(() => createViewerAuthController(), []);
}
