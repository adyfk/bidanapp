import type { ComponentProps } from 'react';
import { ViewerAuthPage } from '../shared/viewer-auth-page';

export type MarketplaceForgotPasswordScreenProps = Omit<ComponentProps<typeof ViewerAuthPage>, 'mode'>;

export function MarketplaceForgotPasswordScreen(props: MarketplaceForgotPasswordScreenProps) {
  return <ViewerAuthPage {...props} mode="forgot-password" />;
}
