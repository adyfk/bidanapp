import type { ComponentProps } from 'react';
import { CustomerProfilePage } from './view';

export type MarketplaceProfileScreenProps = ComponentProps<typeof CustomerProfilePage>;

export function MarketplaceProfileScreen(props: MarketplaceProfileScreenProps) {
  return <CustomerProfilePage {...props} />;
}
