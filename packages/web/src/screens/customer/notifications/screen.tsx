import type { ComponentProps } from 'react';
import { CustomerNotificationsPage } from './view';

export type MarketplaceNotificationsScreenProps = ComponentProps<typeof CustomerNotificationsPage>;

export function MarketplaceNotificationsScreen(props: MarketplaceNotificationsScreenProps) {
  return <CustomerNotificationsPage {...props} />;
}
