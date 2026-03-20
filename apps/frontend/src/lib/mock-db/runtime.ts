import appSectionConfigsData from '@/data/mock-db/app_section_configs.json';
import consumersData from '@/data/mock-db/consumers.json';
import homeFeedFeaturedAppointmentsData from '@/data/mock-db/home_feed_featured_appointments.json';
import homeFeedNearbyProfessionalsData from '@/data/mock-db/home_feed_nearby_professionals.json';
import homeFeedPopularServicesData from '@/data/mock-db/home_feed_popular_services.json';
import homeFeedSnapshotsData from '@/data/mock-db/home_feed_snapshots.json';
import mediaPresetsData from '@/data/mock-db/media_presets.json';
import userContextsData from '@/data/mock-db/user_contexts.json';
import { getAppointmentById } from '@/lib/mock-db/appointments';
import { getAreaById, getProfessionalById, getServiceById } from '@/lib/mock-db/catalog';
import type { ConsumerProfile, HomeFeedSnapshot, MediaPreset, UserContext } from '@/types/app-state';
import type {
  AppSectionConfigRow,
  ConsumerRow,
  HomeFeedFeaturedAppointmentRow,
  HomeFeedNearbyProfessionalRow,
  HomeFeedPopularServiceRow,
  HomeFeedSnapshotRow,
  MediaPresetRow,
  UserContextRow,
} from '@/types/mock-db';
import { ACTIVE_RUNTIME_SELECTION } from './runtime-selection';
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
        area,
        currentArea: area.label,
        id: userContextRow.id,
        index: userContextRow.index,
        onlineStatusLabel: userContextRow.onlineStatusLabel,
        userLocation: {
          latitude: userContextRow.userLatitude,
          longitude: userContextRow.userLongitude,
        },
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
        currentUser: getRequiredItem(
          hydratedConsumersById.get(homeFeedRow.consumerId),
          `home_feed_snapshots.${homeFeedRow.id}.consumerId -> ${homeFeedRow.consumerId}`,
        ),
        featuredAppointment: featuredAppointmentRow
          ? {
              appointment: getRequiredItem(
                getAppointmentById(featuredAppointmentRow.appointmentId),
                `home_feed_featured_appointments.${featuredAppointmentRow.id}.appointmentId -> ${featuredAppointmentRow.appointmentId}`,
              ),
              dateLabel: featuredAppointmentRow.dateLabel,
              professional: getRequiredItem(
                getProfessionalById(featuredAppointmentRow.professionalId),
                `home_feed_featured_appointments.${featuredAppointmentRow.id}.professionalId -> ${featuredAppointmentRow.professionalId}`,
              ),
              timeLabel: featuredAppointmentRow.timeLabel,
            }
          : undefined,
        id: homeFeedRow.id,
        nearbyProfessionals: sortByIndex(nearbyProfessionalRowsByHomeFeedId.get(homeFeedRow.id) || []).map((row) =>
          getRequiredItem(
            getProfessionalById(row.professionalId),
            `home_feed_nearby_professionals.${row.id}.professionalId -> ${row.professionalId}`,
          ),
        ),
        popularServices: sortByIndex(popularServiceRowsByHomeFeedId.get(homeFeedRow.id) || []).map((row) =>
          getRequiredItem(
            getServiceById(row.serviceId),
            `home_feed_popular_services.${row.id}.serviceId -> ${row.serviceId}`,
          ),
        ),
        sharedContext: getRequiredItem(
          hydratedUserContextsById.get(homeFeedRow.userContextId),
          `home_feed_snapshots.${homeFeedRow.id}.userContextId -> ${homeFeedRow.userContextId}`,
        ),
        title: homeFeedRow.title,
      } satisfies HomeFeedSnapshot,
    ] as const;
  }),
);

const mediaPresetsById = new Map(mediaPresetRows.map((preset) => [preset.id, preset as MediaPreset]));

export const APP_SECTION_CONFIG = {
  homeCategoryIds: appSectionConfigRows
    .filter((row) => row.section === 'home' && row.configKey === 'homeCategoryIds' && row.entityType === 'category')
    .map((row) => row.entityId),
};

export const ACTIVE_CONSUMER = getRequiredItem(
  hydratedConsumersById.get(ACTIVE_RUNTIME_SELECTION.currentConsumerId),
  `app_runtime_selections.${ACTIVE_RUNTIME_SELECTION.id}.currentConsumerId -> ${ACTIVE_RUNTIME_SELECTION.currentConsumerId}`,
);

export const ACTIVE_USER_CONTEXT = getRequiredItem(
  hydratedUserContextsById.get(ACTIVE_RUNTIME_SELECTION.currentUserContextId),
  `app_runtime_selections.${ACTIVE_RUNTIME_SELECTION.id}.currentUserContextId -> ${ACTIVE_RUNTIME_SELECTION.currentUserContextId}`,
);

export const ACTIVE_HOME_FEED = getRequiredItem(
  hydratedHomeFeedsById.get(ACTIVE_RUNTIME_SELECTION.activeHomeFeedId),
  `app_runtime_selections.${ACTIVE_RUNTIME_SELECTION.id}.activeHomeFeedId -> ${ACTIVE_RUNTIME_SELECTION.activeHomeFeedId}`,
);

export const ACTIVE_MEDIA_PRESET = getRequiredItem(
  mediaPresetsById.get(ACTIVE_RUNTIME_SELECTION.activeMediaPresetId),
  `app_runtime_selections.${ACTIVE_RUNTIME_SELECTION.id}.activeMediaPresetId -> ${ACTIVE_RUNTIME_SELECTION.activeMediaPresetId}`,
);
