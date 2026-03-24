import { findNearestAreaByPoint } from '@/lib/catalog-selectors';
import type { Area, GeoPoint, ResolvedLocation } from '@/types/catalog';

const DEFAULT_AREA_POSTAL_CODES: Record<string, string> = {
  'depok-sukmajaya': '16412',
  'depok-pancoran-mas': '16431',
  'jakarta-selatan-cilandak': '12430',
  'jakarta-selatan-kebayoran-baru': '12160',
  'bandung-soreang': '40911',
  'jakarta-barat-kembangan': '11610',
  'depok-cimanggis': '16452',
};

const EMPTY_AREA: Area = {
  city: '',
  district: '',
  id: '',
  index: 0,
  label: '',
  latitude: 0,
  longitude: 0,
  province: '',
};

const buildResolvedLocation = (point: GeoPoint, area: Area): ResolvedLocation => {
  const postalCode = DEFAULT_AREA_POSTAL_CODES[area.id] || '00000';
  const locationParts = [area.district, area.city, area.province].filter((value) => value.length > 0);
  const formattedAddress =
    locationParts.length > 0 ? `${locationParts.join(', ')} ${postalCode}, Indonesia` : 'Indonesia';

  return {
    point,
    areaId: area.id,
    areaLabel: area.label,
    city: area.city,
    district: area.district,
    province: area.province,
    postalCode,
    country: 'Indonesia',
    formattedAddress,
    source: 'derived',
    precision: 'district',
  };
};

export const resolveLocationPointSync = ({
  areas,
  fallbackArea,
  point,
}: {
  areas: Area[];
  fallbackArea?: Area;
  point: GeoPoint;
}) => {
  const area = findNearestAreaByPoint({
    areas,
    point,
  });

  return buildResolvedLocation(point, area || fallbackArea || EMPTY_AREA);
};

export const resolveLocationPoint = async ({
  areas,
  fallbackArea,
  point,
}: {
  areas: Area[];
  fallbackArea?: Area;
  point: GeoPoint;
}) => {
  await new Promise((resolve) => globalThis.setTimeout(resolve, 250));

  return resolveLocationPointSync({
    areas,
    fallbackArea,
    point,
  });
};
