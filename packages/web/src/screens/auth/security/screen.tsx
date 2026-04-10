import type { ComponentProps } from 'react';
import { ViewerSecurityPage } from '../shared/viewer-security-page';

export type MarketplaceSecurityScreenProps = ComponentProps<typeof ViewerSecurityPage>;

export function MarketplaceSecurityScreen(props: MarketplaceSecurityScreenProps) {
  return <ViewerSecurityPage {...props} />;
}
