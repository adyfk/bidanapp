import type { ComponentProps } from 'react';
import { CustomerOrderDetailPage } from './view';

export type MarketplaceOrderDetailScreenProps = ComponentProps<typeof CustomerOrderDetailPage>;

export function MarketplaceOrderDetailScreen(props: MarketplaceOrderDetailScreenProps) {
  return <CustomerOrderDetailPage {...props} />;
}
