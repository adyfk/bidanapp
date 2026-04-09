'use client';

import {
  createDirectoryController,
  createNotificationFeedController,
  createOrderFlowController,
  createSupportFlowController,
  createViewerAuthController,
} from '@marketplace/marketplace-core';
import { useMemo } from 'react';

export function useCustomerMarketplaceController() {
  return useMemo(
    () => ({
      directory: createDirectoryController(),
      notifications: createNotificationFeedController(),
      orders: createOrderFlowController(),
      support: createSupportFlowController(),
      viewerAuth: createViewerAuthController(),
    }),
    [],
  );
}
