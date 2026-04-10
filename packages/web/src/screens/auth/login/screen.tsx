import type { ComponentProps } from 'react';
import { ViewerAuthPage } from '../shared/viewer-auth-page';

export type MarketplaceLoginScreenProps = Omit<ComponentProps<typeof ViewerAuthPage>, 'mode'>;

export function MarketplaceLoginScreen(props: MarketplaceLoginScreenProps) {
  return <ViewerAuthPage {...props} mode="login" />;
}
