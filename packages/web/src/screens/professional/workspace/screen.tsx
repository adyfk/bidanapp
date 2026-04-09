import type { ComponentProps } from 'react';
import { ProfessionalWorkspacePage } from './view';

export type MarketplaceProfessionalWorkspaceScreenProps = ComponentProps<typeof ProfessionalWorkspacePage>;

export function MarketplaceProfessionalWorkspaceScreen(props: MarketplaceProfessionalWorkspaceScreenProps) {
  return <ProfessionalWorkspacePage {...props} />;
}
