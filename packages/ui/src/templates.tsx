import type { ReactNode } from 'react';
import { MarketplaceMobileShell, type MarketplaceNavItem } from './marketplace';
import { AppShell } from './patterns';

export function MarketplacePublicTemplate({
  children,
  navItems,
  activeNavId,
  showNav = true,
}: {
  activeNavId?: string;
  children: ReactNode;
  navItems?: MarketplaceNavItem[];
  showNav?: boolean;
}) {
  return (
    <MarketplaceMobileShell activeNavId={activeNavId} navItems={navItems} showNav={showNav}>
      {children}
    </MarketplaceMobileShell>
  );
}

export function MarketplaceCustomerTemplate(props: {
  activeNavId?: string;
  children: ReactNode;
  navItems?: MarketplaceNavItem[];
  showNav?: boolean;
}) {
  return <MarketplacePublicTemplate {...props} />;
}

export function MarketplaceProfessionalTemplate(props: {
  activeNavId?: string;
  children: ReactNode;
  navItems?: MarketplaceNavItem[];
  showNav?: boolean;
}) {
  return <MarketplacePublicTemplate {...props} />;
}

export function MarketplaceAdminTemplate({
  actions,
  children,
  description,
  eyebrow,
  title,
}: {
  actions?: ReactNode;
  children: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <AppShell actions={actions} description={description} eyebrow={eyebrow} title={title}>
      {children}
    </AppShell>
  );
}
