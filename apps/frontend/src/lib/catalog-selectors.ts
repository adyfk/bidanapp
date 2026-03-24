import type {
  Area,
  Category,
  GeoPoint,
  GlobalService,
  OfflineServiceDeliveryMode,
  Professional,
  ServiceDeliveryMode,
  ServiceModeFlags,
} from '@/types/catalog';

export interface ProfessionalCoverageStatus {
  coveredAreas: Area[];
  distanceKm: number;
  isAreaCovered: boolean;
  isHomeVisitCovered: boolean;
  isWithinHomeVisitRadius: boolean;
  selectedArea?: Area;
}

export const SERVICE_DELIVERY_MODE_ORDER: ServiceDeliveryMode[] = ['online', 'home_visit', 'onsite'];
export const isOfflineServiceMode = (mode: ServiceDeliveryMode): mode is OfflineServiceDeliveryMode =>
  mode !== 'online';

const isDefined = <T>(value: T | undefined): value is T => value !== undefined;

const isServiceModeEnabled = (serviceModes: ServiceModeFlags, mode: ServiceDeliveryMode) => {
  if (mode === 'online') {
    return serviceModes.online;
  }

  if (mode === 'home_visit') {
    return serviceModes.homeVisit;
  }

  return serviceModes.onsite;
};

const mergeServiceModes = (...serviceModesList: ServiceModeFlags[]): ServiceModeFlags =>
  serviceModesList.reduce<ServiceModeFlags>(
    (accumulator, serviceModes) => ({
      homeVisit: accumulator.homeVisit || serviceModes.homeVisit,
      online: accumulator.online || serviceModes.online,
      onsite: accumulator.onsite || serviceModes.onsite,
    }),
    { homeVisit: false, online: false, onsite: false },
  );

const toRadians = (value: number) => (value * Math.PI) / 180;

export const getAreaById = (areas: Area[], areaId: string) => areas.find((area) => area.id === areaId);

export const getCategoryById = (categories: Category[], categoryId: string) =>
  categories.find((category) => category.id === categoryId);

export const getServiceById = (services: GlobalService[], serviceId: string) =>
  services.find((service) => service.id === serviceId);

export const getEnabledServiceModes = (serviceModes: ServiceModeFlags) =>
  SERVICE_DELIVERY_MODE_ORDER.filter((mode) => isServiceModeEnabled(serviceModes, mode));

export const getProfessionalServiceModes = (professional: Professional) =>
  mergeServiceModes(...professional.services.map((serviceOffering) => serviceOffering.serviceModes));

export const getProfessionalCategoryIds = ({
  professional,
  services,
}: {
  professional: Professional;
  services: GlobalService[];
}) => {
  const categoryIds = new Set<string>();

  for (const serviceOffering of professional.services) {
    const service = getServiceById(services, serviceOffering.serviceId);

    if (service) {
      categoryIds.add(service.categoryId);
    }
  }

  return [...categoryIds];
};

export const getProfessionalCategories = ({
  categories,
  professional,
  services,
}: {
  categories: Category[];
  professional: Professional;
  services: GlobalService[];
}) =>
  getProfessionalCategoryIds({
    professional,
    services,
  })
    .map((categoryId) => getCategoryById(categories, categoryId))
    .filter(isDefined);

export const getProfessionalCategoryLabel = ({
  categories,
  maxItems = 2,
  professional,
  services,
}: {
  categories: Category[];
  maxItems?: number;
  professional: Professional;
  services: GlobalService[];
}) => {
  const categoryNames = getProfessionalCategories({
    categories,
    professional,
    services,
  }).map((category) => category.name);

  if (categoryNames.length <= maxItems) {
    return categoryNames.join(' • ');
  }

  return `${categoryNames.slice(0, maxItems).join(' • ')} +${categoryNames.length - maxItems}`;
};

export const getDistanceKm = (from: GeoPoint, to: GeoPoint) => {
  const earthRadiusKm = 6371;
  const deltaLatitude = toRadians(to.latitude - from.latitude);
  const deltaLongitude = toRadians(to.longitude - from.longitude);
  const latitude1 = toRadians(from.latitude);
  const latitude2 = toRadians(to.latitude);

  const a =
    Math.sin(deltaLatitude / 2) ** 2 + Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(deltaLongitude / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const findNearestAreaByPoint = ({ areas, point }: { areas: Area[]; point: GeoPoint }) => {
  if (areas.length === 0) {
    return undefined;
  }

  return areas.reduce((nearestArea, area) =>
    getDistanceKm(point, { latitude: area.latitude, longitude: area.longitude }) <
    getDistanceKm(point, { latitude: nearestArea.latitude, longitude: nearestArea.longitude })
      ? area
      : nearestArea,
  );
};

export const estimateTravelTimeMinutes = (distanceKm: number, averageSpeedKph = 25) =>
  Math.max(5, Math.round((distanceKm / averageSpeedKph) * 60));

export const getProfessionalCoverageStatus = ({
  areas,
  professional,
  selectedAreaId,
  userLocation,
}: {
  areas: Area[];
  professional: Professional;
  selectedAreaId: string;
  userLocation: GeoPoint;
}): ProfessionalCoverageStatus => {
  const coverageAreaIds = Array.isArray(professional.coverage?.areaIds) ? professional.coverage.areaIds : [];
  const coverageCenter = professional.coverage?.center || {
    latitude: 0,
    longitude: 0,
  };
  const homeVisitRadiusKm =
    typeof professional.coverage?.homeVisitRadiusKm === 'number' ? professional.coverage.homeVisitRadiusKm : 0;
  const selectedArea = getAreaById(areas, selectedAreaId);
  const coveredAreas = coverageAreaIds.map((areaId) => getAreaById(areas, areaId)).filter(isDefined);
  const distanceKm = getDistanceKm(coverageCenter, userLocation);
  const isAreaCovered = selectedArea ? coverageAreaIds.includes(selectedArea.id) : false;
  const isWithinHomeVisitRadius = distanceKm <= homeVisitRadiusKm;

  return {
    coveredAreas,
    distanceKm,
    isAreaCovered,
    isHomeVisitCovered: isAreaCovered && isWithinHomeVisitRadius,
    isWithinHomeVisitRadius,
    selectedArea,
  };
};

export const getAccessibleServiceModes = (
  serviceModes: ServiceModeFlags,
  coverageStatus: ProfessionalCoverageStatus,
  isAvailable: boolean,
) =>
  getEnabledServiceModes(serviceModes).filter((mode) => {
    if (!isAvailable) {
      return false;
    }

    if (mode === 'home_visit') {
      return coverageStatus.isHomeVisitCovered;
    }

    return true;
  });
