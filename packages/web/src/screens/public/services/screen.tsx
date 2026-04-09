import type { ComponentProps } from 'react';
import { MarketplaceServicesView } from './view';

export type MarketplaceServicesScreenProps = ComponentProps<typeof MarketplaceServicesView>;

export function MarketplaceServicesScreen(props: MarketplaceServicesScreenProps) {
  return <MarketplaceServicesView {...props} />;
}
