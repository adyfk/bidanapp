import type { AppRuntimeSelectionRow } from '@/types/seed-data';

const runtimeClockIso = new Date().toISOString();

export const ACTIVE_RUNTIME_SELECTION: AppRuntimeSelectionRow = {
  activeHomeFeedId: '',
  activeMediaPresetId: 'default',
  currentConsumerId: '',
  currentDateTimeIso: runtimeClockIso,
  currentUserContextId: '',
  id: 'runtime-default',
  index: 1,
};

export const ACTIVE_RUNTIME_CLOCK_ISO = runtimeClockIso;
