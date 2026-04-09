import type { ComponentProps } from 'react';
import { CustomerSupportPage } from './view';

export type MarketplaceSupportScreenProps = ComponentProps<typeof CustomerSupportPage>;

export function MarketplaceSupportScreen(props: MarketplaceSupportScreenProps) {
  return <CustomerSupportPage {...props} />;
}
