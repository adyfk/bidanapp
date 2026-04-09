import type { ComponentProps } from 'react';
import { MarketplaceHomeView } from './view';

export type MarketplaceHomeScreenProps = ComponentProps<typeof MarketplaceHomeView>;

export function MarketplaceHomeScreen(props: MarketplaceHomeScreenProps) {
  return <MarketplaceHomeView {...props} />;
}
