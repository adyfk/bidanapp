import type { ComponentProps } from 'react';
import { ViewerSessionsPage } from '../shared/view';

export type MarketplaceSessionsScreenProps = ComponentProps<typeof ViewerSessionsPage>;

export function MarketplaceSessionsScreen(props: MarketplaceSessionsScreenProps) {
  return <ViewerSessionsPage {...props} />;
}
