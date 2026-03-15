import uiData from '@/data/simulation/ui.json';
import { getProfessionalById, getServiceById } from '@/lib/simulation/catalog';
import { getRequiredItem } from '@/lib/simulation/utils';
import type { ServiceType } from '@/types/catalog';
import type {
  CurrentUser,
  HomeScenario,
  HomeScenarioSeed,
  MediaPreset,
  MessagePreset,
  ProfessionalDetailScenario,
  SharedContext,
  UiSimulationFile,
} from '@/types/simulation';

const data = uiData as UiSimulationFile;
const sortByIndex = <T extends { index: number }>(items: T[]) =>
  [...items].sort((left, right) => left.index - right.index);

export const SIMULATION_CURRENT_USERS: CurrentUser[] = sortByIndex(data.currentUsers);
export const SIMULATION_SHARED_CONTEXTS: SharedContext[] = sortByIndex(data.sharedContexts);
export const SIMULATION_MEDIA_PRESETS: MediaPreset[] = sortByIndex(data.mediaPresets);
export const SIMULATION_PROFESSIONAL_DETAIL_SCENARIOS: ProfessionalDetailScenario[] = sortByIndex(
  data.professionalDetailScenarios,
);
export const SIMULATION_MESSAGE_PRESETS: MessagePreset[] = sortByIndex(data.messagePresets);
export const SIMULATION_APP_SECTIONS = data.appSections || {};

const currentUsersById = new Map(SIMULATION_CURRENT_USERS.map((user) => [user.id, user]));
const sharedContextsById = new Map(SIMULATION_SHARED_CONTEXTS.map((context) => [context.id, context]));
const mediaPresetsById = new Map(SIMULATION_MEDIA_PRESETS.map((preset) => [preset.id, preset]));
const detailScenariosById = new Map(
  SIMULATION_PROFESSIONAL_DETAIL_SCENARIOS.map((scenario) => [scenario.id, scenario]),
);
const messagePresetsById = new Map(SIMULATION_MESSAGE_PRESETS.map((preset) => [preset.id, preset]));

const hydrateHomeScenario = (scenario: HomeScenarioSeed): HomeScenario => ({
  id: scenario.id,
  title: scenario.title,
  currentUser: getRequiredItem(
    currentUsersById.get(scenario.currentUserId),
    `homeScenarios.${scenario.id}.currentUserId -> ${scenario.currentUserId}`,
  ),
  sharedContext: getRequiredItem(
    sharedContextsById.get(scenario.sharedContextId),
    `homeScenarios.${scenario.id}.sharedContextId -> ${scenario.sharedContextId}`,
  ),
  featuredAppointment: scenario.featuredAppointment
    ? {
        dateLabel: scenario.featuredAppointment.dateLabel,
        timeLabel: scenario.featuredAppointment.timeLabel,
        professional: getRequiredItem(
          getProfessionalById(scenario.featuredAppointment.professionalId),
          `homeScenarios.${scenario.id}.featuredAppointment.professionalId -> ${scenario.featuredAppointment.professionalId}`,
        ),
      }
    : undefined,
  popularServices: scenario.popularServiceIds.map((serviceId) =>
    getRequiredItem(getServiceById(serviceId), `homeScenarios.${scenario.id}.popularServiceIds -> ${serviceId}`),
  ),
  nearbyProfessionals: scenario.nearbyProfessionalIds.map((professionalId) =>
    getRequiredItem(
      getProfessionalById(professionalId),
      `homeScenarios.${scenario.id}.nearbyProfessionalIds -> ${professionalId}`,
    ),
  ),
});

export const SIMULATION_HOME_SCENARIOS: HomeScenario[] = sortByIndex(data.homeScenarios).map(hydrateHomeScenario);
const homeScenariosById = new Map(SIMULATION_HOME_SCENARIOS.map((scenario) => [scenario.id, scenario]));

export const ACTIVE_SIMULATION_IDS = data.active;

export const SIMULATION_CURRENT_USER = getRequiredItem(
  currentUsersById.get(ACTIVE_SIMULATION_IDS.currentUserId),
  `active.currentUserId -> ${ACTIVE_SIMULATION_IDS.currentUserId}`,
);

export const SIMULATION_SHARED = getRequiredItem(
  sharedContextsById.get(ACTIVE_SIMULATION_IDS.sharedContextId),
  `active.sharedContextId -> ${ACTIVE_SIMULATION_IDS.sharedContextId}`,
);

export const SIMULATION_HOME = getRequiredItem(
  homeScenariosById.get(ACTIVE_SIMULATION_IDS.homeScenarioId),
  `active.homeScenarioId -> ${ACTIVE_SIMULATION_IDS.homeScenarioId}`,
);

export const SIMULATION_MEDIA = getRequiredItem(
  mediaPresetsById.get(ACTIVE_SIMULATION_IDS.mediaPresetId),
  `active.mediaPresetId -> ${ACTIVE_SIMULATION_IDS.mediaPresetId}`,
);

export const SIMULATION_PROFESSIONAL_DETAIL = getRequiredItem(
  detailScenariosById.get(ACTIVE_SIMULATION_IDS.professionalDetailScenarioId),
  `active.professionalDetailScenarioId -> ${ACTIVE_SIMULATION_IDS.professionalDetailScenarioId}`,
);

export const SIMULATION_MESSAGES = getRequiredItem(
  messagePresetsById.get(ACTIVE_SIMULATION_IDS.messagePresetId),
  `active.messagePresetId -> ${ACTIVE_SIMULATION_IDS.messagePresetId}`,
);

export const getBookingMessage = (serviceType: ServiceType) => SIMULATION_MESSAGES.booking[serviceType];
