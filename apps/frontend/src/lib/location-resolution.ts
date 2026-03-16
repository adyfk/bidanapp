import { findNearestAreaByPoint } from '@/lib/mock-db/catalog';
import type { Area, GeoPoint, ResolvedLocation } from '@/types/catalog';

const MOCK_AREA_POSTAL_CODES: Record<string, string> = {
  'depok-sukmajaya': '16412',
  'depok-pancoran-mas': '16431',
  'jakarta-selatan-cilandak': '12430',
  'jakarta-selatan-kebayoran-baru': '12160',
  'bandung-soreang': '40911',
  'jakarta-barat-kembangan': '11610',
  'depok-cimanggis': '16452',
};

const buildResolvedLocation = (point: GeoPoint, area: Area): ResolvedLocation => {
  const postalCode = MOCK_AREA_POSTAL_CODES[area.id] || '00000';

  return {
    point,
    areaId: area.id,
    areaLabel: area.label,
    city: area.city,
    district: area.district,
    province: area.province,
    postalCode,
    country: 'Indonesia',
    formattedAddress: `${area.district}, ${area.city}, ${area.province} ${postalCode}, Indonesia`,
    source: 'mock',
    precision: 'district',
  };
};

export const resolveLocationPointMockSync = (point: GeoPoint) => {
  const area = findNearestAreaByPoint(point);

  if (!area) {
    throw new Error('No mock area available for location resolution.');
  }

  return buildResolvedLocation(point, area);
};

export const resolveLocationPointMock = async (point: GeoPoint) => {
  await new Promise((resolve) => globalThis.setTimeout(resolve, 250));

  return resolveLocationPointMockSync(point);
};
