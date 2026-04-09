import type { ComponentProps } from 'react';
import { AdminLandingPage as LegacyAdminLandingPage } from './view';

export type MarketplaceAdminConsoleScreenProps = ComponentProps<typeof LegacyAdminLandingPage>;

export function MarketplaceAdminConsoleScreen(props: MarketplaceAdminConsoleScreenProps) {
  return <LegacyAdminLandingPage {...props} />;
}
