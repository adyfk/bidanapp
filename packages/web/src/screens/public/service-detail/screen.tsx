import type { ComponentProps } from 'react';
import { MarketplaceOfferingDetailView } from './view';

export type MarketplaceOfferingDetailScreenProps = ComponentProps<typeof MarketplaceOfferingDetailView>;

export function MarketplaceOfferingDetailScreen(props: MarketplaceOfferingDetailScreenProps) {
  return <MarketplaceOfferingDetailView {...props} />;
}
