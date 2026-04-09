import type { ComponentProps } from 'react';
import { MarketplaceExploreView } from './view';

export type MarketplaceExploreScreenProps = ComponentProps<typeof MarketplaceExploreView>;

export function MarketplaceExploreScreen(props: MarketplaceExploreScreenProps) {
  return <MarketplaceExploreView {...props} />;
}
