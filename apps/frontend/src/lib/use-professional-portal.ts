'use client';

import { useEffect, useState } from 'react';
import { ACTIVE_APPOINTMENT_STATUSES, HISTORY_APPOINTMENT_STATUSES } from '@/features/appointments/lib/status';
import {
  type CreateCustomerRequestInput,
  PROFESSIONAL_PORTAL_SCHEMA_VERSION,
  type ProfessionalAccessDraft,
  type ProfessionalLifecycleReviewState,
  type ProfessionalLifecycleStatus,
  type ProfessionalManagedAppointmentRecord,
  type ProfessionalManagedGalleryItem,
  type ProfessionalManagedPortfolioEntry,
  type ProfessionalManagedRequest,
  type ProfessionalManagedService,
  type ProfessionalPortalSnapshot,
  type ProfessionalPortalState,
  type ProfessionalRequestStatus,
  type ProfessionalRequestStatusEvidence,
  type SaveBusinessSettingsInput,
  type UpdateRequestStatusInput,
} from '@/features/professional-portal/lib/contracts';
import {
  createProfessionalOnboardingDraft,
  deriveProfessionalOnboardingState,
  PROFESSIONAL_LIFECYCLE_REVIEW_STATE_MOCKS,
} from '@/features/professional-portal/lib/onboarding';
import {
  createProfessionalPortalSnapshot,
  getProfessionalPortalRepository,
} from '@/features/professional-portal/lib/repository';
import { validateProfessionalRequestStatusUpdate } from '@/features/professional-portal/lib/request-status';
import { getAppointmentRowsByProfessionalId } from '@/lib/mock-db/appointment-records';
import { appointmentPriceLabelToNumber, createHydratedAppointment } from '@/lib/mock-db/appointments';
import {
  getAreaById,
  getProfessionalById,
  getProfessionalCategoryLabel,
  MOCK_CATEGORIES,
  MOCK_PROFESSIONALS,
  MOCK_SERVICES,
} from '@/lib/mock-db/catalog';
import { ACTIVE_CONSUMER, ACTIVE_USER_CONTEXT } from '@/lib/mock-db/runtime';
import type {
  Appointment,
  AppointmentScheduleSnapshot,
  AppointmentServiceSnapshot,
  AppointmentStatus,
  AppointmentTimelineActor,
  AppointmentTimelineEvent,
} from '@/types/appointments';
import type {
  Area,
  BookingFlow,
  GeoPoint,
  Professional,
  ProfessionalAvailabilityDay,
  ProfessionalAvailabilityTimeSlot,
  ProfessionalGalleryItem,
  ProfessionalService,
  ServiceDeliveryMode,
  ServiceModeFlags,
} from '@/types/catalog';
import type { AppointmentRow } from '@/types/mock-db';
import { useViewerSession } from './use-viewer-session';

export type {
  CreateCustomerRequestInput,
  ProfessionalAccessDraft,
  ProfessionalLifecycleReviewState,
  ProfessionalLifecycleStatus,
  ProfessionalManagedAppointmentRecord,
  ProfessionalManagedGalleryItem,
  ProfessionalManagedPortfolioEntry,
  ProfessionalManagedRequest,
  ProfessionalManagedService,
  ProfessionalPortalState,
  ProfessionalRequestPriority,
  ProfessionalRequestStatus,
  ProfessionalRequestStatusEvidence,
  SaveBusinessSettingsInput,
  UpdateRequestStatusInput,
} from '@/features/professional-portal/lib/contracts';

const defaultProfessional = MOCK_PROFESSIONALS[0] || null;
const professionalPortalRepository = getProfessionalPortalRepository();
const professionalRequestStatuses: ProfessionalRequestStatus[] = ['new', 'quoted', 'scheduled', 'completed'];
const publishedReviewStateTemplate = PROFESSIONAL_LIFECYCLE_REVIEW_STATE_MOCKS.published;
const draftReviewStateTemplate = PROFESSIONAL_LIFECYCLE_REVIEW_STATE_MOCKS.draft;

const isPracticeMode = (value: string): value is ServiceDeliveryMode =>
  value === 'online' || value === 'home_visit' || value === 'onsite';

const isBookingFlow = (value: string): value is BookingFlow => value === 'instant' || value === 'request';

const isServiceModesObject = (value: unknown): value is ServiceModeFlags =>
  typeof value === 'object' &&
  value !== null &&
  'online' in value &&
  'homeVisit' in value &&
  'onsite' in value &&
  typeof value.online === 'boolean' &&
  typeof value.homeVisit === 'boolean' &&
  typeof value.onsite === 'boolean';

const isGeoPoint = (value: unknown): value is GeoPoint =>
  typeof value === 'object' &&
  value !== null &&
  'latitude' in value &&
  'longitude' in value &&
  typeof value.latitude === 'number' &&
  typeof value.longitude === 'number';

const priceToNumber = (priceLabel: string) => Number.parseInt(priceLabel.replace(/\D/g, ''), 10) || 0;

const formatRupiah = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    currency: 'IDR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(amount);

const getProfessionalPortalLocale = (): 'en' | 'id' => {
  if (typeof document !== 'undefined') {
    const documentLocale = document.documentElement.lang.toLowerCase();

    if (documentLocale.startsWith('id')) {
      return 'id';
    }

    if (documentLocale.startsWith('en')) {
      return 'en';
    }
  }

  if (typeof window !== 'undefined') {
    const pathnameLocale = window.location.pathname.split('/').filter(Boolean)[0];

    if (pathnameLocale === 'id') {
      return 'id';
    }

    if (pathnameLocale === 'en') {
      return 'en';
    }
  }

  if (typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('id')) {
    return 'id';
  }

  return 'en';
};

const formatRequestStatusTimestamp = (date = new Date()) =>
  new Intl.DateTimeFormat(getProfessionalPortalLocale(), {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);

const createPublishedReviewState = (): ProfessionalLifecycleReviewState => ({
  publishedAt: publishedReviewStateTemplate.publishedAt,
  reviewedAt: publishedReviewStateTemplate.reviewedAt,
  reviewerName: publishedReviewStateTemplate.reviewerName,
  status: 'published',
  submittedAt: publishedReviewStateTemplate.submittedAt,
});

const createDraftReviewState = (): ProfessionalLifecycleReviewState => ({
  status: draftReviewStateTemplate.status,
});

const isProfessionalLifecycleStatus = (value: string): value is ProfessionalLifecycleStatus =>
  value === 'draft' ||
  value === 'ready_for_review' ||
  value === 'submitted' ||
  value === 'changes_requested' ||
  value === 'verified' ||
  value === 'published';

const professionalPortalCopyByLocale = {
  en: {
    defaults: {
      galleryAlt: 'Professional gallery asset',
      galleryLabel: 'New asset',
      newAssetAlt: 'Professional asset',
      newOutcome: 'New outcome',
      portfolioOutcomePlaceholder: 'Key outcome not written yet',
      portfolioPeriodLabel: 'March 2026',
      portfolioSummary: 'Case study summary can be completed later.',
      portfolioTitle: 'New portfolio entry',
      requestClientName: 'New client',
      requestNote: 'New request note.',
      requestTodayLabel: 'Today',
    },
    requestBoard: {
      notes: {
        completedPrimary:
          'Follow-up request for growth tracking, feeding routine adjustments, and a written recap that can be reviewed with the pediatrician later.',
        completedSecondary:
          'Requested a short online class recap, practical feeding checklist, and a final action summary after the group session ended.',
        newPrimary:
          'Need same-week lactation support for latch pain, pumping routine review, and a short handoff plan for the partner before discharge weekend.',
        newSecondary:
          'Family asked for a home or video follow-up after NICU discharge, with a checklist they can share to grandparents before the first night at home.',
        newTertiary:
          'Requested a practical class follow-up with a concise feeding checklist and one short reminder message before the session starts.',
        quotedPrimary:
          'Requested a lactation consult with pricing options for one urgent session plus two short check-ins during the same week.',
        quotedSecondary:
          'Parent asked for milestone screening with an optional recap PDF because they need a written summary for family members who will help at home.',
        scheduledPrimary:
          'Small group education session needs a fixed time, recap material, and a parent checklist before the evening class starts.',
        scheduledSecondary:
          'Requested a home visit window with one partner coaching segment and a short check-in note that can be forwarded after the visit.',
      },
      updates: {
        completedPrimaryCompletedCustomer:
          'Session completed. Sent the recap, action items, and the next observation window to the customer.',
        completedPrimaryCompletedInternal:
          'Internal completion note logged with recap delivery time, summary highlights, and recommended next check-in date.',
        completedPrimaryQuotedCustomer:
          'Shared the quote, recap format, and the expected review flow before the parent confirmed the session.',
        completedPrimaryQuotedInternal:
          'Uploaded the consultation quote and expected deliverables before booking was confirmed.',
        completedPrimaryScheduledCustomer:
          'Confirmed the session time and the file-sharing channel for the feeding and milestone notes.',
        completedPrimaryScheduledInternal:
          'Saved schedule confirmation and the note template that would be shared after the session.',
        completedSecondaryCompletedCustomer:
          'Class follow-up completed and the condensed checklist was sent after the final recap call.',
        completedSecondaryCompletedInternal:
          'Completion note saved with recap checklist delivery, attendance summary, and no additional follow-up requested.',
        completedSecondaryQuotedCustomer:
          'Shared the class quote and outcome summary so the parent could decide whether to continue with the short-format package.',
        completedSecondaryQuotedInternal:
          'Quote note and final class scope were saved for the support team before confirmation.',
        completedSecondaryScheduledCustomer:
          'Class slot confirmed and reminder details sent together with the parent preparation checklist.',
        completedSecondaryScheduledInternal: 'Stored the confirmed slot and parent reminder in the internal timeline.',
        quotedPrimaryCustomer:
          'Shared the quote, optional add-ons, and expected response window with the customer so they can confirm the preferred package.',
        quotedPrimaryInternal:
          'Uploaded the quote breakdown, payment steps, and follow-up checklist to the request thread for audit.',
        quotedSecondaryCustomer:
          'Sent the initial quote, session scope, and expected turnaround for the developmental notes before scheduling.',
        quotedSecondaryInternal:
          'Prepared the quote and attached the session outline requested by the caregiver coordinator.',
        scheduledPrimaryQuotedCustomer:
          'Shared class pricing, what is included, and the checklist parents should prepare before the session.',
        scheduledPrimaryQuotedInternal:
          'Attached the quote summary and access instructions for the virtual class room.',
        scheduledPrimaryScheduledCustomer:
          'The customer confirmed the slot and received the schedule confirmation plus reminder instructions.',
        scheduledPrimaryScheduledInternal:
          'Saved the confirmed class slot, calendar hold, and reminder note for the care team.',
        scheduledSecondaryQuotedCustomer:
          'Quoted a home visit package with visit duration, caregiver prep, and same-day recap expectations.',
        scheduledSecondaryQuotedInternal:
          'Stored the home visit quote, travel buffer, and prep checklist in the internal thread.',
        scheduledSecondaryScheduledCustomer:
          'Confirmed the visit window, address handoff, and the items to prepare before the provider arrives.',
        scheduledSecondaryScheduledInternal:
          'Added the visit route note and confirmation screenshot from the caregiver handoff.',
      },
    },
  },
  id: {
    defaults: {
      galleryAlt: 'Aset galeri profesional',
      galleryLabel: 'Aset baru',
      newAssetAlt: 'Aset profesional',
      newOutcome: 'Hasil baru',
      portfolioOutcomePlaceholder: 'Hasil utama belum ditulis',
      portfolioPeriodLabel: 'Maret 2026',
      portfolioSummary: 'Ringkasan studi kasus masih bisa dilengkapi.',
      portfolioTitle: 'Portofolio baru',
      requestClientName: 'Klien baru',
      requestNote: 'Catatan permintaan baru.',
      requestTodayLabel: 'Hari ini',
    },
    requestBoard: {
      notes: {
        completedPrimary:
          'Permintaan tindak lanjut untuk pemantauan tumbuh kembang, penyesuaian rutinitas makan, dan ringkasan tertulis yang bisa dibawa ke dokter anak.',
        completedSecondary:
          'Meminta ringkasan kelas online yang singkat, checklist menyusui praktis, dan rangkuman tindakan setelah sesi kelompok selesai.',
        newPrimary:
          'Butuh dukungan laktasi minggu ini untuk nyeri pelekatan, tinjauan rutinitas pumping, dan rencana singkat untuk pasangan sebelum akhir pekan pulang.',
        newSecondary:
          'Keluarga meminta tindak lanjut di rumah atau lewat video setelah pulang dari NICU, plus checklist yang bisa dibagikan ke kakek-nenek sebelum malam pertama di rumah.',
        newTertiary:
          'Meminta tindak lanjut kelas praktis dengan checklist menyusui singkat dan satu pesan pengingat sebelum sesi dimulai.',
        quotedPrimary:
          'Meminta konsultasi laktasi dengan beberapa opsi harga untuk satu sesi mendesak dan dua pemantauan singkat di minggu yang sama.',
        quotedSecondary:
          'Orang tua meminta skrining tumbuh kembang dengan opsi ringkasan PDF karena butuh catatan tertulis untuk anggota keluarga yang membantu di rumah.',
        scheduledPrimary:
          'Sesi edukasi kelompok kecil butuh jadwal tetap, materi ringkasan, dan checklist orang tua sebelum kelas malam dimulai.',
        scheduledSecondary:
          'Meminta slot kunjungan rumah dengan satu sesi coaching pasangan dan catatan singkat yang bisa diteruskan setelah kunjungan.',
      },
      updates: {
        completedPrimaryCompletedCustomer:
          'Sesi selesai. Ringkasan, langkah tindak lanjut, dan jendela observasi berikutnya sudah dikirim ke pelanggan.',
        completedPrimaryCompletedInternal:
          'Catatan penyelesaian internal disimpan dengan waktu pengiriman ringkasan, poin penting, dan rekomendasi jadwal tindak lanjut berikutnya.',
        completedPrimaryQuotedCustomer:
          'Penawaran, format ringkasan, dan alur tinjauan sesi sudah dibagikan sebelum orang tua mengonfirmasi jadwal.',
        completedPrimaryQuotedInternal:
          'Penawaran konsultasi dan daftar keluaran layanan disimpan sebelum booking dikonfirmasi.',
        completedPrimaryScheduledCustomer:
          'Jadwal sesi dan jalur berbagi catatan makan serta tumbuh kembang sudah dikonfirmasi ke pelanggan.',
        completedPrimaryScheduledInternal:
          'Konfirmasi jadwal dan template catatan yang akan dibagikan setelah sesi sudah disimpan.',
        completedSecondaryCompletedCustomer:
          'Tindak lanjut kelas selesai dan checklist ringkas sudah dikirim setelah panggilan ringkasan terakhir.',
        completedSecondaryCompletedInternal:
          'Catatan penyelesaian disimpan dengan waktu kirim checklist, ringkasan kehadiran, dan tanpa tindak lanjut tambahan.',
        completedSecondaryQuotedCustomer:
          'Penawaran kelas dan ringkasan hasil utama dibagikan agar orang tua bisa memutuskan paket singkat yang sesuai.',
        completedSecondaryQuotedInternal:
          'Catatan penawaran dan ruang lingkup kelas final disimpan untuk tim pendukung sebelum konfirmasi.',
        completedSecondaryScheduledCustomer:
          'Slot kelas dikonfirmasi dan detail pengingat sudah dikirim bersama checklist persiapan orang tua.',
        completedSecondaryScheduledInternal:
          'Slot yang sudah dikonfirmasi dan pengingat orang tua disimpan di timeline internal.',
        quotedPrimaryCustomer:
          'Penawaran, opsi tambahan, dan estimasi waktu respons sudah dibagikan agar pelanggan bisa memilih paket yang sesuai.',
        quotedPrimaryInternal:
          'Rincian penawaran, langkah pembayaran, dan checklist tindak lanjut sudah diunggah ke thread permintaan.',
        quotedSecondaryCustomer:
          'Penawaran awal, ruang lingkup sesi, dan estimasi waktu pengerjaan catatan perkembangan sudah dikirim sebelum penjadwalan.',
        quotedSecondaryInternal: 'Penawaran dan alur sesi yang diminta koordinator pendamping sudah disiapkan.',
        scheduledPrimaryQuotedCustomer:
          'Harga kelas, isi sesi, dan checklist persiapan orang tua sudah dibagikan sebelum sesi berlangsung.',
        scheduledPrimaryQuotedInternal:
          'Ringkasan penawaran dan instruksi akses ruang kelas virtual sudah dilampirkan.',
        scheduledPrimaryScheduledCustomer:
          'Pelanggan sudah mengonfirmasi slot dan menerima konfirmasi jadwal beserta instruksi pengingat.',
        scheduledPrimaryScheduledInternal:
          'Slot kelas yang disetujui, hold kalender, dan catatan pengingat sudah disimpan untuk tim.',
        scheduledSecondaryQuotedCustomer:
          'Paket kunjungan rumah dengan durasi kunjungan, persiapan pendamping, dan ekspektasi ringkasan di hari yang sama sudah ditawarkan.',
        scheduledSecondaryQuotedInternal:
          'Penawaran kunjungan rumah, buffer perjalanan, dan checklist persiapan disimpan di thread internal.',
        scheduledSecondaryScheduledCustomer:
          'Slot kunjungan, detail alamat, dan hal yang perlu disiapkan sebelum profesional datang sudah dikonfirmasi.',
        scheduledSecondaryScheduledInternal:
          'Catatan rute kunjungan dan bukti konfirmasi dari pendamping sudah ditambahkan.',
      },
    },
  },
} as const;

const getProfessionalPortalCopy = () => professionalPortalCopyByLocale[getProfessionalPortalLocale()];

const parseInteger = (value: unknown, fallback: number) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.round(value));
  }

  if (typeof value === 'string') {
    const parsedValue = Number.parseInt(value, 10);

    if (!Number.isNaN(parsedValue)) {
      return Math.max(0, parsedValue);
    }
  }

  return fallback;
};

const sanitizeGeoPoint = (value: unknown, fallback: GeoPoint): GeoPoint => {
  if (!isGeoPoint(value)) {
    return fallback;
  }

  const latitude = Number.isFinite(value.latitude) ? value.latitude : fallback.latitude;
  const longitude = Number.isFinite(value.longitude) ? value.longitude : fallback.longitude;

  return {
    latitude,
    longitude,
  };
};

const sanitizeServiceModes = (value: unknown, fallback: ServiceModeFlags): ServiceModeFlags => {
  if (!isServiceModesObject(value)) {
    return fallback;
  }

  return {
    homeVisit: value.homeVisit,
    online: value.online,
    onsite: value.onsite,
  };
};

const sanitizeAvailabilityTimeSlot = (
  value: Partial<ProfessionalAvailabilityTimeSlot> | null | undefined,
  fallback: ProfessionalAvailabilityTimeSlot,
): ProfessionalAvailabilityTimeSlot => ({
  id: value?.id?.trim() || fallback.id,
  index: typeof value?.index === 'number' ? value.index : fallback.index,
  label: value?.label?.trim() || fallback.label,
  note: value?.note?.trim() || fallback.note,
  status:
    value?.status === 'available' || value?.status === 'limited' || value?.status === 'booked'
      ? value.status
      : fallback.status,
});

const sanitizeAvailabilityDay = (
  value: Partial<ProfessionalAvailabilityDay> | null | undefined,
  fallback: ProfessionalAvailabilityDay,
): ProfessionalAvailabilityDay => ({
  dateIso: value?.dateIso?.trim() || fallback.dateIso,
  id: value?.id?.trim() || fallback.id,
  index: typeof value?.index === 'number' ? value.index : fallback.index,
  label: value?.label?.trim() || fallback.label,
  slots: Array.isArray(value?.slots)
    ? value.slots.map((slot, index) =>
        sanitizeAvailabilityTimeSlot(
          slot,
          fallback.slots[index] || {
            id: `${value?.id || fallback.id}-slot-${index + 1}`,
            index: index + 1,
            label: '08:00',
            status: 'available',
          },
        ),
      )
    : fallback.slots,
});

const normalizeAvailabilityDays = (scheduleDays: ProfessionalAvailabilityDay[]) =>
  scheduleDays.map((scheduleDay, scheduleDayIndex) => ({
    ...scheduleDay,
    index: scheduleDayIndex + 1,
    slots: scheduleDay.slots.map((slot, slotIndex) => ({
      ...slot,
      index: slotIndex + 1,
    })),
  }));

const sanitizeAvailabilityByMode = (
  value: unknown,
  fallback: Partial<Record<ServiceDeliveryMode, ProfessionalAvailabilityDay[]>> | undefined,
) => {
  const nextAvailabilityByMode: Partial<Record<ServiceDeliveryMode, ProfessionalAvailabilityDay[]>> = {};

  for (const mode of ['home_visit', 'onsite'] as const) {
    const fallbackDays = fallback?.[mode] || [];
    const rawDays =
      value && typeof value === 'object' && mode in value
        ? (value as Partial<Record<ServiceDeliveryMode, unknown>>)[mode]
        : undefined;

    if (!Array.isArray(rawDays)) {
      if (fallbackDays.length > 0) {
        nextAvailabilityByMode[mode] = normalizeAvailabilityDays(fallbackDays);
      }
      continue;
    }

    const sanitizedDays = rawDays.map((day, index) =>
      sanitizeAvailabilityDay(
        typeof day === 'object' && day ? (day as Partial<ProfessionalAvailabilityDay>) : undefined,
        fallbackDays[index] || {
          dateIso: '',
          id: `${mode}-day-${index + 1}`,
          index: index + 1,
          label: '',
          slots: [],
        },
      ),
    );

    if (sanitizedDays.length > 0) {
      nextAvailabilityByMode[mode] = normalizeAvailabilityDays(sanitizedDays);
    }
  }

  return Object.keys(nextAvailabilityByMode).length > 0 ? nextAvailabilityByMode : undefined;
};

const serviceDefaultsByServiceId = new Map<string, ProfessionalService>();

for (const professional of MOCK_PROFESSIONALS) {
  for (const service of professional.services) {
    if (!serviceDefaultsByServiceId.has(service.serviceId)) {
      serviceDefaultsByServiceId.set(service.serviceId, service);
    }
  }
}

const appointmentTimelineActors: AppointmentTimelineActor[] = ['customer', 'professional', 'system'];

const isAppointmentStatus = (value: string): value is AppointmentStatus =>
  [...ACTIVE_APPOINTMENT_STATUSES, ...HISTORY_APPOINTMENT_STATUSES].includes(value as AppointmentStatus);

const isAppointmentTimelineActor = (value: string): value is AppointmentTimelineActor =>
  appointmentTimelineActors.includes(value as AppointmentTimelineActor);

const getProfessionalRequestStatusFromAppointmentStatus = (status: AppointmentStatus): ProfessionalRequestStatus => {
  if (status === 'requested') {
    return 'new';
  }

  if (status === 'approved_waiting_payment' || status === 'paid') {
    return 'quoted';
  }

  if (status === 'confirmed' || status === 'in_service') {
    return 'scheduled';
  }

  return 'completed';
};

const getCustomerStatusFromRequestStatus = (
  requestStatus: ProfessionalRequestStatus,
  currentCustomerStatus?: AppointmentStatus,
): AppointmentStatus => {
  if (requestStatus === 'new') {
    return 'requested';
  }

  if (requestStatus === 'quoted') {
    return currentCustomerStatus === 'paid' ? 'paid' : 'approved_waiting_payment';
  }

  if (requestStatus === 'scheduled') {
    return currentCustomerStatus === 'in_service' ? 'in_service' : 'confirmed';
  }

  return 'completed';
};

const getRequestPriorityFromCustomerStatus = (status: AppointmentStatus): ProfessionalManagedRequest['priority'] => {
  if (status === 'requested' || status === 'approved_waiting_payment' || status === 'in_service') {
    return 'high';
  }

  if (status === 'paid' || status === 'confirmed') {
    return 'medium';
  }

  return 'low';
};

const createAppointmentTimelineEvent = ({
  actor,
  createdAt,
  customerSummary,
  evidenceUrl,
  fromStatus,
  id,
  internalNote,
  toStatus,
}: {
  actor: AppointmentTimelineActor;
  createdAt: Date;
  customerSummary?: string;
  evidenceUrl?: string;
  fromStatus?: AppointmentStatus;
  id: string;
  internalNote?: string;
  toStatus: AppointmentStatus;
}): AppointmentTimelineEvent => ({
  actor,
  createdAt: createdAt.toISOString(),
  createdAtLabel: formatRequestStatusTimestamp(createdAt),
  customerSummary: customerSummary?.trim() || undefined,
  evidenceUrl: evidenceUrl?.trim() || undefined,
  fromStatus,
  id,
  internalNote: internalNote?.trim() || undefined,
  toStatus,
});

const buildAppointmentRecordFromRow = (record: AppointmentRow): ProfessionalManagedAppointmentRecord => ({
  areaId: record.areaId,
  bookingFlow: record.bookingFlow,
  consumerId: record.consumerId,
  id: record.id,
  index: record.index,
  professionalId: record.professionalId,
  requestNote: record.requestNote,
  requestedAt: record.requestedAt,
  requestedMode: record.requestedMode,
  scheduleSnapshot: record.scheduleSnapshot,
  serviceId: record.serviceId,
  serviceOfferingId: record.serviceOfferingId,
  serviceSnapshot: record.serviceSnapshot,
  status: record.status,
  timeline: record.timeline,
});

const getAppointmentRecordLastUpdatedAt = (record: ProfessionalManagedAppointmentRecord) =>
  record.timeline[record.timeline.length - 1]?.createdAt || record.requestedAt;

const buildRequestStatusHistoryFromTimeline = (
  record: ProfessionalManagedAppointmentRecord,
): ProfessionalRequestStatusEvidence[] => {
  const requestId = `professional-request-linked-${record.id}`;
  let fallbackFromStatus: ProfessionalRequestStatus = 'new';

  return [...record.timeline]
    .sort((leftEvent, rightEvent) => new Date(leftEvent.createdAt).getTime() - new Date(rightEvent.createdAt).getTime())
    .flatMap((event, index) => {
      const nextRequestStatus = getProfessionalRequestStatusFromAppointmentStatus(event.toStatus);
      const previousRequestStatus = event.fromStatus
        ? getProfessionalRequestStatusFromAppointmentStatus(event.fromStatus)
        : fallbackFromStatus;

      fallbackFromStatus = nextRequestStatus;

      if (nextRequestStatus === previousRequestStatus || nextRequestStatus === 'new') {
        return [];
      }

      return [
        {
          createdAt: event.createdAt,
          createdAtLabel: formatRequestStatusTimestamp(new Date(event.createdAt)),
          customerSummary: event.customerSummary,
          evidenceNote: event.internalNote,
          evidenceUrl: event.evidenceUrl,
          fromStatus: previousRequestStatus,
          id: `${requestId}-history-${index + 1}`,
          status: nextRequestStatus,
        } satisfies ProfessionalRequestStatusEvidence,
      ];
    });
};

const buildRequestFromAppointmentRecord = (
  record: ProfessionalManagedAppointmentRecord,
): ProfessionalManagedRequest => {
  const requestedAtDate = new Date(record.requestedAt);

  return {
    appointmentId: record.id,
    areaId: record.areaId,
    bookingFlow: record.bookingFlow,
    budgetLabel: record.serviceSnapshot.priceLabel,
    clientId: record.consumerId,
    clientName: ACTIVE_CONSUMER.name,
    customerStatus: record.status,
    id: `professional-request-linked-${record.id}`,
    note: record.requestNote,
    priority: getRequestPriorityFromCustomerStatus(record.status),
    requestedAt: record.requestedAt,
    requestedAtLabel: formatRequestStatusTimestamp(requestedAtDate),
    requestedMode: record.requestedMode,
    scheduledTimeLabel: record.scheduleSnapshot.scheduledTimeLabel,
    serviceId: record.serviceId,
    serviceName: record.serviceSnapshot.name,
    serviceOfferingId: record.serviceOfferingId,
    serviceSummary: record.serviceSnapshot.summary,
    status: getProfessionalRequestStatusFromAppointmentStatus(record.status),
    statusHistory: buildRequestStatusHistoryFromTimeline(record),
  };
};

const buildRequestBoardFromAppointmentRecords = (records: ProfessionalManagedAppointmentRecord[]) =>
  [...records]
    .sort(
      (leftRecord, rightRecord) =>
        new Date(getAppointmentRecordLastUpdatedAt(rightRecord)).getTime() -
        new Date(getAppointmentRecordLastUpdatedAt(leftRecord)).getTime(),
    )
    .map(buildRequestFromAppointmentRecord);

const buildDefaultAppointmentRecords = (professional: Professional | null): ProfessionalManagedAppointmentRecord[] => {
  if (!professional) {
    return [];
  }

  return getAppointmentRowsByProfessionalId(professional.id).map(buildAppointmentRecordFromRow);
};

const buildDefaultAppointmentRecordsByProfessionalId = () =>
  MOCK_PROFESSIONALS.reduce<Record<string, ProfessionalManagedAppointmentRecord[]>>((records, professional) => {
    records[professional.id] = buildDefaultAppointmentRecords(professional);
    return records;
  }, {});

const buildDefaultRequestBoard = (professional: Professional | null): ProfessionalManagedRequest[] =>
  buildRequestBoardFromAppointmentRecords(buildDefaultAppointmentRecords(professional));

const buildDefaultServiceConfigurations = (professional: Professional | null): ProfessionalManagedService[] => {
  const professionalServiceById = new Map(
    (professional?.services || []).map((service) => [service.serviceId, service]),
  );
  const featuredServiceId = professional?.services[0]?.serviceId || '';

  return MOCK_SERVICES.map((serviceTemplate, index) => {
    const existingService = professionalServiceById.get(serviceTemplate.id);
    const templateService = existingService || serviceDefaultsByServiceId.get(serviceTemplate.id);

    return {
      bookingFlow: existingService?.bookingFlow || templateService?.bookingFlow || 'request',
      defaultMode: existingService?.defaultMode || templateService?.defaultMode || serviceTemplate.defaultMode,
      duration: existingService?.duration || templateService?.duration || '45 min',
      featured: featuredServiceId === serviceTemplate.id,
      id:
        existingService?.id ||
        templateService?.id ||
        `professional-service-${professional?.id || 'template'}-${serviceTemplate.id}`,
      index: existingService?.index || index + 1,
      isActive: Boolean(existingService),
      price: existingService?.price || templateService?.price || 'Rp 150.000',
      serviceId: serviceTemplate.id,
      serviceModes: existingService?.serviceModes || templateService?.serviceModes || serviceTemplate.serviceModes,
      source: existingService ? 'existing' : 'template',
      summary: existingService?.summary || templateService?.summary || serviceTemplate.shortDescription,
    };
  });
};

const buildDefaultPortfolioEntries = (professional: Professional | null): ProfessionalManagedPortfolioEntry[] =>
  (professional?.portfolioEntries || []).map((entry) => ({
    ...entry,
    visibility: 'public',
  }));

const buildDefaultGalleryItems = (professional: Professional | null): ProfessionalManagedGalleryItem[] =>
  (professional?.gallery || []).map((item, index) => ({
    ...item,
    isFeatured: index === 0,
  }));

const normalizeManagedServices = (services: ProfessionalManagedService[]): ProfessionalManagedService[] => {
  const normalizedServices = services.map((service, index) => ({
    ...service,
    featured: service.isActive ? service.featured : false,
    index: index + 1,
  }));
  const firstFeaturedActiveService = normalizedServices.find((service) => service.isActive && service.featured);
  const fallbackFeaturedServiceId =
    firstFeaturedActiveService?.serviceId || normalizedServices.find((service) => service.isActive)?.serviceId || '';

  return normalizedServices.map((service) => ({
    ...service,
    featured: service.isActive && service.serviceId === fallbackFeaturedServiceId,
  }));
};

const normalizeManagedGalleryItems = (items: ProfessionalManagedGalleryItem[]): ProfessionalManagedGalleryItem[] => {
  const normalizedItems = items.map((item, index) => ({
    ...item,
    index: index + 1,
  }));
  const firstFeaturedItem = normalizedItems.find((item) => item.isFeatured);
  const fallbackFeaturedItemId = firstFeaturedItem?.id || normalizedItems[0]?.id || '';

  return normalizedItems.map((item) => ({
    ...item,
    isFeatured: item.id === fallbackFeaturedItemId,
  }));
};

const buildDefaultPortalState = (professionalId = defaultProfessional?.id || ''): ProfessionalPortalState => {
  const professional = getProfessionalById(professionalId) || defaultProfessional;
  const primaryArea = professional?.coverage.areaIds[0] ? getAreaById(professional.coverage.areaIds[0]) : undefined;

  return {
    acceptingNewClients: professional?.availability.isAvailable ?? true,
    activeProfessionalId: professional?.id || '',
    availabilityByMode: sanitizeAvailabilityByMode(professional?.availabilityByMode, professional?.availabilityByMode),
    autoApproveInstantBookings: (professional?.services || []).some((service) => service.bookingFlow === 'instant'),
    city: primaryArea?.city || professional?.location || '',
    coverageAreaIds: professional?.coverage.areaIds.slice(0, 3) || [],
    coverageCenter: professional?.coverage.center || {
      latitude: -6.208763,
      longitude: 106.845599,
    },
    credentialNumber: professional ? `STR-${professional.id.padStart(3, '0')}-2026` : '',
    displayName: professional?.name || '',
    galleryItems: buildDefaultGalleryItems(professional),
    homeVisitRadiusKm: professional?.coverage.homeVisitRadiusKm || 0,
    phone: '+62 812 3000 0000',
    portfolioEntries: buildDefaultPortfolioEntries(professional),
    practiceAddress: professional?.practiceLocation?.address || professional?.about || '',
    practiceLabel: professional?.practiceLocation?.label || professional?.location || '',
    publicBio: professional?.about || '',
    requestBoard: buildDefaultRequestBoard(professional),
    responseTimeGoal: professional?.responseTime || '< 30 menit',
    serviceConfigurations: buildDefaultServiceConfigurations(professional),
    yearsExperience: professional?.experience || '',
  };
};

const sanitizeManagedService = (
  value: Partial<ProfessionalManagedService> | undefined,
  fallback: ProfessionalManagedService,
): ProfessionalManagedService => ({
  bookingFlow: value?.bookingFlow && isBookingFlow(value.bookingFlow) ? value.bookingFlow : fallback.bookingFlow,
  defaultMode: value?.defaultMode && isPracticeMode(value.defaultMode) ? value.defaultMode : fallback.defaultMode,
  duration: value?.duration?.trim() || fallback.duration,
  featured: value?.featured === true,
  id: value?.id?.trim() || fallback.id,
  index: typeof value?.index === 'number' ? value.index : fallback.index,
  isActive: value?.isActive ?? fallback.isActive,
  price: value?.price?.trim() || fallback.price,
  serviceId: fallback.serviceId,
  serviceModes: sanitizeServiceModes(value?.serviceModes, fallback.serviceModes),
  source: value?.source === 'existing' || value?.source === 'template' ? value.source : fallback.source,
  summary: value?.summary?.trim() || fallback.summary,
});

const sanitizeManagedPortfolioEntry = (
  value: Partial<ProfessionalManagedPortfolioEntry>,
  fallback?: ProfessionalManagedPortfolioEntry,
): ProfessionalManagedPortfolioEntry => {
  const copy = getProfessionalPortalCopy();

  return {
    id: value.id || fallback?.id || `professional-portfolio-entry-${Date.now()}`,
    image:
      value.image?.trim() ||
      fallback?.image ||
      'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=800&auto=format&fit=crop',
    index: typeof value.index === 'number' ? value.index : fallback?.index || 1,
    outcomes:
      Array.isArray(value.outcomes) && value.outcomes.length > 0
        ? value.outcomes.map((item) => String(item).trim()).filter(Boolean)
        : fallback?.outcomes || [copy.defaults.portfolioOutcomePlaceholder],
    periodLabel: value.periodLabel?.trim() || fallback?.periodLabel || copy.defaults.portfolioPeriodLabel,
    serviceId: typeof value.serviceId === 'string' ? value.serviceId : fallback?.serviceId,
    summary: value.summary?.trim() || fallback?.summary || copy.defaults.portfolioSummary,
    title: value.title?.trim() || fallback?.title || copy.defaults.portfolioTitle,
    visibility:
      value.visibility === 'private' || value.visibility === 'public'
        ? value.visibility
        : fallback?.visibility || 'public',
  };
};

const sanitizeManagedGalleryItem = (
  value: Partial<ProfessionalManagedGalleryItem>,
  fallback?: ProfessionalManagedGalleryItem,
): ProfessionalManagedGalleryItem => {
  const copy = getProfessionalPortalCopy();

  return {
    alt: value.alt?.trim() || fallback?.alt || copy.defaults.galleryAlt,
    id: value.id || fallback?.id || `professional-gallery-item-${Date.now()}`,
    image:
      value.image?.trim() ||
      fallback?.image ||
      'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?q=80&w=800&auto=format&fit=crop',
    index: typeof value.index === 'number' ? value.index : fallback?.index || 1,
    isFeatured: value.isFeatured ?? fallback?.isFeatured ?? false,
    label: value.label?.trim() || fallback?.label || copy.defaults.galleryLabel,
  };
};

const sanitizeManagedRequest = (
  value: Partial<ProfessionalManagedRequest>,
  fallback?: ProfessionalManagedRequest,
): ProfessionalManagedRequest => {
  const copy = getProfessionalPortalCopy();

  return {
    appointmentId: value.appointmentId?.trim() || fallback?.appointmentId || `appointment-${Date.now()}`,
    areaId: value.areaId || fallback?.areaId || '',
    budgetLabel: value.budgetLabel?.trim() || fallback?.budgetLabel || formatRupiah(150000),
    bookingFlow:
      value.bookingFlow && isBookingFlow(value.bookingFlow) ? value.bookingFlow : fallback?.bookingFlow || 'request',
    clientId: value.clientId?.trim() || fallback?.clientId || `demo-client-${Date.now()}`,
    clientName: value.clientName?.trim() || fallback?.clientName || copy.defaults.requestClientName,
    customerStatus:
      value.customerStatus &&
      [...ACTIVE_APPOINTMENT_STATUSES, ...HISTORY_APPOINTMENT_STATUSES].includes(value.customerStatus)
        ? value.customerStatus
        : fallback?.customerStatus || 'requested',
    id: value.id || fallback?.id || `professional-request-${Date.now()}`,
    note: value.note?.trim() || fallback?.note || copy.defaults.requestNote,
    priority:
      value.priority === 'high' || value.priority === 'medium' || value.priority === 'low'
        ? value.priority
        : fallback?.priority || 'medium',
    requestedAt:
      typeof value.requestedAt === 'string' && value.requestedAt.trim().length > 0
        ? value.requestedAt.trim()
        : fallback?.requestedAt || new Date().toISOString(),
    requestedAtLabel: value.requestedAtLabel?.trim() || fallback?.requestedAtLabel || copy.defaults.requestTodayLabel,
    requestedMode:
      value.requestedMode && isPracticeMode(value.requestedMode)
        ? value.requestedMode
        : fallback?.requestedMode || 'online',
    scheduledTimeLabel:
      value.scheduledTimeLabel?.trim() || fallback?.scheduledTimeLabel || copy.defaults.requestTodayLabel,
    serviceId: value.serviceId || fallback?.serviceId || '',
    serviceName: value.serviceName?.trim() || fallback?.serviceName || value.serviceId || fallback?.serviceId || '',
    serviceOfferingId: value.serviceOfferingId?.trim() || fallback?.serviceOfferingId || '',
    serviceSummary: value.serviceSummary?.trim() || fallback?.serviceSummary || '',
    status:
      value.status && professionalRequestStatuses.includes(value.status) ? value.status : fallback?.status || 'new',
    statusHistory: Array.isArray(value.statusHistory)
      ? value.statusHistory
          .map((item, index): ProfessionalRequestStatusEvidence | null => {
            if (!item || typeof item !== 'object') {
              return null;
            }

            const nextStatus =
              item.status && professionalRequestStatuses.includes(item.status)
                ? item.status
                : fallback?.status || 'new';
            const previousStatus =
              item.fromStatus && professionalRequestStatuses.includes(item.fromStatus)
                ? item.fromStatus
                : fallback?.status || 'new';

            return {
              createdAt:
                typeof item.createdAt === 'string' && item.createdAt.trim().length > 0
                  ? item.createdAt.trim()
                  : fallback?.requestedAt || new Date().toISOString(),
              createdAtLabel:
                typeof item.createdAtLabel === 'string' && item.createdAtLabel.trim().length > 0
                  ? item.createdAtLabel.trim()
                  : fallback?.requestedAtLabel || copy.defaults.requestTodayLabel,
              customerSummary:
                typeof item.customerSummary === 'string' && item.customerSummary.trim().length > 0
                  ? item.customerSummary.trim()
                  : undefined,
              evidenceNote:
                typeof item.evidenceNote === 'string' && item.evidenceNote.trim().length > 0
                  ? item.evidenceNote.trim()
                  : undefined,
              evidenceUrl:
                typeof item.evidenceUrl === 'string' && item.evidenceUrl.trim().length > 0
                  ? item.evidenceUrl.trim()
                  : undefined,
              fromStatus: previousStatus,
              id:
                typeof item.id === 'string' && item.id.trim().length > 0
                  ? item.id.trim()
                  : `${fallback?.id || value.id || 'request'}-history-${index + 1}`,
              status: nextStatus,
            };
          })
          .filter((item): item is ProfessionalRequestStatusEvidence => Boolean(item))
      : fallback?.statusHistory || [],
  };
};

const sanitizeStringArray = (value: unknown, fallback: string[]) =>
  Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : fallback;

const sanitizeAppointmentScheduleSnapshot = (
  value: Partial<AppointmentScheduleSnapshot> | null | undefined,
  fallback: AppointmentScheduleSnapshot,
): AppointmentScheduleSnapshot => ({
  dateIso: value?.dateIso?.trim() || fallback.dateIso,
  requiresSchedule: value?.requiresSchedule ?? fallback.requiresSchedule,
  scheduleDayId: value?.scheduleDayId?.trim() || fallback.scheduleDayId,
  scheduleDayLabel: value?.scheduleDayLabel?.trim() || fallback.scheduleDayLabel,
  scheduledTimeLabel: value?.scheduledTimeLabel?.trim() || fallback.scheduledTimeLabel,
  timeSlotId: value?.timeSlotId?.trim() || fallback.timeSlotId,
  timeSlotLabel: value?.timeSlotLabel?.trim() || fallback.timeSlotLabel,
});

const sanitizeAppointmentServiceSnapshot = (
  value: Partial<AppointmentServiceSnapshot> | null | undefined,
  fallback: AppointmentServiceSnapshot,
): AppointmentServiceSnapshot => ({
  bookingFlow: value?.bookingFlow && isBookingFlow(value.bookingFlow) ? value.bookingFlow : fallback.bookingFlow,
  categoryId: value?.categoryId?.trim() || fallback.categoryId,
  coverImage: value?.coverImage?.trim() || fallback.coverImage,
  defaultMode: value?.defaultMode && isPracticeMode(value.defaultMode) ? value.defaultMode : fallback.defaultMode,
  description: value?.description?.trim() || fallback.description,
  durationLabel: value?.durationLabel?.trim() || fallback.durationLabel,
  highlights: sanitizeStringArray(value?.highlights, fallback.highlights),
  image: value?.image?.trim() || fallback.image,
  name: value?.name?.trim() || fallback.name,
  priceAmount: parseInteger(value?.priceAmount, fallback.priceAmount),
  priceLabel: value?.priceLabel?.trim() || fallback.priceLabel,
  serviceId: value?.serviceId?.trim() || fallback.serviceId,
  serviceModes: sanitizeServiceModes(value?.serviceModes, fallback.serviceModes),
  serviceOfferingId: value?.serviceOfferingId?.trim() || fallback.serviceOfferingId,
  shortDescription: value?.shortDescription?.trim() || fallback.shortDescription,
  slug: value?.slug?.trim() || fallback.slug,
  summary: value?.summary?.trim() || fallback.summary,
  tags: sanitizeStringArray(value?.tags, fallback.tags),
});

const sanitizeAppointmentTimelineEvent = (
  value: Partial<AppointmentTimelineEvent> | null | undefined,
  fallback: AppointmentTimelineEvent,
  recordId: string,
  index: number,
): AppointmentTimelineEvent => ({
  actor:
    value?.actor && typeof value.actor === 'string' && isAppointmentTimelineActor(value.actor)
      ? value.actor
      : fallback.actor,
  createdAt: value?.createdAt?.trim() || fallback.createdAt,
  createdAtLabel: value?.createdAtLabel?.trim() || fallback.createdAtLabel,
  customerSummary: value?.customerSummary?.trim() || fallback.customerSummary,
  evidenceUrl: value?.evidenceUrl?.trim() || fallback.evidenceUrl,
  fromStatus:
    value?.fromStatus && typeof value.fromStatus === 'string' && isAppointmentStatus(value.fromStatus)
      ? value.fromStatus
      : fallback.fromStatus,
  id: value?.id?.trim() || fallback.id || `${recordId}-timeline-${index + 1}`,
  internalNote: value?.internalNote?.trim() || fallback.internalNote,
  toStatus:
    value?.toStatus && typeof value.toStatus === 'string' && isAppointmentStatus(value.toStatus)
      ? value.toStatus
      : fallback.toStatus,
});

const sanitizeManagedAppointmentRecord = (
  value: Partial<ProfessionalManagedAppointmentRecord> | null | undefined,
  fallback: ProfessionalManagedAppointmentRecord,
): ProfessionalManagedAppointmentRecord => ({
  areaId: value?.areaId?.trim() || fallback.areaId,
  bookingFlow: value?.bookingFlow && isBookingFlow(value.bookingFlow) ? value.bookingFlow : fallback.bookingFlow,
  consumerId: value?.consumerId?.trim() || fallback.consumerId,
  id: value?.id?.trim() || fallback.id,
  index: typeof value?.index === 'number' ? value.index : fallback.index,
  professionalId: value?.professionalId?.trim() || fallback.professionalId,
  requestNote: value?.requestNote?.trim() || fallback.requestNote,
  requestedAt: value?.requestedAt?.trim() || fallback.requestedAt,
  requestedMode:
    value?.requestedMode && isPracticeMode(value.requestedMode) ? value.requestedMode : fallback.requestedMode,
  scheduleSnapshot: sanitizeAppointmentScheduleSnapshot(value?.scheduleSnapshot, fallback.scheduleSnapshot),
  serviceId: value?.serviceId?.trim() || fallback.serviceId,
  serviceOfferingId: value?.serviceOfferingId?.trim() || fallback.serviceOfferingId,
  serviceSnapshot: sanitizeAppointmentServiceSnapshot(value?.serviceSnapshot, fallback.serviceSnapshot),
  status: value?.status && isAppointmentStatus(value.status) ? value.status : fallback.status,
  timeline: Array.isArray(value?.timeline)
    ? value.timeline
        .map((event, index) =>
          sanitizeAppointmentTimelineEvent(
            event,
            fallback.timeline[index] ||
              createAppointmentTimelineEvent({
                actor: 'system',
                createdAt: new Date(fallback.requestedAt),
                fromStatus: undefined,
                id: `${fallback.id}-timeline-${index + 1}`,
                toStatus: fallback.status,
              }),
            value?.id?.trim() || fallback.id,
            index,
          ),
        )
        .filter((event) => Boolean(event))
    : fallback.timeline,
});

const sanitizeAppointmentRecordsByProfessionalId = (
  value: unknown,
): Record<string, ProfessionalManagedAppointmentRecord[]> => {
  if (!value || typeof value !== 'object') {
    return {};
  }

  return Object.entries(value).reduce<Record<string, ProfessionalManagedAppointmentRecord[]>>(
    (records, [professionalId, board]) => {
      const fallbackRecords = buildDefaultAppointmentRecords(
        getProfessionalById(professionalId) || defaultProfessional,
      );
      records[professionalId] = Array.isArray(board)
        ? board.flatMap((item, index) => {
            if (!item || typeof item !== 'object') {
              return [];
            }

            const rawItem = item as ProfessionalManagedAppointmentRecord;
            const fallbackRecord = fallbackRecords[index] || rawItem;

            return [sanitizeManagedAppointmentRecord(rawItem, fallbackRecord)];
          })
        : fallbackRecords;
      return records;
    },
    {},
  );
};

const sanitizeRequestBoard = (
  professionalId: string,
  requestBoard: Partial<ProfessionalManagedRequest>[] | null | undefined,
): ProfessionalManagedRequest[] => {
  const professional = getProfessionalById(professionalId) || defaultProfessional;
  const fallbackRequestBoard = buildDefaultRequestBoard(professional);

  if (!Array.isArray(requestBoard)) {
    return fallbackRequestBoard;
  }

  const sanitizedRequestBoard = requestBoard.map((item, index) =>
    sanitizeManagedRequest(item, fallbackRequestBoard[index]),
  );

  return sanitizedRequestBoard;
};

const sanitizeReviewState = (
  value: Partial<ProfessionalLifecycleReviewState> | null | undefined,
  fallback: ProfessionalLifecycleReviewState = createPublishedReviewState(),
): ProfessionalLifecycleReviewState => ({
  adminNote: value?.adminNote?.trim() || fallback.adminNote,
  publishedAt: value?.publishedAt?.trim() || fallback.publishedAt,
  reviewedAt: value?.reviewedAt?.trim() || fallback.reviewedAt,
  reviewerName: value?.reviewerName?.trim() || fallback.reviewerName,
  status: value?.status && isProfessionalLifecycleStatus(value.status) ? value.status : fallback.status,
  submittedAt: value?.submittedAt?.trim() || fallback.submittedAt,
});

const buildDefaultReviewStates = () =>
  MOCK_PROFESSIONALS.reduce<Record<string, ProfessionalLifecycleReviewState>>((states, professional) => {
    states[professional.id] = createPublishedReviewState();
    return states;
  }, {});

const sanitizeReviewStatesByProfessionalId = (value: unknown): Record<string, ProfessionalLifecycleReviewState> => {
  if (!value || typeof value !== 'object') {
    return {};
  }

  return Object.entries(value).reduce<Record<string, ProfessionalLifecycleReviewState>>(
    (states, [professionalId, state]) => {
      states[professionalId] = sanitizeReviewState(
        state as Partial<ProfessionalLifecycleReviewState>,
        createPublishedReviewState(),
      );
      return states;
    },
    {},
  );
};

const sanitizePortalState = (value: Partial<ProfessionalPortalState> | null | undefined): ProfessionalPortalState => {
  const professionalId = value?.activeProfessionalId || defaultProfessional?.id || '';
  const baseState = buildDefaultPortalState(professionalId);
  const rawServiceMap = new Map((value?.serviceConfigurations || []).map((item) => [item.serviceId, item]));
  const portfolioEntries = Array.isArray(value?.portfolioEntries) ? value.portfolioEntries : null;
  const galleryItems = Array.isArray(value?.galleryItems) ? value.galleryItems : null;
  const requestBoard = sanitizeRequestBoard(
    professionalId,
    Array.isArray(value?.requestBoard) ? value.requestBoard : baseState.requestBoard,
  );
  const coverageAreaIds = Array.isArray(value?.coverageAreaIds)
    ? value.coverageAreaIds.filter((areaId): areaId is string => typeof areaId === 'string' && areaId.length > 0)
    : baseState.coverageAreaIds;

  return {
    acceptingNewClients: value?.acceptingNewClients ?? baseState.acceptingNewClients,
    activeProfessionalId: professionalId,
    availabilityByMode: sanitizeAvailabilityByMode(value?.availabilityByMode, baseState.availabilityByMode),
    autoApproveInstantBookings: value?.autoApproveInstantBookings ?? baseState.autoApproveInstantBookings,
    city: value?.city?.trim() || baseState.city,
    coverageAreaIds,
    coverageCenter: sanitizeGeoPoint(value?.coverageCenter, baseState.coverageCenter),
    credentialNumber: value?.credentialNumber?.trim() || baseState.credentialNumber,
    displayName: value?.displayName?.trim() || baseState.displayName,
    galleryItems: normalizeManagedGalleryItems(
      galleryItems
        ? galleryItems.map((item, index) => sanitizeManagedGalleryItem(item, baseState.galleryItems[index]))
        : baseState.galleryItems,
    ),
    homeVisitRadiusKm: parseInteger(value?.homeVisitRadiusKm, baseState.homeVisitRadiusKm),
    phone: value?.phone?.trim() || baseState.phone,
    portfolioEntries: portfolioEntries
      ? portfolioEntries.map((item, index) => sanitizeManagedPortfolioEntry(item, baseState.portfolioEntries[index]))
      : baseState.portfolioEntries,
    practiceAddress: value?.practiceAddress?.trim() || baseState.practiceAddress,
    practiceLabel: value?.practiceLabel?.trim() || baseState.practiceLabel,
    publicBio: value?.publicBio?.trim() || baseState.publicBio,
    requestBoard,
    responseTimeGoal: value?.responseTimeGoal?.trim() || baseState.responseTimeGoal,
    serviceConfigurations: normalizeManagedServices(
      Array.isArray(value?.serviceConfigurations) && value.serviceConfigurations.length > 0
        ? baseState.serviceConfigurations.map((fallbackService) =>
            sanitizeManagedService(rawServiceMap.get(fallbackService.serviceId), fallbackService),
          )
        : baseState.serviceConfigurations,
    ),
    yearsExperience: value?.yearsExperience?.trim() || baseState.yearsExperience,
  };
};

const readProfessionalPortalData = (): {
  portalState: ProfessionalPortalState;
  appointmentRecordsByProfessionalId: Record<string, ProfessionalManagedAppointmentRecord[]>;
  reviewStatesByProfessionalId: Record<string, ProfessionalLifecycleReviewState>;
} => {
  const defaultState = buildDefaultPortalState();
  const defaultAppointmentRecords = buildDefaultAppointmentRecordsByProfessionalId();
  const defaultReviewStates = buildDefaultReviewStates();

  if (typeof window === 'undefined') {
    return {
      appointmentRecordsByProfessionalId: defaultAppointmentRecords,
      portalState: defaultState,
      reviewStatesByProfessionalId: defaultReviewStates,
    };
  }

  try {
    const storedSnapshot = professionalPortalRepository.read() as Partial<ProfessionalPortalSnapshot> | null;

    if (!storedSnapshot) {
      return {
        appointmentRecordsByProfessionalId: defaultAppointmentRecords,
        portalState: defaultState,
        reviewStatesByProfessionalId: defaultReviewStates,
      };
    }

    if (
      storedSnapshot.schemaVersion !== PROFESSIONAL_PORTAL_SCHEMA_VERSION ||
      !storedSnapshot.appointmentRecordsByProfessionalId
    ) {
      persistProfessionalPortalState(defaultState, defaultAppointmentRecords, defaultReviewStates);

      return {
        appointmentRecordsByProfessionalId: defaultAppointmentRecords,
        portalState: defaultState,
        reviewStatesByProfessionalId: defaultReviewStates,
      };
    }

    const sanitizedAppointmentRecords = {
      ...defaultAppointmentRecords,
      ...sanitizeAppointmentRecordsByProfessionalId(storedSnapshot.appointmentRecordsByProfessionalId),
    };
    const sanitizedReviewStates = {
      ...defaultReviewStates,
      ...sanitizeReviewStatesByProfessionalId(storedSnapshot.reviewStatesByProfessionalId),
    };
    const activeProfessionalId = storedSnapshot.state?.activeProfessionalId || defaultState.activeProfessionalId;
    const requestBoard = buildRequestBoardFromAppointmentRecords(
      sanitizedAppointmentRecords[activeProfessionalId] || [],
    );
    const portalState = sanitizePortalState({
      ...storedSnapshot.state,
      requestBoard,
    });

    return {
      appointmentRecordsByProfessionalId: sanitizedAppointmentRecords,
      portalState,
      reviewStatesByProfessionalId: {
        ...sanitizedReviewStates,
        [portalState.activeProfessionalId]:
          sanitizedReviewStates[portalState.activeProfessionalId] || createPublishedReviewState(),
      },
    };
  } catch {
    return {
      appointmentRecordsByProfessionalId: defaultAppointmentRecords,
      portalState: defaultState,
      reviewStatesByProfessionalId: defaultReviewStates,
    };
  }
};

const persistProfessionalPortalState = (
  nextState: ProfessionalPortalState,
  appointmentRecordsByProfessionalId: Record<string, ProfessionalManagedAppointmentRecord[]>,
  reviewStatesByProfessionalId: Record<string, ProfessionalLifecycleReviewState>,
) => {
  if (typeof window === 'undefined') {
    return;
  }

  professionalPortalRepository.write(
    createProfessionalPortalSnapshot(
      nextState,
      appointmentRecordsByProfessionalId,
      undefined,
      reviewStatesByProfessionalId,
    ),
  );
};

const getRequestLastUpdatedAt = (request: ProfessionalManagedRequest) =>
  request.statusHistory[request.statusHistory.length - 1]?.createdAt || request.requestedAt;

const buildCustomerAppointmentsFromAppointmentRecords = (
  appointmentRecordsByProfessionalId: Record<string, ProfessionalManagedAppointmentRecord[]>,
): Appointment[] =>
  Object.values(appointmentRecordsByProfessionalId)
    .flatMap((records) =>
      records
        .filter((record) => record.consumerId === ACTIVE_CONSUMER.id)
        .map((record) => ({
          record,
        })),
    )
    .sort(
      (leftEntry, rightEntry) =>
        new Date(getAppointmentRecordLastUpdatedAt(rightEntry.record)).getTime() -
        new Date(getAppointmentRecordLastUpdatedAt(leftEntry.record)).getTime(),
    )
    .map(({ record }) =>
      createHydratedAppointment({
        areaId: record.areaId,
        bookingFlow: record.bookingFlow,
        consumerId: record.consumerId,
        id: record.id,
        professionalId: record.professionalId,
        requestNote: record.requestNote,
        requestedAt: record.requestedAt,
        requestedMode: record.requestedMode,
        scheduleSnapshot: record.scheduleSnapshot,
        serviceSnapshot: record.serviceSnapshot,
        status: record.status,
        timeline: record.timeline,
      }),
    );

const mergeProfessionalWithPortalState = (
  professional: Professional,
  portalState: ProfessionalPortalState,
): Professional => {
  if (professional.id !== portalState.activeProfessionalId) {
    return professional;
  }

  const activeServiceConfigurations = portalState.serviceConfigurations
    .filter((service) => service.isActive)
    .sort((leftService, rightService) => {
      if (leftService.featured !== rightService.featured) {
        return leftService.featured ? -1 : 1;
      }

      return leftService.index - rightService.index;
    })
    .map<ProfessionalService>((service, index) => ({
      bookingFlow: service.bookingFlow,
      defaultMode: service.defaultMode,
      duration: service.duration,
      id: `professional-service-${portalState.activeProfessionalId}-${service.serviceId}`,
      index: index + 1,
      price: service.price,
      serviceId: service.serviceId,
      serviceModes: service.serviceModes,
      summary: service.summary,
    }));
  const publicPortfolioEntries = portalState.portfolioEntries
    .filter((entry) => entry.visibility === 'public')
    .map((entry, index) => ({
      ...entry,
      index: index + 1,
    }));
  const publicGalleryItems = [...portalState.galleryItems]
    .sort((leftItem, rightItem) => {
      if (leftItem.isFeatured !== rightItem.isFeatured) {
        return leftItem.isFeatured ? -1 : 1;
      }

      return leftItem.index - rightItem.index;
    })
    .map<ProfessionalGalleryItem>((item, index) => ({
      alt: item.alt,
      id: item.id,
      image: item.image,
      index: index + 1,
      label: item.label,
    }));

  return {
    ...professional,
    about: portalState.publicBio,
    availability: {
      isAvailable: portalState.acceptingNewClients,
    },
    coverage: {
      areaIds: portalState.coverageAreaIds,
      center: portalState.coverageCenter,
      homeVisitRadiusKm: portalState.homeVisitRadiusKm,
    },
    experience: portalState.yearsExperience || professional.experience,
    gallery: publicGalleryItems,
    availabilityByMode: portalState.availabilityByMode,
    location: portalState.practiceLabel || professional.location,
    name: portalState.displayName || professional.name,
    portfolioEntries: publicPortfolioEntries,
    practiceLocation: {
      address: portalState.practiceAddress || professional.practiceLocation?.address || professional.about,
      areaId:
        portalState.coverageAreaIds[0] ||
        professional.practiceLocation?.areaId ||
        professional.coverage.areaIds[0] ||
        '',
      coordinates: portalState.coverageCenter,
      label: portalState.practiceLabel || professional.practiceLocation?.label || professional.location,
    },
    responseTime: portalState.responseTimeGoal || professional.responseTime,
    services: activeServiceConfigurations,
  };
};

export const useProfessionalPortal = () => {
  const { continueAsProfessional } = useViewerSession();
  const [portalState, setPortalState] = useState<ProfessionalPortalState>(
    () => readProfessionalPortalData().portalState,
  );
  const [appointmentRecordsByProfessionalId, setAppointmentRecordsByProfessionalId] = useState<
    Record<string, ProfessionalManagedAppointmentRecord[]>
  >(() => readProfessionalPortalData().appointmentRecordsByProfessionalId);
  const [reviewStatesByProfessionalId, setReviewStatesByProfessionalId] = useState<
    Record<string, ProfessionalLifecycleReviewState>
  >(() => readProfessionalPortalData().reviewStatesByProfessionalId);
  const requestBoardsByProfessionalId = Object.fromEntries(
    Object.entries(appointmentRecordsByProfessionalId).map(([professionalId, records]) => [
      professionalId,
      buildRequestBoardFromAppointmentRecords(records),
    ]),
  );

  useEffect(() => {
    const syncPortalState = () => {
      const nextData = readProfessionalPortalData();
      setPortalState(nextData.portalState);
      setAppointmentRecordsByProfessionalId(nextData.appointmentRecordsByProfessionalId);
      setReviewStatesByProfessionalId(nextData.reviewStatesByProfessionalId);
    };

    return professionalPortalRepository.subscribe(syncPortalState);
  }, []);

  const updatePortalState = (
    nextState: ProfessionalPortalState,
    nextAppointmentRecordsInput?: Record<string, ProfessionalManagedAppointmentRecord[]>,
    nextReviewStatesInput?: Record<string, ProfessionalLifecycleReviewState>,
  ) => {
    const candidateState = sanitizePortalState(nextState);
    const candidateAppointmentRecords = {
      ...buildDefaultAppointmentRecordsByProfessionalId(),
      ...appointmentRecordsByProfessionalId,
      ...sanitizeAppointmentRecordsByProfessionalId(nextAppointmentRecordsInput),
    };
    const candidateRequestBoards = Object.fromEntries(
      Object.entries(candidateAppointmentRecords).map(([professionalId, records]) => [
        professionalId,
        buildRequestBoardFromAppointmentRecords(records),
      ]),
    );
    const candidateReviewStates = {
      ...buildDefaultReviewStates(),
      ...sanitizeReviewStatesByProfessionalId({
        ...reviewStatesByProfessionalId,
        ...nextReviewStatesInput,
      }),
      [candidateState.activeProfessionalId]: sanitizeReviewState(
        nextReviewStatesInput?.[candidateState.activeProfessionalId] ||
          reviewStatesByProfessionalId[candidateState.activeProfessionalId],
        createPublishedReviewState(),
      ),
    };
    const sanitizedState = sanitizePortalState({
      ...candidateState,
      requestBoard: candidateRequestBoards[candidateState.activeProfessionalId] || candidateState.requestBoard,
    });

    setPortalState(sanitizedState);
    setAppointmentRecordsByProfessionalId(candidateAppointmentRecords);
    setReviewStatesByProfessionalId(candidateReviewStates);
    persistProfessionalPortalState(sanitizedState, candidateAppointmentRecords, candidateReviewStates);
  };

  const updatePortalStateWith = (updater: (currentState: ProfessionalPortalState) => ProfessionalPortalState) => {
    updatePortalState(updater(portalState));
  };

  const startProfessionalLogin = ({ phone, professionalId }: ProfessionalAccessDraft) => {
    const baseState =
      portalState.activeProfessionalId === professionalId ? portalState : buildDefaultPortalState(professionalId);
    const appointmentRecords =
      appointmentRecordsByProfessionalId[professionalId] ||
      buildDefaultAppointmentRecords(getProfessionalById(professionalId) || defaultProfessional);
    const requestBoard = buildRequestBoardFromAppointmentRecords(appointmentRecords);
    const nextState = sanitizePortalState({
      ...baseState,
      activeProfessionalId: professionalId,
      phone,
      requestBoard,
    });

    updatePortalState(
      nextState,
      {
        ...appointmentRecordsByProfessionalId,
        [professionalId]: appointmentRecords,
      },
      {
        ...reviewStatesByProfessionalId,
        [professionalId]: reviewStatesByProfessionalId[professionalId] || createPublishedReviewState(),
      },
    );
    continueAsProfessional();
  };

  const startProfessionalRegistration = ({
    city,
    credentialNumber,
    displayName,
    phone,
    professionalId,
  }: ProfessionalAccessDraft) => {
    const nextState = sanitizePortalState(
      createProfessionalOnboardingDraft({
        ...buildDefaultPortalState(professionalId),
        activeProfessionalId: professionalId,
        city: city || '',
        credentialNumber: credentialNumber || '',
        displayName: displayName || '',
        phone,
      }),
    );

    updatePortalState(
      nextState,
      {
        ...appointmentRecordsByProfessionalId,
        [professionalId]: [],
      },
      {
        ...reviewStatesByProfessionalId,
        [professionalId]: createDraftReviewState(),
      },
    );
    continueAsProfessional();
  };

  const switchProfessionalProfile = (professionalId: string) => {
    const professional = getProfessionalById(professionalId) || defaultProfessional;
    const appointmentRecords =
      appointmentRecordsByProfessionalId[professionalId] || buildDefaultAppointmentRecords(professional);
    const requestBoard = buildRequestBoardFromAppointmentRecords(appointmentRecords);

    updatePortalState(
      {
        ...buildDefaultPortalState(professionalId),
        requestBoard,
      },
      undefined,
      {
        ...reviewStatesByProfessionalId,
        [professionalId]: reviewStatesByProfessionalId[professionalId] || createPublishedReviewState(),
      },
    );
  };

  const saveServiceConfiguration = (serviceId: string, updates: Partial<ProfessionalManagedService>) => {
    updatePortalStateWith((currentState) => ({
      ...currentState,
      serviceConfigurations: currentState.serviceConfigurations.map((service) =>
        service.serviceId === serviceId ? sanitizeManagedService({ ...service, ...updates }, service) : service,
      ),
    }));
  };

  const activateTemplateService = (serviceId: string) => {
    saveServiceConfiguration(serviceId, { isActive: true });
  };

  const archiveService = (serviceId: string) => {
    saveServiceConfiguration(serviceId, { featured: false, isActive: false });
  };

  const savePortfolioEntry = (entryId: string, updates: Partial<ProfessionalManagedPortfolioEntry>) => {
    updatePortalStateWith((currentState) => ({
      ...currentState,
      portfolioEntries: currentState.portfolioEntries.map((entry) =>
        entry.id === entryId ? sanitizeManagedPortfolioEntry({ ...entry, ...updates }, entry) : entry,
      ),
    }));
  };

  const createPortfolioEntry = () => {
    const copy = getProfessionalPortalCopy();
    const nextEntry = sanitizeManagedPortfolioEntry({
      id: `professional-portfolio-entry-${portalState.activeProfessionalId}-${Date.now()}`,
      image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=800&auto=format&fit=crop',
      index: portalState.portfolioEntries.length + 1,
      outcomes: [copy.defaults.newOutcome],
      periodLabel: copy.defaults.portfolioPeriodLabel,
      summary: copy.defaults.portfolioSummary,
      title: copy.defaults.portfolioTitle,
      visibility: 'public',
    });

    updatePortalStateWith((currentState) => ({
      ...currentState,
      portfolioEntries: [...currentState.portfolioEntries, nextEntry],
    }));

    return nextEntry.id;
  };

  const deletePortfolioEntry = (entryId: string) => {
    updatePortalStateWith((currentState) => ({
      ...currentState,
      portfolioEntries: currentState.portfolioEntries.filter((entry) => entry.id !== entryId),
    }));
  };

  const saveGalleryItem = (galleryId: string, updates: Partial<ProfessionalManagedGalleryItem>) => {
    updatePortalStateWith((currentState) => ({
      ...currentState,
      galleryItems: currentState.galleryItems.map((item) =>
        item.id === galleryId ? sanitizeManagedGalleryItem({ ...item, ...updates }, item) : item,
      ),
    }));
  };

  const createGalleryItem = () => {
    const copy = getProfessionalPortalCopy();
    const nextItem = sanitizeManagedGalleryItem({
      alt: copy.defaults.newAssetAlt,
      id: `professional-gallery-item-${portalState.activeProfessionalId}-${Date.now()}`,
      image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?q=80&w=800&auto=format&fit=crop',
      index: portalState.galleryItems.length + 1,
      isFeatured: portalState.galleryItems.length === 0,
      label: copy.defaults.galleryLabel,
    });

    updatePortalStateWith((currentState) => ({
      ...currentState,
      galleryItems: [...currentState.galleryItems, nextItem],
    }));

    return nextItem.id;
  };

  const deleteGalleryItem = (galleryId: string) => {
    updatePortalStateWith((currentState) => ({
      ...currentState,
      galleryItems: currentState.galleryItems.filter((item) => item.id !== galleryId),
    }));
  };

  const saveBusinessSettings = (input: SaveBusinessSettingsInput) => {
    updatePortalStateWith((currentState) => ({
      ...currentState,
      ...input,
    }));
  };

  const saveAvailabilityByMode = (
    availabilityByMode?: Partial<Record<ServiceDeliveryMode, ProfessionalAvailabilityDay[]>>,
  ) => {
    updatePortalStateWith((currentState) => ({
      ...currentState,
      availabilityByMode: sanitizeAvailabilityByMode(availabilityByMode, currentState.availabilityByMode),
    }));
  };

  const submitProfessionalProfileForReview = () => {
    const readinessState = deriveProfessionalOnboardingState(portalState, null);

    if (readinessState.blockingTaskCount > 0) {
      return false;
    }

    const submittedAt = new Date().toISOString();

    updatePortalState(portalState, undefined, {
      ...reviewStatesByProfessionalId,
      [portalState.activeProfessionalId]: {
        status: 'submitted',
        submittedAt,
      },
    });

    return true;
  };

  const simulateProfessionalAdminReview = (status: 'changes_requested' | 'verified') => {
    const activeReviewState =
      reviewStatesByProfessionalId[portalState.activeProfessionalId] || createDraftReviewState();

    if (activeReviewState.status !== 'submitted') {
      return false;
    }

    const reviewedAt = new Date().toISOString();

    updatePortalState(portalState, undefined, {
      ...reviewStatesByProfessionalId,
      [portalState.activeProfessionalId]:
        status === 'changes_requested'
          ? {
              adminNote: PROFESSIONAL_LIFECYCLE_REVIEW_STATE_MOCKS.changesRequested.adminNote,
              reviewedAt,
              reviewerName:
                PROFESSIONAL_LIFECYCLE_REVIEW_STATE_MOCKS.changesRequested.reviewerName || 'Admin BidanCare',
              status,
              submittedAt: activeReviewState.submittedAt,
            }
          : {
              reviewedAt,
              reviewerName:
                PROFESSIONAL_LIFECYCLE_REVIEW_STATE_MOCKS.verifiedPendingPublish.reviewerName || 'Admin BidanCare',
              status,
              submittedAt: activeReviewState.submittedAt,
            },
    });

    return true;
  };

  const publishProfessionalProfile = () => {
    const activeReviewState =
      reviewStatesByProfessionalId[portalState.activeProfessionalId] || createDraftReviewState();

    if (activeReviewState.status !== 'verified') {
      return false;
    }

    updatePortalState(
      {
        ...portalState,
        acceptingNewClients: true,
      },
      undefined,
      {
        ...reviewStatesByProfessionalId,
        [portalState.activeProfessionalId]: {
          ...activeReviewState,
          publishedAt: new Date().toISOString(),
          status: 'published',
        },
      },
    );

    return true;
  };

  const createCustomerRequest = ({
    note,
    professionalId,
    requestedMode,
    scheduleDayId,
    scheduledTimeLabel,
    serviceId,
    serviceOfferingId,
    timeSlotId,
  }: CreateCustomerRequestInput) => {
    const professional =
      publicProfessionals.find((candidateProfessional) => candidateProfessional.id === professionalId) ||
      getProfessionalById(professionalId) ||
      defaultProfessional;

    if (!professional) {
      return false;
    }

    const catalogService = MOCK_SERVICES.find((service) => service.id === serviceId);
    const serviceMapping =
      professional.services.find((service) => service.id === serviceOfferingId && service.serviceId === serviceId) ||
      professional.services.find((service) => service.serviceId === serviceId);

    if (!catalogService || !serviceMapping) {
      return false;
    }

    const supportsRequestedMode =
      (requestedMode === 'online' && serviceMapping.serviceModes.online) ||
      (requestedMode === 'home_visit' && serviceMapping.serviceModes.homeVisit) ||
      (requestedMode === 'onsite' && serviceMapping.serviceModes.onsite);

    if (!supportsRequestedMode) {
      return false;
    }

    const requiresSchedule = requestedMode !== 'online';
    const availabilityDays = requiresSchedule ? professional.availabilityByMode?.[requestedMode] || [] : [];
    const selectedScheduleDay =
      requiresSchedule && scheduleDayId
        ? availabilityDays.find((scheduleDay) => scheduleDay.id === scheduleDayId) || null
        : null;
    const selectedTimeSlot =
      requiresSchedule && selectedScheduleDay && timeSlotId
        ? selectedScheduleDay.slots.find((timeSlot) => timeSlot.id === timeSlotId && timeSlot.status !== 'booked') ||
          null
        : null;

    if (requiresSchedule && (!selectedScheduleDay || !selectedTimeSlot)) {
      return false;
    }

    const requestTimestamp = Date.now();
    const requestedAt = new Date();
    const nextScheduledTimeLabel =
      scheduledTimeLabel?.trim() ||
      (requestedMode === 'online' ? 'Menunggu detail sesi online' : 'Menunggu konfirmasi jadwal');
    const appointmentId = `apt-local-${professionalId}-${requestTimestamp}`;
    const initialStatus: AppointmentStatus =
      serviceMapping.bookingFlow === 'instant' ? 'approved_waiting_payment' : 'requested';
    const timeline = [
      initialStatus === 'approved_waiting_payment'
        ? createAppointmentTimelineEvent({
            actor: 'system',
            createdAt: requestedAt,
            customerSummary: `Booking instan ${catalogService.name} langsung masuk tahap pembayaran pelanggan.`,
            fromStatus: 'requested',
            id: `${appointmentId}-timeline-1`,
            internalNote: `Booking instan ${appointmentId} tidak butuh approval manual dan menunggu pembayaran.`,
            toStatus: 'approved_waiting_payment',
          })
        : createAppointmentTimelineEvent({
            actor: 'customer',
            createdAt: requestedAt,
            customerSummary: note,
            id: `${appointmentId}-timeline-1`,
            internalNote: `Request ${appointmentId} dibuat pelanggan dan menunggu review profesional.`,
            toStatus: 'requested',
          }),
    ];
    const nextRecord: ProfessionalManagedAppointmentRecord = {
      areaId: ACTIVE_USER_CONTEXT.area.id,
      bookingFlow: serviceMapping.bookingFlow,
      consumerId: ACTIVE_CONSUMER.id,
      id: appointmentId,
      index: requestTimestamp,
      professionalId,
      requestNote: note,
      requestedAt: requestedAt.toISOString(),
      requestedMode,
      scheduleSnapshot: {
        dateIso: selectedScheduleDay?.dateIso,
        requiresSchedule,
        scheduleDayId: selectedScheduleDay?.id,
        scheduleDayLabel: selectedScheduleDay?.label,
        scheduledTimeLabel: nextScheduledTimeLabel,
        timeSlotId: selectedTimeSlot?.id,
        timeSlotLabel: selectedTimeSlot?.label,
      },
      serviceId,
      serviceOfferingId: serviceMapping.id || serviceOfferingId,
      serviceSnapshot: {
        bookingFlow: serviceMapping.bookingFlow,
        categoryId: catalogService.categoryId,
        coverImage: catalogService.coverImage,
        defaultMode: serviceMapping.defaultMode,
        description: catalogService.description,
        durationLabel: serviceMapping.duration,
        highlights: catalogService.highlights,
        image: catalogService.image,
        name: catalogService.name,
        priceAmount: appointmentPriceLabelToNumber(serviceMapping.price),
        priceLabel: serviceMapping.price,
        serviceId,
        serviceModes: serviceMapping.serviceModes,
        serviceOfferingId: serviceMapping.id || serviceOfferingId,
        shortDescription: catalogService.shortDescription,
        slug: catalogService.slug,
        summary: serviceMapping.summary || catalogService.shortDescription,
        tags: catalogService.tags,
      },
      status: initialStatus,
      timeline,
    };
    const baseAppointmentRecords =
      appointmentRecordsByProfessionalId[professionalId] || buildDefaultAppointmentRecords(professional);
    const nextAppointmentRecords = [nextRecord, ...baseAppointmentRecords];
    const nextRequestBoard = buildRequestBoardFromAppointmentRecords(nextAppointmentRecords);

    updatePortalState(
      portalState.activeProfessionalId === professionalId
        ? {
            ...portalState,
            requestBoard: nextRequestBoard,
          }
        : portalState,
      {
        ...appointmentRecordsByProfessionalId,
        [professionalId]: nextAppointmentRecords,
      },
    );

    return true;
  };

  const markCustomerAppointmentPaid = (appointmentId: string) => {
    let hasChanged = false;
    const nextAppointmentRecords = Object.fromEntries(
      Object.entries(appointmentRecordsByProfessionalId).map(([professionalId, records]) => [
        professionalId,
        records.map((record) => {
          if (record.id !== appointmentId || record.status !== 'approved_waiting_payment') {
            return record;
          }

          hasChanged = true;
          const updatedAt = new Date();

          return sanitizeManagedAppointmentRecord(
            {
              ...record,
              status: 'paid',
              timeline: [
                ...record.timeline,
                createAppointmentTimelineEvent({
                  actor: 'customer',
                  createdAt: updatedAt,
                  customerSummary: `Pembayaran untuk ${record.serviceSnapshot.name} sudah diterima dan booking siap dikonfirmasi.`,
                  evidenceUrl: undefined,
                  fromStatus: record.status,
                  id: `${record.id}-timeline-${record.timeline.length + 1}`,
                  internalNote: `Pembayaran booking ${record.id} tervalidasi dari sisi pelanggan.`,
                  toStatus: 'paid',
                }),
              ],
            },
            record,
          );
        }),
      ]),
    );

    if (!hasChanged) {
      return false;
    }

    updatePortalState(
      {
        ...portalState,
        requestBoard:
          buildRequestBoardFromAppointmentRecords(nextAppointmentRecords[portalState.activeProfessionalId] || []) ||
          portalState.requestBoard,
      },
      nextAppointmentRecords,
    );

    return true;
  };

  const updateRequestStatus = (
    requestId: string,
    status: ProfessionalRequestStatus,
    input?: UpdateRequestStatusInput,
  ) => {
    const request = portalState.requestBoard.find((currentRequest) => currentRequest.id === requestId);

    if (!request) {
      return {
        ok: false as const,
        error: 'invalidTransition' as const,
      };
    }

    const validationError = validateProfessionalRequestStatusUpdate(request, status, input);

    if (validationError) {
      return {
        ok: false as const,
        error: validationError,
      };
    }

    const updatedAt = new Date();
    const nextAppointmentRecords = {
      ...appointmentRecordsByProfessionalId,
      [portalState.activeProfessionalId]: (
        appointmentRecordsByProfessionalId[portalState.activeProfessionalId] || []
      ).map((record) => {
        if (record.id !== request.appointmentId) {
          return record;
        }

        const nextCustomerStatus = getCustomerStatusFromRequestStatus(status, record.status);

        return sanitizeManagedAppointmentRecord(
          {
            ...record,
            status: nextCustomerStatus,
            timeline: [
              ...record.timeline,
              createAppointmentTimelineEvent({
                actor: 'professional',
                createdAt: updatedAt,
                customerSummary: input?.customerSummary,
                evidenceUrl: input?.evidenceUrl,
                fromStatus: record.status,
                id: `${record.id}-timeline-${record.timeline.length + 1}`,
                internalNote: input?.evidenceNote,
                toStatus: nextCustomerStatus,
              }),
            ],
          },
          record,
        );
      }),
    };
    const nextRequestBoard = buildRequestBoardFromAppointmentRecords(
      nextAppointmentRecords[portalState.activeProfessionalId] || [],
    );

    updatePortalState(
      {
        ...portalState,
        requestBoard: nextRequestBoard,
      },
      nextAppointmentRecords,
    );

    return {
      ok: true as const,
    };
  };

  const baseProfessional = getProfessionalById(portalState.activeProfessionalId) || defaultProfessional;
  const activeReviewState =
    reviewStatesByProfessionalId[portalState.activeProfessionalId] || createPublishedReviewState();
  const onboardingState = deriveProfessionalOnboardingState(portalState, activeReviewState);
  const previewProfessional = baseProfessional ? mergeProfessionalWithPortalState(baseProfessional, portalState) : null;
  const activeProfessional = previewProfessional;
  const publicProfessionals = MOCK_PROFESSIONALS.map((professional) =>
    professional.id === previewProfessional?.id && activeReviewState.status === 'published'
      ? previewProfessional
      : professional,
  );
  const activeCoverageAreas = portalState.coverageAreaIds
    .map((areaId) => getAreaById(areaId))
    .filter((area): area is Area => Boolean(area));
  const customerAppointments = buildCustomerAppointmentsFromAppointmentRecords(appointmentRecordsByProfessionalId);
  const activeServiceConfigurations = [...portalState.serviceConfigurations]
    .filter((service) => service.isActive)
    .sort((leftService, rightService) => {
      if (leftService.featured !== rightService.featured) {
        return leftService.featured ? -1 : 1;
      }

      return leftService.index - rightService.index;
    });
  const inactiveServiceTemplates = portalState.serviceConfigurations.filter((service) => !service.isActive);
  const publicPortfolioEntries = portalState.portfolioEntries.filter((entry) => entry.visibility === 'public');
  const featuredServiceConfiguration =
    activeServiceConfigurations.find((service) => service.featured) || activeServiceConfigurations[0] || null;
  const averageServicePriceLabel =
    activeServiceConfigurations.length > 0
      ? formatRupiah(
          Math.round(
            activeServiceConfigurations.reduce((total, service) => total + priceToNumber(service.price), 0) /
              activeServiceConfigurations.length,
          ),
        )
      : formatRupiah(0);
  const requestStatusCounts = professionalRequestStatuses.reduce<Record<ProfessionalRequestStatus, number>>(
    (counts, status) => {
      counts[status] = portalState.requestBoard.filter((request) => request.status === status).length;
      return counts;
    },
    {
      completed: 0,
      new: 0,
      quoted: 0,
      scheduled: 0,
    },
  );
  const profileCompletionScore = onboardingState.completionPercent;
  const isPublishedProfessional = activeReviewState.status === 'published';

  return {
    activeCoverageAreas,
    activeProfessional,
    activeProfessionalCategoryLabel: activeProfessional ? getProfessionalCategoryLabel(activeProfessional) : '',
    activeReviewState,
    activeServiceConfigurations,
    averageServicePriceLabel,
    customerAppointments,
    demoProfessionals: MOCK_PROFESSIONALS.slice(0, 4),
    featuredServiceConfiguration,
    inactiveServiceTemplates,
    isPublishedProfessional,
    onboardingState,
    portalState,
    profileCompletionScore,
    publicPortfolioEntries,
    publicProfessionals,
    publishProfessionalProfile,
    requestStatusCounts,
    reviewStatesByProfessionalId,
    serviceCategories: MOCK_CATEGORIES,
    serviceTemplates: MOCK_SERVICES,
    simulateProfessionalAdminReview,
    submitProfessionalProfileForReview,
    updateRequestStatus,
    activateTemplateService,
    archiveService,
    createCustomerRequest,
    createGalleryItem,
    createPortfolioEntry,
    deleteGalleryItem,
    deletePortfolioEntry,
    getCustomerRequestForProfessional: (professionalId: string) => {
      const requestBoard = requestBoardsByProfessionalId[professionalId];

      if (!requestBoard || requestBoard.length === 0) {
        return null;
      }

      return (
        requestBoard
          .filter((request) => request.clientId === ACTIVE_CONSUMER.id)
          .sort(
            (leftRequest, rightRequest) =>
              new Date(getRequestLastUpdatedAt(rightRequest)).getTime() -
              new Date(getRequestLastUpdatedAt(leftRequest)).getTime(),
          )[0] || null
      );
    },
    markCustomerAppointmentPaid,
    saveAvailabilityByMode,
    saveBusinessSettings,
    saveGalleryItem,
    savePortfolioEntry,
    saveServiceConfiguration,
    startProfessionalLogin,
    startProfessionalRegistration,
    switchProfessionalProfile,
    getAreaLabel: (areaId: string) => getAreaById(areaId)?.label || areaId,
    getPreviewProfessionalBySlug: (professionalSlug: string) =>
      previewProfessional?.slug === professionalSlug ? previewProfessional : null,
    getPublicProfessionalById: (professionalId: string) =>
      publicProfessionals.find((professional) => professional.id === professionalId) || null,
    getPublicProfessionalBySlug: (professionalSlug: string) =>
      publicProfessionals.find((professional) => professional.slug === professionalSlug) || null,
    getServiceLabel: (serviceId: string) =>
      MOCK_SERVICES.find((service) => service.id === serviceId)?.name || serviceId,
  };
};
