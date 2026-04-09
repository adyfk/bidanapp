import type { ComponentProps } from 'react';
import { ViewerAuthPage } from '../shared/view';

export type MarketplaceForgotPasswordScreenProps = Omit<ComponentProps<typeof ViewerAuthPage>, 'mode'>;

export function MarketplaceForgotPasswordScreen(props: MarketplaceForgotPasswordScreenProps) {
  return <ViewerAuthPage {...props} mode="forgot-password" />;
}
