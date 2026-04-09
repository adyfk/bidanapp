'use client';

import { createProfessionalWorkspaceController } from '@marketplace/marketplace-core';
import { useMemo } from 'react';

export function useProfessionalWorkspaceController() {
  return useMemo(() => createProfessionalWorkspaceController(), []);
}
