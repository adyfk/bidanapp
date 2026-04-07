import { createBidanappApiClient, fetchCatalog, fetchProfessionalBySlug } from '@bidanapp/sdk';
import type { Metadata } from 'next';
import { cache } from 'react';
import { getBackendApiBaseUrl } from '@/lib/backend';
import { normalizeProfessional } from '@/lib/catalog-normalizers';
import { getProfessionalCategoryLabel } from '@/lib/catalog-selectors';
import { APP_CONFIG } from '@/lib/config';
import type { ProfessionalPublicSection } from '@/lib/routes';
import type { Area, Category, GlobalService, Professional } from '@/types/catalog';

const requestTimeoutMs = 1500;
const client = createBidanappApiClient(getBackendApiBaseUrl());

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number) =>
  new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(new Error('Professional storefront request timed out')), timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeoutId);
        reject(error);
      },
    );
  });

const toNumberFromPriceLabel = (priceLabel: string) => Number.parseInt(priceLabel.replace(/\D/g, ''), 10) || 0;

const buildLocalizedList = (values: string[], locale: string) => {
  if (values.length === 0) {
    return '';
  }

  return new Intl.ListFormat(locale === 'id' ? 'id-ID' : 'en-US', {
    style: 'long',
    type: 'conjunction',
  }).format(values);
};

const formatCurrency = (amount: number, locale: string) =>
  new Intl.NumberFormat(locale === 'id' ? 'id-ID' : 'en-US', {
    currency: 'IDR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(amount);

export interface ProfessionalMarketplaceServiceEntry {
  catalogService: GlobalService;
  serviceMapping: Professional['services'][number];
}

export interface ProfessionalMarketplaceFaqEntry {
  answer: string;
  question: string;
}

export interface ProfessionalMarketplaceCopy {
  aboutNav: string;
  aboutSection: string;
  availability: string;
  bookingHelper: string;
  bookNow: string;
  bookService: string;
  bookingSurfaceTitle: string;
  breadcrumbHome: string;
  breadcrumbProfessionals: string;
  coverageLabel: string;
  credentialsSection: string;
  featuredServices: string;
  fromPrice: string;
  languagesLabel: string;
  overviewNav: string;
  portfolioSection: string;
  practiceSection: string;
  professionalLabel: string;
  responseTime: string;
  reviewsNav: string;
  reviewsSection: string;
  servicesNav: string;
  servicesSection: string;
  stickyBookLabel: string;
  storiesSection: string;
  trustSection: string;
}

export interface ProfessionalPublicPageData {
  areas: Area[];
  categories: Category[];
  coverageAreas: Area[];
  faqEntries: ProfessionalMarketplaceFaqEntry[];
  featuredMetrics: Professional['feedbackMetrics'];
  featuredServices: ProfessionalMarketplaceServiceEntry[];
  featuredTestimonials: Professional['testimonials'];
  minimumPriceLabel: string | null;
  offeredServices: ProfessionalMarketplaceServiceEntry[];
  practiceLocationLabel: string;
  proCategory: string;
  professional: Professional;
  services: GlobalService[];
}

export const getProfessionalMarketplaceCopy = (locale: string): ProfessionalMarketplaceCopy =>
  locale === 'id'
    ? {
        aboutNav: 'Tentang',
        aboutSection: 'Cerita profesional',
        availability: 'Ketersediaan',
        bookingHelper: 'Pilih layanan untuk melihat mode, harga, dan langkah booking terbaik.',
        bookNow: 'Mulai booking',
        bookService: 'Book layanan ini',
        bookingSurfaceTitle: 'Booking dengan profesional ini',
        breadcrumbHome: 'Beranda',
        breadcrumbProfessionals: 'Profesional',
        coverageLabel: 'Jangkauan layanan',
        credentialsSection: 'Sertifikasi dan legalitas',
        featuredServices: 'Layanan unggulan',
        fromPrice: 'Mulai dari',
        languagesLabel: 'Bahasa',
        overviewNav: 'Overview',
        portfolioSection: 'Portofolio hasil kerja',
        practiceSection: 'Praktik dan area layanan',
        professionalLabel: 'Profesional',
        responseTime: 'Respon',
        reviewsNav: 'Review',
        reviewsSection: 'Ulasan keluarga',
        servicesNav: 'Layanan',
        servicesSection: 'Semua layanan',
        stickyBookLabel: 'Buka layanan & booking',
        storiesSection: 'Aktivitas terbaru',
        trustSection: 'Trust highlights',
      }
    : {
        aboutNav: 'About',
        aboutSection: 'Professional story',
        availability: 'Availability',
        bookingHelper: 'Choose a service to review delivery mode, pricing, and the best booking path.',
        bookNow: 'Start booking',
        bookService: 'Book this service',
        bookingSurfaceTitle: 'Book with this professional',
        breadcrumbHome: 'Home',
        breadcrumbProfessionals: 'Professionals',
        coverageLabel: 'Coverage',
        credentialsSection: 'Credentials and compliance',
        featuredServices: 'Featured services',
        fromPrice: 'Starts from',
        languagesLabel: 'Languages',
        overviewNav: 'Overview',
        portfolioSection: 'Proof of work',
        practiceSection: 'Practice and coverage',
        professionalLabel: 'Professional',
        responseTime: 'Response',
        reviewsNav: 'Reviews',
        reviewsSection: 'Client reviews',
        servicesNav: 'Services',
        servicesSection: 'All services',
        stickyBookLabel: 'Open services and booking',
        storiesSection: 'Recent activity',
        trustSection: 'Trust highlights',
      };

const buildFaqEntries = ({
  coverageAreas,
  locale,
  offeredServices,
  practiceLocationLabel,
  professional,
  proCategory,
}: {
  coverageAreas: Area[];
  locale: string;
  offeredServices: ProfessionalMarketplaceServiceEntry[];
  practiceLocationLabel: string;
  professional: Professional;
  proCategory: string;
}) => {
  const serviceNames = offeredServices.slice(0, 4).map(({ catalogService }) => catalogService.name);
  const coveredAreaLabels = coverageAreas.map((area) => area.label);

  if (locale === 'id') {
    return [
      {
        question: `Layanan apa yang bisa dibooking dengan ${professional.name}?`,
        answer:
          serviceNames.length > 0
            ? `${professional.name} menawarkan ${buildLocalizedList(serviceNames, locale)} dengan flow booking yang sudah disesuaikan di halaman layanan.`
            : `${professional.name} menyiapkan profil ${proCategory} ini sebagai surface konsultasi dan booking.`,
      },
      {
        question: `Seberapa cepat ${professional.name} biasanya merespons?`,
        answer: `${professional.name} menargetkan waktu respons ${professional.responseTime} dan saat ini ${
          professional.availability.isAvailable ? 'sedang menerima klien baru' : 'belum membuka slot baru'
        }.`,
      },
      {
        question: `Area layanan ${professional.name} mencakup di mana saja?`,
        answer:
          coveredAreaLabels.length > 0
            ? `Jangkauan utama saat ini meliputi ${buildLocalizedList(coveredAreaLabels, locale)} dengan titik praktik di ${practiceLocationLabel}.`
            : `${professional.name} saat ini menonjolkan layanan ${
                professional.services.some((service) => service.serviceModes.online) ? 'online' : 'berbasis praktik'
              } dari ${practiceLocationLabel}.`,
      },
    ];
  }

  return [
    {
      question: `What can clients book with ${professional.name}?`,
      answer:
        serviceNames.length > 0
          ? `${professional.name} currently offers ${buildLocalizedList(serviceNames, locale)} with booking flows surfaced on the services page.`
          : `${professional.name} uses this ${proCategory.toLowerCase()} page as a consultation and booking storefront.`,
    },
    {
      question: `How quickly does ${professional.name} respond?`,
      answer: `${professional.name} targets a response time of ${professional.responseTime} and is ${
        professional.availability.isAvailable
          ? 'currently accepting new clients'
          : 'not opening new availability right now'
      }.`,
    },
    {
      question: `Which areas does ${professional.name} cover?`,
      answer:
        coveredAreaLabels.length > 0
          ? `Primary coverage currently includes ${buildLocalizedList(coveredAreaLabels, locale)} with the main practice point at ${practiceLocationLabel}.`
          : `${professional.name} currently highlights ${
              professional.services.some((service) => service.serviceModes.online) ? 'online-first' : 'practice-based'
            } delivery from ${practiceLocationLabel}.`,
    },
  ];
};

const loadProfessionalPublicPageData = async (
  slug: string,
  locale: string,
): Promise<ProfessionalPublicPageData | null> => {
  try {
    const [catalogPayload, professionalPayload] = await Promise.all([
      withTimeout(fetchCatalog(client), requestTimeoutMs),
      withTimeout(fetchProfessionalBySlug(client, slug), requestTimeoutMs),
    ]);

    const areas = catalogPayload.areas as Area[];
    const categories = catalogPayload.categories as Category[];
    const services = catalogPayload.services as unknown as GlobalService[];
    const professional = normalizeProfessional(professionalPayload);
    const offeredServices = professional.services.flatMap<ProfessionalMarketplaceServiceEntry>((serviceMapping) => {
      const catalogService = services.find((service) => service.id === serviceMapping.serviceId);

      return catalogService ? [{ catalogService, serviceMapping }] : [];
    });
    const coverageAreas = professional.coverage.areaIds
      .map((areaId) => areas.find((area) => area.id === areaId))
      .filter((area): area is Area => Boolean(area));
    const minimumPrice = offeredServices.reduce<number | null>((lowestPrice, entry) => {
      const nextPrice = toNumberFromPriceLabel(entry.serviceMapping.price);

      if (!nextPrice) {
        return lowestPrice;
      }

      if (lowestPrice === null) {
        return nextPrice;
      }

      return Math.min(lowestPrice, nextPrice);
    }, null);
    const proCategory =
      getProfessionalCategoryLabel({
        categories,
        professional,
        services,
      }) || getProfessionalMarketplaceCopy(locale).professionalLabel;
    const practiceLocationLabel = professional.practiceLocation?.label || professional.location;

    return {
      areas,
      categories,
      coverageAreas,
      faqEntries: buildFaqEntries({
        coverageAreas,
        locale,
        offeredServices,
        practiceLocationLabel,
        professional,
        proCategory,
      }),
      featuredMetrics: professional.feedbackMetrics.slice(0, 3),
      featuredServices: offeredServices.slice(0, 3),
      featuredTestimonials: professional.testimonials.slice(0, 3),
      minimumPriceLabel: minimumPrice ? formatCurrency(minimumPrice, locale) : null,
      offeredServices,
      practiceLocationLabel,
      proCategory,
      professional,
      services,
    };
  } catch {
    return null;
  }
};

export const getProfessionalPublicPageData = cache(loadProfessionalPublicPageData);

const buildPageTitle = ({
  copy,
  pageData,
  section,
}: {
  copy: ProfessionalMarketplaceCopy;
  pageData: ProfessionalPublicPageData;
  section: ProfessionalPublicSection;
}) => {
  if (section === 'services') {
    return `${pageData.professional.name} ${copy.servicesNav}`;
  }

  if (section === 'reviews') {
    return `${pageData.professional.name} ${copy.reviewsNav}`;
  }

  if (section === 'about') {
    return `${pageData.professional.name} ${copy.aboutNav}`;
  }

  return `${pageData.professional.name} - ${pageData.proCategory}`;
};

const buildPageDescription = ({
  copy,
  locale,
  pageData,
  section,
}: {
  copy: ProfessionalMarketplaceCopy;
  locale: string;
  pageData: ProfessionalPublicPageData;
  section: ProfessionalPublicSection;
}) => {
  if (section === 'services') {
    const featuredServiceNames = pageData.featuredServices.map(({ catalogService }) => catalogService.name);

    return featuredServiceNames.length > 0
      ? `${copy.featuredServices}: ${featuredServiceNames.join(', ')}. ${copy.bookingHelper}`
      : pageData.professional.about;
  }

  if (section === 'reviews') {
    return locale === 'id'
      ? `${pageData.professional.name} memiliki rating ${pageData.professional.rating.toFixed(1)} dengan ${
          pageData.professional.reviews
        }, lengkap dengan sinyal rekomendasi dan klien kembali.`
      : `${pageData.professional.name} has a ${pageData.professional.rating.toFixed(1)} rating with ${
          pageData.professional.reviews
        } reviews, plus repeat-client and recommendation signals.`;
  }

  if (section === 'about') {
    return locale === 'id'
      ? `${pageData.professional.name} membagikan kredensial, portofolio, jangkauan layanan, dan detail praktik untuk membantu keluarga menilai kecocokan dan trust.`
      : `${pageData.professional.name} shares credentials, portfolio, coverage, and practice details for clients evaluating fit and trust.`;
  }

  return pageData.professional.about;
};

const buildSectionPath = (slug: string, section: ProfessionalPublicSection) =>
  section === 'overview' ? `/p/${slug}` : `/p/${slug}/${section}`;

export const buildProfessionalPageMetadata = ({
  locale,
  pageData,
  section,
}: {
  locale: string;
  pageData: ProfessionalPublicPageData;
  section: ProfessionalPublicSection;
}): Metadata => {
  const copy = getProfessionalMarketplaceCopy(locale);
  const title = buildPageTitle({
    copy,
    pageData,
    section,
  });
  const description = buildPageDescription({
    copy,
    locale,
    pageData,
    section,
  });
  const pathname = buildSectionPath(pageData.professional.slug, section);

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}${pathname}`,
      languages: {
        en: `/en${pathname}`,
        id: `/id${pathname}`,
      },
    },
    openGraph: {
      title,
      description,
      url: new URL(`/${locale}${pathname}`, APP_CONFIG.baseUrl).toString(),
      images: [pageData.professional.coverImage || pageData.professional.image || APP_CONFIG.ogImage],
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [pageData.professional.coverImage || pageData.professional.image || APP_CONFIG.ogImage],
    },
  };
};

export const buildProfessionalStructuredData = ({
  locale,
  pageData,
  section,
}: {
  locale: string;
  pageData: ProfessionalPublicPageData;
  section: ProfessionalPublicSection;
}) => {
  const copy = getProfessionalMarketplaceCopy(locale);
  const pathname = buildSectionPath(pageData.professional.slug, section);
  const pageUrl = new URL(`/${locale}${pathname}`, APP_CONFIG.baseUrl).toString();
  const overviewUrl = new URL(`/${locale}/p/${pageData.professional.slug}`, APP_CONFIG.baseUrl).toString();
  const numericReviewCount = Number.parseInt(pageData.professional.reviews.replace(/\D/g, ''), 10) || 0;
  const breadcrumbItems = [
    {
      '@type': 'ListItem',
      item: new URL(`/${locale}/home`, APP_CONFIG.baseUrl).toString(),
      name: getProfessionalMarketplaceCopy(locale).breadcrumbHome,
      position: 1,
    },
    {
      '@type': 'ListItem',
      item: new URL(`/${locale}/explore`, APP_CONFIG.baseUrl).toString(),
      name: getProfessionalMarketplaceCopy(locale).breadcrumbProfessionals,
      position: 2,
    },
    {
      '@type': 'ListItem',
      item: overviewUrl,
      name: pageData.professional.name,
      position: 3,
    },
  ];

  if (section !== 'overview') {
    breadcrumbItems.push({
      '@type': 'ListItem',
      item: pageUrl,
      name: section === 'services' ? copy.servicesNav : section === 'reviews' ? copy.reviewsNav : copy.aboutNav,
      position: 4,
    });
  }

  const personData = {
    '@type': 'Person',
    '@id': `${overviewUrl}#person`,
    description: pageData.professional.about,
    image: pageData.professional.image,
    jobTitle: pageData.professional.title,
    knowsLanguage: pageData.professional.languages,
    name: pageData.professional.name,
    url: overviewUrl,
    ...(numericReviewCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingCount: numericReviewCount,
            ratingValue: pageData.professional.rating.toFixed(1),
            reviewCount: numericReviewCount,
          },
        }
      : {}),
  };

  const data: Array<Record<string, unknown>> = [
    {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      '@id': `${pageUrl}#page`,
      about: {
        '@id': `${overviewUrl}#person`,
      },
      breadcrumb: {
        '@id': `${pageUrl}#breadcrumb`,
      },
      description: buildPageDescription({
        copy,
        locale,
        pageData,
        section,
      }),
      name: buildPageTitle({
        copy,
        pageData,
        section,
      }),
      primaryImageOfPage: pageData.professional.coverImage || pageData.professional.image,
      url: pageUrl,
    },
    {
      '@context': 'https://schema.org',
      ...personData,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      '@id': `${pageUrl}#breadcrumb`,
      itemListElement: breadcrumbItems,
    },
  ];

  if (section === 'overview' && pageData.faqEntries.length > 0) {
    data.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: pageData.faqEntries.map((entry) => ({
        '@type': 'Question',
        acceptedAnswer: {
          '@type': 'Answer',
          text: entry.answer,
        },
        name: entry.question,
      })),
    });
  }

  if (section === 'services') {
    data.push({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: pageData.offeredServices.map((entry, index) => ({
        '@type': 'ListItem',
        item: {
          '@type': 'Service',
          description: entry.serviceMapping.summary || entry.catalogService.shortDescription,
          name: entry.catalogService.name,
          offers: entry.serviceMapping.price
            ? {
                '@type': 'Offer',
                price: toNumberFromPriceLabel(entry.serviceMapping.price),
                priceCurrency: 'IDR',
              }
            : undefined,
          provider: {
            '@id': `${overviewUrl}#person`,
          },
        },
        position: index + 1,
      })),
      name: `${pageData.professional.name} services`,
    });
  }

  return data;
};
