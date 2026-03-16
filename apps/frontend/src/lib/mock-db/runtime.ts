import appRuntimeSelectionsData from '@/data/mock-db/app_runtime_selections.json';
import appSectionConfigsData from '@/data/mock-db/app_section_configs.json';
import consumersData from '@/data/mock-db/consumers.json';
import homeFeedFeaturedAppointmentsData from '@/data/mock-db/home_feed_featured_appointments.json';
import homeFeedNearbyProfessionalsData from '@/data/mock-db/home_feed_nearby_professionals.json';
import homeFeedPopularServicesData from '@/data/mock-db/home_feed_popular_services.json';
import homeFeedSnapshotsData from '@/data/mock-db/home_feed_snapshots.json';
import mediaPresetsData from '@/data/mock-db/media_presets.json';
import userContextsData from '@/data/mock-db/user_contexts.json';
import { getAreaById, getProfessionalById, getServiceById } from '@/lib/mock-db/catalog';
import type { ConsumerProfile, HomeFeedSnapshot, MediaPreset, UserContext } from '@/types/app-state';
import type {
  AppRuntimeSelectionRow,
  AppSectionConfigRow,
  ConsumerRow,
  HomeFeedFeaturedAppointmentRow,
  HomeFeedNearbyProfessionalRow,
  HomeFeedPopularServiceRow,
  HomeFeedSnapshotRow,
  MediaPresetRow,
  UserContextRow,
} from '@/types/mock-db';
import { getRequiredItem, sortByIndex } from './utils';

const groupBy = <T, K>(items: T[], getKey: (item: T) => K) => {
  const grouped = new Map<K, T[]>();

  for (const item of items) {
    const key = getKey(item);
    const existing = grouped.get(key);

    if (existing) {
      existing.push(item);
    } else {
      grouped.set(key, [item]);
    }
  }

  return grouped;
};

const appRuntimeSelections = appRuntimeSelectionsData as AppRuntimeSelectionRow[];
const consumerRows = sortByIndex(consumersData as ConsumerRow[]);
const userContextRows = sortByIndex(userContextsData as UserContextRow[]);
const homeFeedRows = sortByIndex(homeFeedSnapshotsData as HomeFeedSnapshotRow[]);
const homeFeedFeaturedRows = sortByIndex(homeFeedFeaturedAppointmentsData as HomeFeedFeaturedAppointmentRow[]);
const homeFeedPopularServiceRows = sortByIndex(homeFeedPopularServicesData as HomeFeedPopularServiceRow[]);
const homeFeedNearbyProfessionalRows = sortByIndex(homeFeedNearbyProfessionalsData as HomeFeedNearbyProfessionalRow[]);
const mediaPresetRows = sortByIndex(mediaPresetsData as MediaPresetRow[]);
const appSectionConfigRows = sortByIndex(appSectionConfigsData as AppSectionConfigRow[]);

const featuredAppointmentByHomeFeedId = new Map(homeFeedFeaturedRows.map((row) => [row.homeFeedId, row]));
const popularServiceRowsByHomeFeedId = groupBy(homeFeedPopularServiceRows, (row) => row.homeFeedId);
const nearbyProfessionalRowsByHomeFeedId = groupBy(homeFeedNearbyProfessionalRows, (row) => row.homeFeedId);

const hydratedConsumersById = new Map(
  consumerRows.map((consumerRow) => [consumerRow.id, consumerRow as ConsumerProfile]),
);

const hydratedUserContextsById = new Map(
  userContextRows.map((userContextRow) => {
    const area = getRequiredItem(
      getAreaById(userContextRow.selectedAreaId),
      `user_contexts.${userContextRow.id}.selectedAreaId -> ${userContextRow.selectedAreaId}`,
    );

    return [
      userContextRow.id,
      {
        index: userContextRow.index,
        id: userContextRow.id,
        area,
        currentArea: area.label,
        userLocation: {
          latitude: userContextRow.userLatitude,
          longitude: userContextRow.userLongitude,
        },
        onlineStatusLabel: userContextRow.onlineStatusLabel,
      } satisfies UserContext,
    ] as const;
  }),
);

const hydratedHomeFeedsById = new Map(
  homeFeedRows.map((homeFeedRow) => {
    const featuredAppointmentRow = featuredAppointmentByHomeFeedId.get(homeFeedRow.id);

    return [
      homeFeedRow.id,
      {
        id: homeFeedRow.id,
        title: homeFeedRow.title,
        currentUser: getRequiredItem(
          hydratedConsumersById.get(homeFeedRow.consumerId),
          `home_feed_snapshots.${homeFeedRow.id}.consumerId -> ${homeFeedRow.consumerId}`,
        ),
        sharedContext: getRequiredItem(
          hydratedUserContextsById.get(homeFeedRow.userContextId),
          `home_feed_snapshots.${homeFeedRow.id}.userContextId -> ${homeFeedRow.userContextId}`,
        ),
        featuredAppointment: featuredAppointmentRow
          ? {
              dateLabel: featuredAppointmentRow.dateLabel,
              timeLabel: featuredAppointmentRow.timeLabel,
              professional: getRequiredItem(
                getProfessionalById(featuredAppointmentRow.professionalId),
                `home_feed_featured_appointments.${featuredAppointmentRow.id}.professionalId -> ${featuredAppointmentRow.professionalId}`,
              ),
            }
          : undefined,
        popularServices: sortByIndex(popularServiceRowsByHomeFeedId.get(homeFeedRow.id) || []).map((row) =>
          getRequiredItem(
            getServiceById(row.serviceId),
            `home_feed_popular_services.${row.id}.serviceId -> ${row.serviceId}`,
          ),
        ),
        nearbyProfessionals: sortByIndex(nearbyProfessionalRowsByHomeFeedId.get(homeFeedRow.id) || []).map((row) =>
          getRequiredItem(
            getProfessionalById(row.professionalId),
            `home_feed_nearby_professionals.${row.id}.professionalId -> ${row.professionalId}`,
          ),
        ),
      } satisfies HomeFeedSnapshot,
    ] as const;
  }),
);

const mediaPresetsById = new Map(mediaPresetRows.map((preset) => [preset.id, preset as MediaPreset]));

const activeAppRuntime = getRequiredItem(appRuntimeSelections[0], 'app_runtime_selections[0]');

export const APP_SECTION_CONFIG = {
  homeCategoryIds: appSectionConfigRows
    .filter((row) => row.section === 'home' && row.configKey === 'homeCategoryIds' && row.entityType === 'category')
    .map((row) => row.entityId),
};

export const ACTIVE_CONSUMER = getRequiredItem(
  hydratedConsumersById.get(activeAppRuntime.currentConsumerId),
  `app_runtime_selections.${activeAppRuntime.id}.currentConsumerId -> ${activeAppRuntime.currentConsumerId}`,
);

export const ACTIVE_USER_CONTEXT = getRequiredItem(
  hydratedUserContextsById.get(activeAppRuntime.currentUserContextId),
  `app_runtime_selections.${activeAppRuntime.id}.currentUserContextId -> ${activeAppRuntime.currentUserContextId}`,
);

export const ACTIVE_HOME_FEED = getRequiredItem(
  hydratedHomeFeedsById.get(activeAppRuntime.activeHomeFeedId),
  `app_runtime_selections.${activeAppRuntime.id}.activeHomeFeedId -> ${activeAppRuntime.activeHomeFeedId}`,
);

export const ACTIVE_MEDIA_PRESET = getRequiredItem(
  mediaPresetsById.get(activeAppRuntime.activeMediaPresetId),
  `app_runtime_selections.${activeAppRuntime.id}.activeMediaPresetId -> ${activeAppRuntime.activeMediaPresetId}`,
);
