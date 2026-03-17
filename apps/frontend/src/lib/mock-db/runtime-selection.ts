import appRuntimeSelectionsData from '@/data/mock-db/app_runtime_selections.json';
import type { AppRuntimeSelectionRow } from '@/types/mock-db';

const appRuntimeSelections = appRuntimeSelectionsData as AppRuntimeSelectionRow[];

export const ACTIVE_RUNTIME_SELECTION = appRuntimeSelections[0];
export const ACTIVE_RUNTIME_CLOCK_ISO = ACTIVE_RUNTIME_SELECTION.currentDateTimeIso;
