import type { ComponentProps } from 'react';
import { ProfessionalApplyPage } from './view';

export type MarketplaceProfessionalApplyScreenProps = ComponentProps<typeof ProfessionalApplyPage>;

export function MarketplaceProfessionalApplyScreen(props: MarketplaceProfessionalApplyScreenProps) {
  return <ProfessionalApplyPage {...props} />;
}
