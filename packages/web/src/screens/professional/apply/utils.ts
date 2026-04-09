'use client';

import type { DirectoryProfessional } from '@marketplace/marketplace-core';
import type { ServicePlatformId } from '@marketplace/platform-config';

export type ApplyLocaleItem = { href: string; label: string; value: string };

export function stringifyApplyValue(value: unknown) {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return '';
}

export function firstApplyLetter(name: string) {
  return name.trim().charAt(0).toUpperCase() || 'B';
}

export function formatApplyCurrency(amount: number, locale: string) {
  return new Intl.NumberFormat(locale.startsWith('id') ? 'id-ID' : 'en-US', {
    currency: locale.startsWith('id') ? 'IDR' : 'USD',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    style: 'currency',
  }).format(amount);
}

export function fallbackPreviewProfessionals(locale: string, platformId: ServicePlatformId): DirectoryProfessional[] {
  return [
    {
      attributes: {},
      city: locale.startsWith('id') ? 'Jakarta Selatan' : 'South Jakarta',
      coverageAreas: [locale.startsWith('id') ? 'Kunjungan rumah' : 'Home visit'],
      displayName: 'Alya Rahmawati',
      id: 'preview-professional-1',
      offeringCount: 3,
      platformId,
      slug: 'alya-rahmawati',
      startingPrice: 180000,
      userId: 'preview-user-1',
    },
    {
      attributes: {},
      city: locale.startsWith('id') ? 'Bandung' : 'Bandung',
      coverageAreas: [locale.startsWith('id') ? 'Laktasi' : 'Lactation'],
      displayName: 'Nadya Putri',
      id: 'preview-professional-2',
      offeringCount: 2,
      platformId,
      slug: 'nadya-putri',
      startingPrice: 150000,
      userId: 'preview-user-2',
    },
    {
      attributes: {},
      city: locale.startsWith('id') ? 'Surabaya' : 'Surabaya',
      coverageAreas: [locale.startsWith('id') ? 'Konsultasi online' : 'Online consult'],
      displayName: 'Maya Prameswari',
      id: 'preview-professional-3',
      offeringCount: 4,
      platformId,
      slug: 'maya-prameswari',
      startingPrice: 125000,
      userId: 'preview-user-3',
    },
  ];
}
