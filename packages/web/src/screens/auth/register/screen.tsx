import type { ComponentProps } from 'react';
import { ViewerAuthPage } from '../shared/viewer-auth-page';

export type MarketplaceRegisterScreenProps = Omit<ComponentProps<typeof ViewerAuthPage>, 'mode'>;

export function MarketplaceRegisterScreen(props: MarketplaceRegisterScreenProps) {
  return <ViewerAuthPage {...props} mode="register" />;
}
