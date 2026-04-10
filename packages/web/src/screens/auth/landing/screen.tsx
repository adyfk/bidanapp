import type { ComponentProps } from 'react';
import { AuthLandingPage } from '../shared/auth-landing-page';

export type MarketplaceAuthLandingScreenProps = ComponentProps<typeof AuthLandingPage>;

export function MarketplaceAuthLandingScreen(props: MarketplaceAuthLandingScreenProps) {
  return <AuthLandingPage {...props} />;
}
