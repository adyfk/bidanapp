import type { ComponentProps } from 'react';
import { MarketplaceOnboardingView } from './view';

export type MarketplaceOnboardingScreenProps = ComponentProps<typeof MarketplaceOnboardingView>;

export function MarketplaceOnboardingScreen(props: MarketplaceOnboardingScreenProps) {
  return <MarketplaceOnboardingView {...props} />;
}
