import { getDefaultServicePlatformName, type ServicePlatformId } from '@marketplace/platform-config';
import {
  type DirectoryOffering,
  type DirectoryOfferingDetail,
  type DirectoryProfessional,
  type DirectoryProfessionalDetail,
  fetchDirectoryOfferingBySlug,
  fetchDirectoryOfferings,
  fetchDirectoryProfessionalBySlug,
  fetchDirectoryProfessionals,
} from '@marketplace/sdk';
import { deliveryModeLabel, formatCurrency, offeringTypeLabel } from './formatters';

export interface DirectoryQuery {
  keyword?: string;
  platformId: ServicePlatformId;
}

export interface DirectoryProfessionalCardVM {
  coverageLabel: string;
  href: string;
  id: string;
  locationLabel: string;
  metaLabel: string;
  priceLabel: string;
  subtitle: string;
  title: string;
}

export interface DirectoryOfferingCardVM {
  deliveryLabel: string;
  href: string;
  id: string;
  priceLabel: string;
  professionalLabel: string;
  subtitle: string;
  title: string;
  typeLabel: string;
}

export interface DirectoryController {
  fetchOfferingBySlug: typeof fetchDirectoryOfferingBySlug;
  fetchOfferings: typeof fetchDirectoryOfferings;
  fetchProfessionalBySlug: typeof fetchDirectoryProfessionalBySlug;
  fetchProfessionals: typeof fetchDirectoryProfessionals;
}

export function mapDirectoryProfessionalToCardVM(
  professional: DirectoryProfessional,
  locale: string,
): DirectoryProfessionalCardVM {
  const defaultPlatformName = getDefaultServicePlatformName();
  return {
    coverageLabel:
      (professional.coverageAreas ?? []).join(' • ') ||
      (locale === 'en' ? 'Trusted professional' : 'Profesional tepercaya'),
    href: `/${locale}/p/${professional.slug}`,
    id: professional.id,
    locationLabel: professional.city || defaultPlatformName,
    metaLabel: `${professional.offeringCount} ${locale === 'en' ? 'offerings' : 'offering'}`,
    priceLabel: formatCurrency(professional.startingPrice, locale),
    subtitle: professional.city || defaultPlatformName,
    title: professional.displayName,
  };
}

export function mapDirectoryOfferingToCardVM(offering: DirectoryOffering, locale: string): DirectoryOfferingCardVM {
  return {
    deliveryLabel: deliveryModeLabel(offering.deliveryMode, locale),
    href: `/${locale}/s/${offering.slug}`,
    id: offering.id,
    priceLabel: formatCurrency(offering.priceAmount, locale, offering.currency),
    professionalLabel: offering.professionalDisplayName,
    subtitle: offering.description,
    title: offering.title,
    typeLabel: offeringTypeLabel(offering.offeringType, locale),
  };
}

export function createDirectoryController(): DirectoryController {
  return {
    fetchOfferingBySlug: fetchDirectoryOfferingBySlug,
    fetchOfferings: fetchDirectoryOfferings,
    fetchProfessionalBySlug: fetchDirectoryProfessionalBySlug,
    fetchProfessionals: fetchDirectoryProfessionals,
  };
}

export type { DirectoryOffering, DirectoryOfferingDetail, DirectoryProfessional, DirectoryProfessionalDetail };
export {
  fetchDirectoryOfferingBySlug,
  fetchDirectoryOfferings,
  fetchDirectoryProfessionalBySlug,
  fetchDirectoryProfessionals,
};
