'use client';

import { createDirectoryController } from '@marketplace/marketplace-core/directory';
import { createNotificationFeedController } from '@marketplace/marketplace-core/notifications';
import { createOrderFlowController } from '@marketplace/marketplace-core/orders';
import { createSupportFlowController } from '@marketplace/marketplace-core/support';
import { createViewerAuthController } from '@marketplace/marketplace-core/viewer-auth';
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
