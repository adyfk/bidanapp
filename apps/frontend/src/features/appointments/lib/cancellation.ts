import { ACTIVE_RUNTIME_CLOCK_ISO } from '@/lib/app-runtime';
import type {
  AppointmentCancellationActor,
  AppointmentCancellationPolicySnapshot,
  AppointmentFinancialOutcome,
  AppointmentScheduleSnapshot,
  AppointmentStatus,
} from '@/types/appointments';
import type { ServiceDeliveryMode } from '@/types/catalog';

export interface AppointmentClosePreview {
  allowed: boolean;
  cutoffHours: number | null;
  financialOutcome: AppointmentFinancialOutcome | null;
  isBeforeCutoff: boolean | null;
  nextStatus: AppointmentStatus | null;
}

const timePattern = /(\d{2}):(\d{2})/;

export const DEFAULT_CUSTOMER_PAID_CANCEL_CUTOFF_HOURS = 6;

export const createDefaultCancellationPolicySnapshot = (
  _mode: ServiceDeliveryMode,
): AppointmentCancellationPolicySnapshot => ({
  customerPaidCancelCutoffHours: DEFAULT_CUSTOMER_PAID_CANCEL_CUTOFF_HOURS,
  professionalCancelOutcome: 'full_refund',
  beforeCutoffOutcome: 'full_refund',
  afterCutoffOutcome: 'no_refund',
});

export const isCustomerCancellationAllowed = (status: AppointmentStatus) =>
  status === 'requested' ||
  status === 'awaiting_payment' ||
  status === 'approved_waiting_payment' ||
  status === 'paid' ||
  status === 'confirmed';

export const isProfessionalCloseAllowed = (status: AppointmentStatus) =>
  status === 'requested' ||
  status === 'awaiting_payment' ||
  status === 'approved_waiting_payment' ||
  status === 'paid' ||
  status === 'confirmed';

const parseDateIsoTime = (dateIso: string, timeLabel: string) => {
  const match = timeLabel.match(timePattern);

  if (!match) {
    return null;
  }

  const [, hours, minutes] = match;

  return new Date(`${dateIso}T${hours}:${minutes}:00+07:00`);
};

const parseRelativeDateIso = (scheduledTimeLabel: string, referenceDateTimeIso: string) => {
  const referenceDateIso = new Date(referenceDateTimeIso).toISOString().slice(0, 10);
  const referenceDate = new Date(`${referenceDateIso}T00:00:00Z`);
  const normalizedLabel = scheduledTimeLabel.trim().toLowerCase();

  if (normalizedLabel.startsWith('hari ini') || normalizedLabel.startsWith('today')) {
    return referenceDateIso;
  }

  if (normalizedLabel.startsWith('besok') || normalizedLabel.startsWith('tomorrow')) {
    referenceDate.setUTCDate(referenceDate.getUTCDate() + 1);
    return referenceDate.toISOString().slice(0, 10);
  }

  if (normalizedLabel.startsWith('kemarin') || normalizedLabel.startsWith('yesterday')) {
    referenceDate.setUTCDate(referenceDate.getUTCDate() - 1);
    return referenceDate.toISOString().slice(0, 10);
  }

  return null;
};

export const resolveAppointmentScheduledStart = (
  scheduleSnapshot: AppointmentScheduleSnapshot,
  referenceDateTimeIso = ACTIVE_RUNTIME_CLOCK_ISO,
) => {
  const timeLabel = scheduleSnapshot.timeSlotLabel || scheduleSnapshot.scheduledTimeLabel;
  const resolvedDateIso =
    scheduleSnapshot.dateIso || parseRelativeDateIso(scheduleSnapshot.scheduledTimeLabel, referenceDateTimeIso);

  if (!resolvedDateIso) {
    return null;
  }

  return parseDateIsoTime(resolvedDateIso, timeLabel);
};

export const getAppointmentClosePreview = ({
  actor,
  policySnapshot,
  referenceDateTimeIso = ACTIVE_RUNTIME_CLOCK_ISO,
  scheduleSnapshot,
  status,
}: {
  actor: AppointmentCancellationActor;
  policySnapshot: AppointmentCancellationPolicySnapshot;
  referenceDateTimeIso?: string;
  scheduleSnapshot: AppointmentScheduleSnapshot;
  status: AppointmentStatus;
}): AppointmentClosePreview => {
  if (actor === 'customer' && !isCustomerCancellationAllowed(status)) {
    return {
      allowed: false,
      cutoffHours: null,
      financialOutcome: null,
      isBeforeCutoff: null,
      nextStatus: null,
    };
  }

  if (actor === 'professional' && !isProfessionalCloseAllowed(status)) {
    return {
      allowed: false,
      cutoffHours: null,
      financialOutcome: null,
      isBeforeCutoff: null,
      nextStatus: null,
    };
  }

  if (actor === 'professional' && status === 'requested') {
    return {
      allowed: true,
      cutoffHours: null,
      financialOutcome: 'none',
      isBeforeCutoff: null,
      nextStatus: 'rejected',
    };
  }

  if (status === 'requested') {
    return {
      allowed: true,
      cutoffHours: null,
      financialOutcome: 'none',
      isBeforeCutoff: null,
      nextStatus: 'cancelled',
    };
  }

  if (status === 'awaiting_payment' || status === 'approved_waiting_payment') {
    return {
      allowed: true,
      cutoffHours: null,
      financialOutcome: 'void_pending_payment',
      isBeforeCutoff: null,
      nextStatus: 'cancelled',
    };
  }

  if (actor === 'professional') {
    return {
      allowed: true,
      cutoffHours: policySnapshot.customerPaidCancelCutoffHours,
      financialOutcome: policySnapshot.professionalCancelOutcome,
      isBeforeCutoff: true,
      nextStatus: 'cancelled',
    };
  }

  const scheduledStart = resolveAppointmentScheduledStart(scheduleSnapshot, referenceDateTimeIso);

  if (!scheduledStart) {
    return {
      allowed: true,
      cutoffHours: policySnapshot.customerPaidCancelCutoffHours,
      financialOutcome: 'full_refund',
      isBeforeCutoff: null,
      nextStatus: 'cancelled',
    };
  }

  const referenceDate = new Date(referenceDateTimeIso);
  const cutoffDate = new Date(scheduledStart);
  cutoffDate.setHours(cutoffDate.getHours() - policySnapshot.customerPaidCancelCutoffHours);
  const isBeforeCutoff = referenceDate.getTime() <= cutoffDate.getTime();

  return {
    allowed: true,
    cutoffHours: policySnapshot.customerPaidCancelCutoffHours,
    financialOutcome: isBeforeCutoff ? policySnapshot.beforeCutoffOutcome : policySnapshot.afterCutoffOutcome,
    isBeforeCutoff,
    nextStatus: 'cancelled',
  };
};
