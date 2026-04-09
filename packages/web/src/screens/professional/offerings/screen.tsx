import type { ComponentProps } from 'react';
import { ProfessionalOfferingsPage } from './view';

export type MarketplaceProfessionalOfferingsScreenProps = ComponentProps<typeof ProfessionalOfferingsPage>;

export function MarketplaceProfessionalOfferingsScreen(props: MarketplaceProfessionalOfferingsScreenProps) {
  return <ProfessionalOfferingsPage {...props} />;
}
