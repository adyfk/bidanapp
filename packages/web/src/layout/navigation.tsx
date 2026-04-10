import {
  getPlatformCopy,
  type MarketplaceNavItemConfig,
  type ServicePlatformConfig,
} from '@marketplace/platform-config';
import type { MarketplaceNavItem } from '@marketplace/ui/marketplace-lite';
import { Calendar, Compass, Search, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import { createLocalizedPath } from '../lib/platform';

export function createLocaleSwitcherItems(currentPath: string, _locale: string) {
  const basePath = currentPath.replace(/^\/(id|en)/, '') || '';
  return [
    { href: `/id${basePath || ''}`, label: 'ID', value: 'id' },
    { href: `/en${basePath || ''}`, label: 'EN', value: 'en' },
  ].map((item) => ({
    ...item,
    href: item.href === '' ? '/' : item.href,
  }));
}

export function createPrimaryMarketplaceNav(platform: ServicePlatformConfig, locale: string): MarketplaceNavItem[] {
  const copy = getPlatformCopy(platform, locale);
  return copy.navigation.map((item) => ({
    href: createLocalizedPath(locale, item.href),
    icon: renderNavigationIcon(item.icon),
    id: item.id,
    label: item.label,
  }));
}

function renderNavigationIcon(icon: MarketplaceNavItemConfig['icon']): ReactNode {
  switch (icon) {
    case 'search':
      return <Search className="h-[22px] w-[22px]" />;
    case 'compass':
      return <Compass className="h-[22px] w-[22px]" />;
    case 'calendar':
      return <Calendar className="h-[22px] w-[22px]" />;
    default:
      return <Sparkles className="h-[22px] w-[22px]" />;
  }
}
