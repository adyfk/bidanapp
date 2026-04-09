import type { ComponentProps } from 'react';
import { MarketplaceProfessionalDetailView } from './view';

export type MarketplaceProfessionalDetailScreenProps = ComponentProps<typeof MarketplaceProfessionalDetailView>;

export function MarketplaceProfessionalDetailScreen(props: MarketplaceProfessionalDetailScreenProps) {
  return <MarketplaceProfessionalDetailView {...props} />;
}
