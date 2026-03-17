import type {
  OfflineServiceDeliveryMode,
  ProfessionalAvailabilityDateOverride,
  ProfessionalAvailabilityDay,
  ProfessionalAvailabilityRules,
  ProfessionalAvailabilityTimeSlot,
  ProfessionalAvailabilityWeekday,
  ProfessionalWeeklyAvailabilityWindow,
  TimeSlotStatus,
} from '@/types/catalog';

export const OFFLINE_SERVICE_MODES: OfflineServiceDeliveryMode[] = ['home_visit', 'onsite'];
export const AVAILABILITY_WEEKDAY_ORDER: ProfessionalAvailabilityWeekday[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];
export const DEFAULT_BOOKING_WINDOW_START_ISO = '2026-03-17';
export const DEFAULT_BOOKING_WINDOW_DAYS = 14;
export const DEFAULT_AVAILABILITY_START_TIME = '09:00';
export const DEFAULT_AVAILABILITY_END_TIME = '17:00';
export const DEFAULT_AVAILABILITY_SLOT_INTERVAL_MINUTES = 60;
export const DEFAULT_AVAILABILITY_MINIMUM_NOTICE_HOURS = 24;
export const AVAILABILITY_MINIMUM_NOTICE_OPTIONS = [4, 12, 24, 48] as const;

const timeLabelPattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
const dateIsoPattern = /^\d{4}-\d{2}-\d{2}$/;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

export const isAvailabilityWeekday = (value: string): value is ProfessionalAvailabilityWeekday =>
  AVAILABILITY_WEEKDAY_ORDER.includes(value as ProfessionalAvailabilityWeekday);

export const isTimeLabel = (value: unknown): value is string =>
  typeof value === 'string' && timeLabelPattern.test(value.trim());

export const isDateIso = (value: unknown): value is string =>
  typeof value === 'string' && dateIsoPattern.test(value.trim());

export const timeLabelToMinutes = (timeLabel: string) => {
  const match = timeLabel.trim().match(timeLabelPattern);

  if (!match) {
    return 0;
  }

  return Number.parseInt(match[1], 10) * 60 + Number.parseInt(match[2], 10);
};

export const minutesToTimeLabel = (totalMinutes: number) => {
  const normalizedMinutes = Math.max(0, Math.min(23 * 60 + 59, totalMinutes));
  const hours = Math.floor(normalizedMinutes / 60);
  const minutes = normalizedMinutes % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const parseDateIsoToUtcDate = (dateIso: string) => {
  const [year, month, day] = dateIso.split('-').map((part) => Number.parseInt(part, 10));
  return new Date(Date.UTC(year, month - 1, day));
};

export const addDaysToDateIso = (dateIso: string, dayOffset: number) => {
  const nextDate = parseDateIsoToUtcDate(dateIso);
  nextDate.setUTCDate(nextDate.getUTCDate() + dayOffset);
  return nextDate.toISOString().slice(0, 10);
};

export const getWeekdayForDateIso = (dateIso: string): ProfessionalAvailabilityWeekday => {
  const weekdayIndex = parseDateIsoToUtcDate(dateIso).getUTCDay();

  if (weekdayIndex === 0) {
    return 'sunday';
  }

  return AVAILABILITY_WEEKDAY_ORDER[weekdayIndex - 1];
};

export const buildAvailabilityWeekdayId = (
  mode: OfflineServiceDeliveryMode,
  weekday: ProfessionalAvailabilityWeekday,
) => `availability-weekday-${mode}-${weekday}`;

export const buildDefaultWeeklyAvailabilityWindow = (
  mode: OfflineServiceDeliveryMode,
  weekday: ProfessionalAvailabilityWeekday,
  index: number,
): ProfessionalWeeklyAvailabilityWindow => ({
  endTime: DEFAULT_AVAILABILITY_END_TIME,
  id: buildAvailabilityWeekdayId(mode, weekday),
  index,
  isEnabled: false,
  slotIntervalMinutes: DEFAULT_AVAILABILITY_SLOT_INTERVAL_MINUTES,
  startTime: DEFAULT_AVAILABILITY_START_TIME,
  weekday,
});

export const buildDefaultAvailabilityRules = (mode: OfflineServiceDeliveryMode): ProfessionalAvailabilityRules => ({
  dateOverrides: [],
  minimumNoticeHours: DEFAULT_AVAILABILITY_MINIMUM_NOTICE_HOURS,
  weeklyHours: AVAILABILITY_WEEKDAY_ORDER.map((weekday, index) =>
    buildDefaultWeeklyAvailabilityWindow(mode, weekday, index + 1),
  ),
});

const sanitizeWeeklyAvailabilityWindow = ({
  fallback,
  mode,
  value,
  weekday,
  index,
}: {
  fallback?: ProfessionalWeeklyAvailabilityWindow;
  index: number;
  mode: OfflineServiceDeliveryMode;
  value: unknown;
  weekday: ProfessionalAvailabilityWeekday;
}): ProfessionalWeeklyAvailabilityWindow => {
  const fallbackWindow = fallback || buildDefaultWeeklyAvailabilityWindow(mode, weekday, index);
  const rawValue = isRecord(value) ? value : null;
  const slotIntervalMinutes =
    typeof rawValue?.slotIntervalMinutes === 'number' &&
    Number.isFinite(rawValue.slotIntervalMinutes) &&
    rawValue.slotIntervalMinutes > 0
      ? Math.round(rawValue.slotIntervalMinutes)
      : fallbackWindow.slotIntervalMinutes;

  return {
    endTime: isTimeLabel(rawValue?.endTime) ? rawValue.endTime.trim() : fallbackWindow.endTime,
    id: typeof rawValue?.id === 'string' && rawValue.id.trim() ? rawValue.id.trim() : fallbackWindow.id,
    index,
    isEnabled: typeof rawValue?.isEnabled === 'boolean' ? rawValue.isEnabled : fallbackWindow.isEnabled,
    slotIntervalMinutes,
    startTime: isTimeLabel(rawValue?.startTime) ? rawValue.startTime.trim() : fallbackWindow.startTime,
    weekday,
  };
};

const sanitizeAvailabilityDateOverride = ({
  fallback,
  index,
  mode,
  value,
}: {
  fallback?: ProfessionalAvailabilityDateOverride;
  index: number;
  mode: OfflineServiceDeliveryMode;
  value: unknown;
}): ProfessionalAvailabilityDateOverride | null => {
  const rawValue = isRecord(value) ? value : null;
  const dateIso = isDateIso(rawValue?.dateIso)
    ? rawValue.dateIso.trim()
    : fallback?.dateIso || DEFAULT_BOOKING_WINDOW_START_ISO;

  if (!isDateIso(dateIso)) {
    return null;
  }

  const isClosed = typeof rawValue?.isClosed === 'boolean' ? rawValue.isClosed : fallback?.isClosed || false;
  const slotIntervalMinutes =
    typeof rawValue?.slotIntervalMinutes === 'number' &&
    Number.isFinite(rawValue.slotIntervalMinutes) &&
    rawValue.slotIntervalMinutes > 0
      ? Math.round(rawValue.slotIntervalMinutes)
      : fallback?.slotIntervalMinutes;

  return {
    dateIso,
    endTime: isClosed ? undefined : isTimeLabel(rawValue?.endTime) ? rawValue.endTime.trim() : fallback?.endTime,
    id:
      typeof rawValue?.id === 'string' && rawValue.id.trim()
        ? rawValue.id.trim()
        : fallback?.id || `availability-override-${mode}-${dateIso}`,
    index,
    isClosed,
    note: typeof rawValue?.note === 'string' && rawValue.note.trim() ? rawValue.note.trim() : fallback?.note,
    slotIntervalMinutes: isClosed ? undefined : slotIntervalMinutes,
    startTime: isClosed
      ? undefined
      : isTimeLabel(rawValue?.startTime)
        ? rawValue.startTime.trim()
        : fallback?.startTime,
  };
};

const normalizeAvailabilityRuleSet = (
  value: unknown,
  fallback: ProfessionalAvailabilityRules | undefined,
  mode: OfflineServiceDeliveryMode,
): ProfessionalAvailabilityRules | undefined => {
  const rawValue = isRecord(value) ? value : null;
  const weeklyFallbackByWeekday = new Map(
    (fallback?.weeklyHours || buildDefaultAvailabilityRules(mode).weeklyHours).map((window) => [
      window.weekday,
      window,
    ]),
  );
  const rawWeeklyHours = Array.isArray(rawValue?.weeklyHours) ? rawValue.weeklyHours : fallback?.weeklyHours || [];
  const rawWeeklyHoursByWeekday = new Map(
    rawWeeklyHours.flatMap((item) => {
      if (!isRecord(item) || !isAvailabilityWeekday(String(item.weekday || ''))) {
        return [];
      }

      return [[item.weekday, item] as const];
    }),
  );
  const weeklyHours = AVAILABILITY_WEEKDAY_ORDER.map((weekday, index) =>
    sanitizeWeeklyAvailabilityWindow({
      fallback: weeklyFallbackByWeekday.get(weekday),
      index: index + 1,
      mode,
      value: rawWeeklyHoursByWeekday.get(weekday),
      weekday,
    }),
  );

  const rawDateOverrides = Array.isArray(rawValue?.dateOverrides)
    ? rawValue.dateOverrides
    : fallback?.dateOverrides || [];
  const dateOverrides = rawDateOverrides
    .map((item, index) =>
      sanitizeAvailabilityDateOverride({
        fallback: fallback?.dateOverrides[index],
        index: index + 1,
        mode,
        value: item,
      }),
    )
    .filter((item): item is ProfessionalAvailabilityDateOverride => item !== null)
    .sort((leftItem, rightItem) => leftItem.dateIso.localeCompare(rightItem.dateIso))
    .map((item, index) => ({
      ...item,
      index: index + 1,
    }));

  const defaultRuleSet = buildDefaultAvailabilityRules(mode);
  const hasWeeklyHours = weeklyHours.some((window) => window.isEnabled);
  const minimumNoticeHours =
    typeof rawValue?.minimumNoticeHours === 'number' &&
    Number.isFinite(rawValue.minimumNoticeHours) &&
    rawValue.minimumNoticeHours >= 0
      ? Math.round(rawValue.minimumNoticeHours)
      : typeof fallback?.minimumNoticeHours === 'number'
        ? fallback.minimumNoticeHours
        : defaultRuleSet.minimumNoticeHours;

  if (!hasWeeklyHours && dateOverrides.length === 0 && minimumNoticeHours === defaultRuleSet.minimumNoticeHours) {
    return undefined;
  }

  return {
    dateOverrides,
    minimumNoticeHours,
    weeklyHours,
  };
};

export const normalizeAvailabilityRulesByMode = (
  value: unknown,
  fallback?: Partial<Record<OfflineServiceDeliveryMode, ProfessionalAvailabilityRules>>,
): Partial<Record<OfflineServiceDeliveryMode, ProfessionalAvailabilityRules>> | undefined => {
  const nextAvailabilityRulesByMode: Partial<Record<OfflineServiceDeliveryMode, ProfessionalAvailabilityRules>> = {};

  for (const mode of OFFLINE_SERVICE_MODES) {
    const normalizedRuleSet = normalizeAvailabilityRuleSet(
      isRecord(value) ? value[mode] : undefined,
      fallback?.[mode],
      mode,
    );

    if (normalizedRuleSet) {
      nextAvailabilityRulesByMode[mode] = normalizedRuleSet;
    }
  }

  return Object.keys(nextAvailabilityRulesByMode).length > 0 ? nextAvailabilityRulesByMode : undefined;
};

export const cloneAvailabilityRulesByMode = (
  availabilityRulesByMode?: Partial<Record<OfflineServiceDeliveryMode, ProfessionalAvailabilityRules>>,
) => normalizeAvailabilityRulesByMode(availabilityRulesByMode);

export const countEnabledWeeklyHours = (ruleSet?: ProfessionalAvailabilityRules) =>
  ruleSet?.weeklyHours.filter((window) => window.isEnabled).length || 0;

export const countDateOverrides = (ruleSet?: ProfessionalAvailabilityRules) => ruleSet?.dateOverrides.length || 0;

export const formatMinimumNoticeLabel = (minimumNoticeHours: number) => {
  if (minimumNoticeHours >= 24 && minimumNoticeHours % 24 === 0) {
    const totalDays = minimumNoticeHours / 24;
    return totalDays === 1 ? 'H-1' : `H-${totalDays}`;
  }

  return `${minimumNoticeHours} jam`;
};

export const buildAvailabilityDateTimeIso = (dateIso: string, timeLabel: string) => `${dateIso}T${timeLabel}:00+07:00`;

export const getAvailabilityLeadTimeCutoffIso = (referenceDateTimeIso: string, minimumNoticeHours: number) => {
  const cutoffDate = new Date(referenceDateTimeIso);
  cutoffDate.setHours(cutoffDate.getHours() + minimumNoticeHours);
  return cutoffDate.toISOString();
};

export const buildGeneratedAvailabilitySlots = ({
  dateIso,
  getSlotStatus,
  minimumNoticeHours,
  mode,
  professionalId,
  referenceDateTimeIso,
  slotIntervalMinutes,
  startTime,
  endTime,
}: {
  dateIso: string;
  getSlotStatus?: (timeLabel: string) => TimeSlotStatus;
  minimumNoticeHours: number;
  mode: OfflineServiceDeliveryMode;
  professionalId: string;
  referenceDateTimeIso: string;
  slotIntervalMinutes: number;
  startTime: string;
  endTime: string;
}): ProfessionalAvailabilityTimeSlot[] => {
  const startMinutes = timeLabelToMinutes(startTime);
  const endMinutes = timeLabelToMinutes(endTime);

  if (endMinutes <= startMinutes || slotIntervalMinutes <= 0) {
    return [];
  }

  const slots: ProfessionalAvailabilityTimeSlot[] = [];
  const cutoffDateTimeMs = new Date(
    getAvailabilityLeadTimeCutoffIso(referenceDateTimeIso, minimumNoticeHours),
  ).getTime();

  for (let currentMinutes = startMinutes; currentMinutes < endMinutes; currentMinutes += slotIntervalMinutes) {
    const timeLabel = minutesToTimeLabel(currentMinutes);
    const slotDateTimeMs = new Date(buildAvailabilityDateTimeIso(dateIso, timeLabel)).getTime();

    if (slotDateTimeMs < cutoffDateTimeMs) {
      continue;
    }

    slots.push({
      id: `pad-${professionalId}-${mode}-${dateIso}-slot-${timeLabel.replace(':', '')}`,
      index: slots.length + 1,
      label: timeLabel,
      status: getSlotStatus ? getSlotStatus(timeLabel) : 'available',
    });
  }

  return slots;
};

export const generateAvailabilityScheduleDays = ({
  days = DEFAULT_BOOKING_WINDOW_DAYS,
  getSlotStatus,
  mode,
  professionalId,
  referenceDateTimeIso,
  ruleSet,
  startDateIso = DEFAULT_BOOKING_WINDOW_START_ISO,
}: {
  days?: number;
  getSlotStatus?: (dateIso: string, timeLabel: string) => TimeSlotStatus;
  mode: OfflineServiceDeliveryMode;
  professionalId: string;
  referenceDateTimeIso: string;
  ruleSet?: ProfessionalAvailabilityRules;
  startDateIso?: string;
}): ProfessionalAvailabilityDay[] => {
  if (!ruleSet) {
    return [];
  }

  const scheduleDays: ProfessionalAvailabilityDay[] = [];
  const weeklyHoursByWeekday = new Map(ruleSet.weeklyHours.map((window) => [window.weekday, window]));
  const dateOverridesByDateIso = new Map(ruleSet.dateOverrides.map((override) => [override.dateIso, override]));

  for (let dayOffset = 0; dayOffset < days; dayOffset += 1) {
    const dateIso = addDaysToDateIso(startDateIso, dayOffset);
    const weekday = getWeekdayForDateIso(dateIso);
    const weeklyWindow = weeklyHoursByWeekday.get(weekday);
    const dateOverride = dateOverridesByDateIso.get(dateIso);

    if (dateOverride?.isClosed) {
      continue;
    }

    const startTime = dateOverride?.startTime || (weeklyWindow?.isEnabled ? weeklyWindow.startTime : undefined);
    const endTime = dateOverride?.endTime || (weeklyWindow?.isEnabled ? weeklyWindow.endTime : undefined);
    const slotIntervalMinutes =
      dateOverride?.slotIntervalMinutes ||
      (weeklyWindow?.isEnabled ? weeklyWindow.slotIntervalMinutes : undefined) ||
      DEFAULT_AVAILABILITY_SLOT_INTERVAL_MINUTES;

    if (!startTime || !endTime) {
      continue;
    }

    const slots = buildGeneratedAvailabilitySlots({
      dateIso,
      endTime,
      getSlotStatus: getSlotStatus ? (timeLabel) => getSlotStatus(dateIso, timeLabel) : undefined,
      minimumNoticeHours: ruleSet.minimumNoticeHours,
      mode,
      professionalId,
      referenceDateTimeIso,
      slotIntervalMinutes,
      startTime,
    });

    if (slots.length === 0) {
      continue;
    }

    scheduleDays.push({
      dateIso,
      id: `pad-${professionalId}-${mode}-${dateIso}`,
      index: scheduleDays.length + 1,
      label: dateIso,
      slots,
    });
  }

  return scheduleDays;
};
