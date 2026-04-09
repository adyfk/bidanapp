import type { ComponentProps } from 'react';
import { OrdersPage } from './view';

export type MarketplaceOrdersScreenProps = ComponentProps<typeof OrdersPage>;

export function MarketplaceOrdersScreen(props: MarketplaceOrdersScreenProps) {
  return <OrdersPage {...props} />;
}
