import type { ComponentProps } from 'react';
import { ViewerSecurityPage } from '../shared/view';

export type MarketplaceSecurityScreenProps = ComponentProps<typeof ViewerSecurityPage>;

export function MarketplaceSecurityScreen(props: MarketplaceSecurityScreenProps) {
  return <ViewerSecurityPage {...props} />;
}
