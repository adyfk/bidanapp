'use client';

import { useEffect, useState } from 'react';
import { ACTIVE_APPOINTMENT_STATUSES, HISTORY_APPOINTMENT_STATUSES } from '@/features/appointments/lib/status';
import {
  type CreateCustomerRequestInput,
  PROFESSIONAL_PORTAL_SCHEMA_VERSION,
  type ProfessionalAccessDraft,
  type ProfessionalManagedGalleryItem,
  type ProfessionalManagedPortfolioEntry,
  type ProfessionalManagedRequest,
  type ProfessionalManagedService,
  type ProfessionalPortalState,
  type ProfessionalRequestStatus,
  type ProfessionalRequestStatusEvidence,
  type ProfessionalSetupInput,
  type SaveBusinessSettingsInput,
  type UpdateRequestStatusInput,
} from '@/features/professional-portal/lib/contracts';
import {
  createProfessionalPortalSnapshot,
  getProfessionalPortalRepository,
} from '@/features/professional-portal/lib/repository';
import { validateProfessionalRequestStatusUpdate } from '@/features/professional-portal/lib/request-status';
import { getAppointmentRowsByProfessionalId } from '@/lib/mock-db/appointment-records';
import { createHydratedAppointment } from '@/lib/mock-db/appointments';
import {
  getAreaById,
  getProfessionalById,
  getProfessionalCategoryLabel,
  getServiceById,
  MOCK_CATEGORIES,
  MOCK_PROFESSIONALS,
  MOCK_SERVICES,
} from '@/lib/mock-db/catalog';
import { ACTIVE_CONSUMER, ACTIVE_USER_CONTEXT } from '@/lib/mock-db/runtime';
import { getRequiredItem } from '@/lib/mock-db/utils';
import type { Appointment, AppointmentStatus } from '@/types/appointments';
import type {
  Area,
  BookingFlow,
  GeoPoint,
  Professional,
  ProfessionalGalleryItem,
  ProfessionalService,
  ServiceDeliveryMode,
  ServiceModeFlags,
} from '@/types/catalog';
import { useViewerSession } from './use-viewer-session';

export type {
  CreateCustomerRequestInput,
  ProfessionalAccessDraft,
  ProfessionalManagedGalleryItem,
  ProfessionalManagedPortfolioEntry,
  ProfessionalManagedRequest,
  ProfessionalManagedService,
  ProfessionalPortalState,
  ProfessionalRequestPriority,
  ProfessionalRequestStatus,
  ProfessionalRequestStatusEvidence,
  ProfessionalSetupInput,
  SaveBusinessSettingsInput,
  UpdateRequestStatusInput,
} from '@/features/professional-portal/lib/contracts';

const defaultProfessional = MOCK_PROFESSIONALS[0] || null;
const professionalPortalRepository = getProfessionalPortalRepository();
const professionalRequestStatuses: ProfessionalRequestStatus[] = ['new', 'quoted', 'scheduled', 'completed'];

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
      requestChannel: 'Chat',
      requestClientName: 'New client',
      requestNote: 'New request note.',
      requestTodayLabel: 'Today',
    },
    requestBoard: {
      channels: {
        asyncFollowUp: 'Async follow-up',
        clinicDeskHandoff: 'Clinic desk handoff',
        clinicFollowUpDesk: 'Clinic follow-up desk',
        customerApp: 'Customer app',
        phoneFollowUp: 'Phone follow-up',
        videoRoom: 'BidanCare Video Room',
        whatsappReferral: 'WhatsApp referral',
      },
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
      requestChannel: 'Chat',
      requestClientName: 'Klien baru',
      requestNote: 'Catatan permintaan baru.',
      requestTodayLabel: 'Hari ini',
    },
    requestBoard: {
      channels: {
        asyncFollowUp: 'Tindak lanjut asinkron',
        clinicDeskHandoff: 'Serah terima admin klinik',
        clinicFollowUpDesk: 'Admin klinik',
        customerApp: 'Aplikasi pelanggan',
        phoneFollowUp: 'Tindak lanjut telepon',
        videoRoom: 'Ruang Video BidanCare',
        whatsappReferral: 'Rujukan WhatsApp',
      },
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

const serviceDefaultsByServiceId = new Map<string, ProfessionalService>();

for (const professional of MOCK_PROFESSIONALS) {
  for (const service of professional.services) {
    if (!serviceDefaultsByServiceId.has(service.serviceId)) {
      serviceDefaultsByServiceId.set(service.serviceId, service);
    }
  }
}

const getDateWithOffset = (dateIso: string, minutes: number) =>
  new Date(new Date(dateIso).getTime() + minutes * 60 * 1000);

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

const buildRequestStatusHistoryEntry = ({
  createdAt,
  customerSummary,
  evidenceNote,
  evidenceUrl,
  fromStatus,
  requestId,
  sequence,
  status,
}: {
  createdAt: Date;
  customerSummary: string;
  evidenceNote?: string;
  evidenceUrl?: string;
  fromStatus: ProfessionalRequestStatus;
  requestId: string;
  sequence: number;
  status: ProfessionalRequestStatus;
}): ProfessionalRequestStatusEvidence => ({
  createdAt: createdAt.toISOString(),
  createdAtLabel: formatRequestStatusTimestamp(createdAt),
  customerSummary,
  evidenceNote,
  evidenceUrl,
  fromStatus,
  id: `${requestId}-history-${sequence}`,
  status,
});

const buildLinkedAppointmentStatusHistory = ({
  appointmentId,
  customerStatus,
  requestId,
  requestedAt,
  scheduledTimeLabel,
  serviceName,
}: {
  appointmentId: string;
  customerStatus: AppointmentStatus;
  requestId: string;
  requestedAt: string;
  scheduledTimeLabel: string;
  serviceName: string;
}): ProfessionalRequestStatusEvidence[] => {
  if (customerStatus === 'requested') {
    return [];
  }

  const historyEntries: ProfessionalRequestStatusEvidence[] = [];

  if (customerStatus === 'approved_waiting_payment' || customerStatus === 'paid') {
    historyEntries.push(
      buildRequestStatusHistoryEntry({
        createdAt: getDateWithOffset(requestedAt, 15),
        customerSummary:
          customerStatus === 'paid'
            ? `Permintaan ${serviceName} disetujui dan pelanggan sudah menyelesaikan pembayaran.`
            : `Permintaan ${serviceName} disetujui dan pelanggan sedang menunggu menyelesaikan pembayaran.`,
        evidenceNote:
          customerStatus === 'paid'
            ? `Status booking ${appointmentId} sudah masuk tahap pembayaran terverifikasi.`
            : `Status booking ${appointmentId} sudah masuk tahap menunggu pembayaran pelanggan.`,
        fromStatus: 'new',
        requestId,
        sequence: 1,
        status: 'quoted',
      }),
    );

    return historyEntries;
  }

  if (customerStatus === 'confirmed' || customerStatus === 'in_service' || customerStatus === 'completed') {
    historyEntries.push(
      buildRequestStatusHistoryEntry({
        createdAt: getDateWithOffset(requestedAt, 15),
        customerSummary: `Ringkasan biaya dan persiapan ${serviceName} sudah dibagikan ke pelanggan.`,
        evidenceNote: `Thread booking ${appointmentId} sudah menyimpan penawaran dan detail persiapan sesi.`,
        fromStatus: 'new',
        requestId,
        sequence: 1,
        status: 'quoted',
      }),
      buildRequestStatusHistoryEntry({
        createdAt: getDateWithOffset(requestedAt, 45),
        customerSummary:
          customerStatus === 'in_service'
            ? `Sesi ${serviceName} sedang berjalan sesuai jadwal ${scheduledTimeLabel}.`
            : `Jadwal ${serviceName} sudah dikonfirmasi untuk ${scheduledTimeLabel}.`,
        evidenceNote: `Jadwal layanan ${appointmentId} sudah dikunci pada ${scheduledTimeLabel}.`,
        fromStatus: 'quoted',
        requestId,
        sequence: 2,
        status: 'scheduled',
      }),
    );
  }

  if (customerStatus === 'completed') {
    historyEntries.push(
      buildRequestStatusHistoryEntry({
        createdAt: getDateWithOffset(requestedAt, 90),
        customerSummary: `Sesi ${serviceName} selesai dan ringkasan tindak lanjut sudah dikirim ke pelanggan.`,
        evidenceNote: `Booking ${appointmentId} ditutup sebagai sesi selesai dengan recap layanan terkirim.`,
        fromStatus: 'scheduled',
        requestId,
        sequence: 3,
        status: 'completed',
      }),
    );

    return historyEntries;
  }

  if (customerStatus === 'cancelled') {
    return [
      buildRequestStatusHistoryEntry({
        createdAt: getDateWithOffset(requestedAt, 20),
        customerSummary: `Pelanggan membatalkan ${serviceName} sebelum sesi berlangsung, sehingga slot dikembalikan ke jadwal.`,
        evidenceNote: `Booking ${appointmentId} ditutup sebagai pembatalan pelanggan.`,
        fromStatus: 'new',
        requestId,
        sequence: 1,
        status: 'completed',
      }),
    ];
  }

  if (customerStatus === 'rejected') {
    return [
      buildRequestStatusHistoryEntry({
        createdAt: getDateWithOffset(requestedAt, 20),
        customerSummary: `Permintaan ${serviceName} tidak bisa diproses karena area atau kebutuhan pelanggan tidak sesuai cakupan profesional.`,
        evidenceNote: `Booking ${appointmentId} ditolak saat proses validasi awal.`,
        fromStatus: 'new',
        requestId,
        sequence: 1,
        status: 'completed',
      }),
    ];
  }

  return [
    buildRequestStatusHistoryEntry({
      createdAt: getDateWithOffset(requestedAt, 15),
      customerSummary: `Permintaan ${serviceName} disetujui, tetapi booking otomatis ditutup karena pembayaran tidak selesai tepat waktu.`,
      evidenceNote: `Booking ${appointmentId} kedaluwarsa pada tahap pembayaran.`,
      fromStatus: 'new',
      requestId,
      sequence: 1,
      status: 'quoted',
    }),
    buildRequestStatusHistoryEntry({
      createdAt: getDateWithOffset(requestedAt, 60),
      customerSummary: `Booking ${serviceName} berakhir karena pelanggan tidak menyelesaikan pembayaran sebelum batas waktu.`,
      evidenceNote: `Booking ${appointmentId} ditutup sebagai kedaluwarsa pembayaran.`,
      fromStatus: 'quoted',
      requestId,
      sequence: 2,
      status: 'completed',
    }),
  ];
};

const buildRequestFromAppointmentSeed = (
  appointment: Pick<
    Appointment,
    | 'areaId'
    | 'consumerId'
    | 'id'
    | 'requestChannel'
    | 'requestNote'
    | 'requestedAt'
    | 'requestedMode'
    | 'service'
    | 'status'
    | 'time'
    | 'totalPrice'
  > & { professionalId: string },
): ProfessionalManagedRequest => {
  const requestId = `professional-request-linked-${appointment.id}`;
  const requestedAtDate = new Date(appointment.requestedAt);

  return {
    appointmentId: appointment.id,
    areaId: appointment.areaId,
    budgetLabel: appointment.totalPrice,
    channel: appointment.requestChannel,
    clientId: appointment.consumerId,
    clientName: ACTIVE_CONSUMER.name,
    customerStatus: appointment.status,
    id: requestId,
    note: appointment.requestNote,
    priority: getRequestPriorityFromCustomerStatus(appointment.status),
    requestedAt: appointment.requestedAt,
    requestedAtLabel: formatRequestStatusTimestamp(requestedAtDate),
    requestedMode: appointment.requestedMode,
    scheduledTimeLabel: appointment.time,
    serviceId: appointment.service.id,
    status: getProfessionalRequestStatusFromAppointmentStatus(appointment.status),
    statusHistory: buildLinkedAppointmentStatusHistory({
      appointmentId: appointment.id,
      customerStatus: appointment.status,
      requestId,
      requestedAt: appointment.requestedAt,
      scheduledTimeLabel: appointment.time,
      serviceName: appointment.service.name,
    }),
  };
};

const buildRequestFromAppointmentRow = (professionalId: string) =>
  getAppointmentRowsByProfessionalId(professionalId).map((appointmentRow) =>
    buildRequestFromAppointmentSeed({
      areaId: appointmentRow.areaId,
      consumerId: appointmentRow.consumerId,
      id: appointmentRow.id,
      professionalId,
      requestChannel: appointmentRow.requestChannel,
      requestNote: appointmentRow.requestNote,
      requestedAt: appointmentRow.requestedAt,
      requestedMode: appointmentRow.requestedMode,
      service: getRequiredItem(
        getServiceById(appointmentRow.serviceId),
        `appointments.${appointmentRow.id}.serviceId -> ${appointmentRow.serviceId}`,
      ),
      status: appointmentRow.status,
      time: appointmentRow.scheduledTimeLabel,
      totalPrice: appointmentRow.totalPriceLabel,
    }),
  );

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
      index: existingService?.index || index + 1,
      isActive: Boolean(existingService),
      leadTimeHours: existingService?.bookingFlow === 'instant' ? 2 : 12,
      price: existingService?.price || templateService?.price || 'Rp 150.000',
      scheduleByMode: existingService?.scheduleByMode || templateService?.scheduleByMode,
      serviceId: serviceTemplate.id,
      serviceModes: existingService?.serviceModes || templateService?.serviceModes || serviceTemplate.serviceModes,
      source: existingService ? 'existing' : 'template',
      summary: existingService?.summary || templateService?.summary || serviceTemplate.shortDescription,
      weeklyCapacity: existingService ? 12 : 6,
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

const buildDefaultRequestBoard = (professional: Professional | null): ProfessionalManagedRequest[] => {
  if (!professional) {
    return [];
  }

  return buildRequestFromAppointmentRow(professional.id);
};

const buildDefaultRequestBoards = () =>
  MOCK_PROFESSIONALS.reduce<Record<string, ProfessionalManagedRequest[]>>((boards, professional) => {
    boards[professional.id] = buildDefaultRequestBoard(professional);
    return boards;
  }, {});

const buildDefaultPortalState = (professionalId = defaultProfessional?.id || ''): ProfessionalPortalState => {
  const professional = getProfessionalById(professionalId) || defaultProfessional;
  const primaryArea = professional?.coverage.areaIds[0] ? getAreaById(professional.coverage.areaIds[0]) : undefined;

  return {
    acceptingNewClients: professional?.availability.isAvailable ?? true,
    activeProfessionalId: professional?.id || '',
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
    monthlyCapacity: 32,
    onboardingCompleted: false,
    phone: '+62 812 3000 0000',
    portfolioEntries: buildDefaultPortfolioEntries(professional),
    practiceAddress: professional?.practiceLocation?.address || professional?.about || '',
    practiceLabel: professional?.practiceLocation?.label || professional?.location || '',
    practiceModes: (professional?.services || [])
      .flatMap((service) => [
        service.serviceModes.online ? 'online' : null,
        service.serviceModes.homeVisit ? 'home_visit' : null,
        service.serviceModes.onsite ? 'onsite' : null,
      ])
      .filter((mode): mode is ServiceDeliveryMode => Boolean(mode))
      .filter((mode, index, modes) => modes.indexOf(mode) === index),
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
  index: typeof value?.index === 'number' ? value.index : fallback.index,
  isActive: value?.isActive ?? fallback.isActive,
  leadTimeHours: parseInteger(value?.leadTimeHours, fallback.leadTimeHours),
  price: value?.price?.trim() || fallback.price,
  scheduleByMode: value?.scheduleByMode || fallback.scheduleByMode,
  serviceId: fallback.serviceId,
  serviceModes: sanitizeServiceModes(value?.serviceModes, fallback.serviceModes),
  source: value?.source === 'existing' || value?.source === 'template' ? value.source : fallback.source,
  summary: value?.summary?.trim() || fallback.summary,
  weeklyCapacity: parseInteger(value?.weeklyCapacity, fallback.weeklyCapacity),
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
    channel: value.channel?.trim() || fallback?.channel || copy.defaults.requestChannel,
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

const sanitizeRequestBoardsByProfessionalId = (value: unknown): Record<string, ProfessionalManagedRequest[]> => {
  if (!value || typeof value !== 'object') {
    return {};
  }

  return Object.entries(value).reduce<Record<string, ProfessionalManagedRequest[]>>(
    (boards, [professionalId, board]) => {
      boards[professionalId] = sanitizeRequestBoard(
        professionalId,
        Array.isArray(board) ? (board as Partial<ProfessionalManagedRequest>[]) : null,
      );
      return boards;
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
  const practiceModes = Array.isArray(value?.practiceModes)
    ? value.practiceModes.filter(
        (mode): mode is ServiceDeliveryMode => typeof mode === 'string' && isPracticeMode(mode),
      )
    : baseState.practiceModes;

  return {
    acceptingNewClients: value?.acceptingNewClients ?? baseState.acceptingNewClients,
    activeProfessionalId: professionalId,
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
    monthlyCapacity: parseInteger(value?.monthlyCapacity, baseState.monthlyCapacity),
    onboardingCompleted: value?.onboardingCompleted === true,
    phone: value?.phone?.trim() || baseState.phone,
    portfolioEntries: portfolioEntries
      ? portfolioEntries.map((item, index) => sanitizeManagedPortfolioEntry(item, baseState.portfolioEntries[index]))
      : baseState.portfolioEntries,
    practiceAddress: value?.practiceAddress?.trim() || baseState.practiceAddress,
    practiceLabel: value?.practiceLabel?.trim() || baseState.practiceLabel,
    practiceModes,
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
  requestBoardsByProfessionalId: Record<string, ProfessionalManagedRequest[]>;
} => {
  const defaultState = buildDefaultPortalState();
  const defaultRequestBoards = buildDefaultRequestBoards();

  if (typeof window === 'undefined') {
    return {
      portalState: defaultState,
      requestBoardsByProfessionalId: defaultRequestBoards,
    };
  }

  try {
    const storedSnapshot = professionalPortalRepository.read();

    if (!storedSnapshot || storedSnapshot.schemaVersion !== PROFESSIONAL_PORTAL_SCHEMA_VERSION) {
      return {
        portalState: defaultState,
        requestBoardsByProfessionalId: defaultRequestBoards,
      };
    }

    const sanitizedRequestBoards = {
      ...defaultRequestBoards,
      ...sanitizeRequestBoardsByProfessionalId(storedSnapshot.requestBoardsByProfessionalId),
    };
    const activeProfessionalId = storedSnapshot.state.activeProfessionalId || defaultState.activeProfessionalId;
    const requestBoard =
      sanitizedRequestBoards[activeProfessionalId] ||
      sanitizeRequestBoard(activeProfessionalId, storedSnapshot.state.requestBoard);
    const portalState = sanitizePortalState({
      ...storedSnapshot.state,
      requestBoard,
    });

    return {
      portalState,
      requestBoardsByProfessionalId: {
        ...sanitizedRequestBoards,
        [portalState.activeProfessionalId]: requestBoard,
      },
    };
  } catch {
    return {
      portalState: defaultState,
      requestBoardsByProfessionalId: defaultRequestBoards,
    };
  }
};

const persistProfessionalPortalState = (
  nextState: ProfessionalPortalState,
  requestBoardsByProfessionalId: Record<string, ProfessionalManagedRequest[]>,
) => {
  if (typeof window === 'undefined') {
    return;
  }

  professionalPortalRepository.write(createProfessionalPortalSnapshot(nextState, requestBoardsByProfessionalId));
};

const getRequestLastUpdatedAt = (request: ProfessionalManagedRequest) =>
  request.statusHistory[request.statusHistory.length - 1]?.createdAt || request.requestedAt;

const buildCustomerAppointmentsFromRequestBoards = (
  requestBoardsByProfessionalId: Record<string, ProfessionalManagedRequest[]>,
): Appointment[] =>
  Object.entries(requestBoardsByProfessionalId)
    .flatMap(([professionalId, requests]) =>
      requests
        .filter((request) => request.clientId === ACTIVE_CONSUMER.id)
        .map((request) => ({
          professionalId,
          request,
        })),
    )
    .sort(
      (leftEntry, rightEntry) =>
        new Date(getRequestLastUpdatedAt(rightEntry.request)).getTime() -
        new Date(getRequestLastUpdatedAt(leftEntry.request)).getTime(),
    )
    .map(({ professionalId, request }) =>
      createHydratedAppointment({
        areaId: request.areaId,
        consumerId: request.clientId,
        id: request.appointmentId,
        professionalId,
        requestChannel: request.channel,
        requestNote: request.note,
        requestedAt: request.requestedAt,
        requestedMode: request.requestedMode,
        scheduledTimeLabel: request.scheduledTimeLabel,
        serviceId: request.serviceId,
        status: request.customerStatus,
        totalPriceLabel: request.budgetLabel,
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
      index: index + 1,
      price: service.price,
      scheduleByMode: service.scheduleByMode,
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
  const [requestBoardsByProfessionalId, setRequestBoardsByProfessionalId] = useState<
    Record<string, ProfessionalManagedRequest[]>
  >(() => readProfessionalPortalData().requestBoardsByProfessionalId);

  useEffect(() => {
    const syncPortalState = () => {
      const nextData = readProfessionalPortalData();
      setPortalState(nextData.portalState);
      setRequestBoardsByProfessionalId(nextData.requestBoardsByProfessionalId);
    };

    return professionalPortalRepository.subscribe(syncPortalState);
  }, []);

  const updatePortalState = (
    nextState: ProfessionalPortalState,
    nextRequestBoardsInput?: Record<string, ProfessionalManagedRequest[]>,
  ) => {
    const candidateState = sanitizePortalState(nextState);
    const candidateRequestBoards = sanitizeRequestBoardsByProfessionalId({
      ...requestBoardsByProfessionalId,
      ...nextRequestBoardsInput,
      [candidateState.activeProfessionalId]:
        nextRequestBoardsInput?.[candidateState.activeProfessionalId] || candidateState.requestBoard,
    });
    const sanitizedState = sanitizePortalState({
      ...candidateState,
      requestBoard: candidateRequestBoards[candidateState.activeProfessionalId] || candidateState.requestBoard,
    });

    setPortalState(sanitizedState);
    setRequestBoardsByProfessionalId(candidateRequestBoards);
    persistProfessionalPortalState(sanitizedState, candidateRequestBoards);
  };

  const updatePortalStateWith = (updater: (currentState: ProfessionalPortalState) => ProfessionalPortalState) => {
    updatePortalState(updater(portalState));
  };

  const startProfessionalLogin = ({ phone, professionalId }: ProfessionalAccessDraft) => {
    const requestBoard =
      requestBoardsByProfessionalId[professionalId] ||
      buildDefaultRequestBoard(getProfessionalById(professionalId) || defaultProfessional);
    const nextState = sanitizePortalState({
      ...buildDefaultPortalState(professionalId),
      activeProfessionalId: professionalId,
      onboardingCompleted: true,
      phone,
      requestBoard,
    });

    updatePortalState(nextState, {
      ...requestBoardsByProfessionalId,
      [professionalId]: requestBoard,
    });
    continueAsProfessional();
  };

  const startProfessionalRegistration = ({
    city,
    credentialNumber,
    displayName,
    phone,
    professionalId,
  }: ProfessionalAccessDraft) => {
    const requestBoard =
      requestBoardsByProfessionalId[professionalId] ||
      buildDefaultRequestBoard(getProfessionalById(professionalId) || defaultProfessional);
    const nextState = sanitizePortalState({
      ...buildDefaultPortalState(professionalId),
      activeProfessionalId: professionalId,
      city,
      credentialNumber,
      displayName,
      onboardingCompleted: false,
      phone,
      requestBoard,
    });

    updatePortalState(nextState, {
      ...requestBoardsByProfessionalId,
      [professionalId]: requestBoard,
    });
    continueAsProfessional();
  };

  const completeProfessionalSetup = (input: ProfessionalSetupInput) => {
    updatePortalStateWith((currentState) => ({
      ...currentState,
      coverageAreaIds: input.coverageAreaIds,
      onboardingCompleted: true,
      practiceModes: input.practiceModes,
      yearsExperience: input.yearsExperience,
    }));
    continueAsProfessional();
  };

  const switchProfessionalProfile = (professionalId: string) => {
    const professional = getProfessionalById(professionalId) || defaultProfessional;
    const requestBoard = requestBoardsByProfessionalId[professionalId] || buildDefaultRequestBoard(professional);

    updatePortalState({
      ...buildDefaultPortalState(professionalId),
      requestBoard,
    });
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

  const createCustomerRequest = ({
    budgetLabel,
    channel,
    note,
    priority = 'high',
    professionalId,
    requestedMode,
    scheduledTimeLabel,
    serviceId,
  }: CreateCustomerRequestInput) => {
    const professional = getProfessionalById(professionalId) || defaultProfessional;
    const baseRequestBoard = requestBoardsByProfessionalId[professionalId] || buildDefaultRequestBoard(professional);
    const requestTimestamp = Date.now();
    const requestId = `professional-request-${professionalId}-${requestTimestamp}`;
    const requestedAt = new Date();
    const requestedAtLabel = formatRequestStatusTimestamp(requestedAt);
    const nextScheduledTimeLabel =
      scheduledTimeLabel?.trim() ||
      (requestedMode === 'online' ? 'Menunggu detail sesi online' : 'Menunggu konfirmasi jadwal');
    const existingRequest = baseRequestBoard.find(
      (request) =>
        request.clientId === ACTIVE_CONSUMER.id && request.serviceId === serviceId && request.status === 'new',
    );
    const nextRequestBoard = existingRequest
      ? baseRequestBoard.map((request) =>
          request.id === existingRequest.id
            ? sanitizeManagedRequest(
                {
                  ...request,
                  areaId: ACTIVE_USER_CONTEXT.area.id,
                  budgetLabel,
                  channel,
                  note,
                  priority,
                  requestedAt: requestedAt.toISOString(),
                  requestedAtLabel,
                  requestedMode,
                  scheduledTimeLabel: nextScheduledTimeLabel,
                  serviceId,
                  customerStatus: 'requested',
                  status: 'new',
                  statusHistory: [],
                },
                request,
              )
            : request,
        )
      : [
          sanitizeManagedRequest({
            appointmentId: `apt-local-${professionalId}-${requestTimestamp}`,
            areaId: ACTIVE_USER_CONTEXT.area.id,
            budgetLabel,
            channel,
            clientId: ACTIVE_CONSUMER.id,
            clientName: ACTIVE_CONSUMER.name,
            customerStatus: 'requested',
            id: requestId,
            note,
            priority,
            requestedAt: requestedAt.toISOString(),
            requestedAtLabel,
            requestedMode,
            scheduledTimeLabel: nextScheduledTimeLabel,
            serviceId,
            status: 'new',
            statusHistory: [],
          }),
          ...baseRequestBoard,
        ];

    updatePortalState(
      portalState.activeProfessionalId === professionalId
        ? {
            ...portalState,
            requestBoard: nextRequestBoard,
          }
        : portalState,
      {
        ...requestBoardsByProfessionalId,
        [professionalId]: nextRequestBoard,
      },
    );
  };

  const markCustomerAppointmentPaid = (appointmentId: string) => {
    let hasChanged = false;
    const nextRequestBoards = Object.fromEntries(
      Object.entries(requestBoardsByProfessionalId).map(([professionalId, requestBoard]) => [
        professionalId,
        requestBoard.map((request) => {
          if (request.appointmentId !== appointmentId || request.customerStatus !== 'approved_waiting_payment') {
            return request;
          }

          hasChanged = true;
          return sanitizeManagedRequest(
            {
              ...request,
              customerStatus: 'paid',
            },
            request,
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
        requestBoard: nextRequestBoards[portalState.activeProfessionalId] || portalState.requestBoard,
      },
      nextRequestBoards,
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
    const nextRequestBoard = portalState.requestBoard.map((currentRequest) =>
      currentRequest.id === requestId
        ? {
            ...currentRequest,
            customerStatus: getCustomerStatusFromRequestStatus(status, currentRequest.customerStatus),
            status,
            statusHistory: [
              ...currentRequest.statusHistory,
              {
                createdAt: updatedAt.toISOString(),
                createdAtLabel: formatRequestStatusTimestamp(updatedAt),
                customerSummary: input?.customerSummary?.trim() || undefined,
                evidenceNote: input?.evidenceNote?.trim() || undefined,
                evidenceUrl: input?.evidenceUrl?.trim() || undefined,
                fromStatus: currentRequest.status,
                id: `${currentRequest.id}-history-${currentRequest.statusHistory.length + 1}`,
                status,
              },
            ],
          }
        : currentRequest,
    );

    updatePortalState(
      {
        ...portalState,
        requestBoard: nextRequestBoard,
      },
      {
        ...requestBoardsByProfessionalId,
        [portalState.activeProfessionalId]: nextRequestBoard,
      },
    );

    return {
      ok: true as const,
    };
  };

  const baseProfessional = getProfessionalById(portalState.activeProfessionalId) || defaultProfessional;
  const activeProfessional = baseProfessional ? mergeProfessionalWithPortalState(baseProfessional, portalState) : null;
  const publicProfessionals = MOCK_PROFESSIONALS.map((professional) =>
    professional.id === activeProfessional?.id ? activeProfessional : professional,
  );
  const activeCoverageAreas = portalState.coverageAreaIds
    .map((areaId) => getAreaById(areaId))
    .filter((area): area is Area => Boolean(area));
  const customerAppointments = buildCustomerAppointmentsFromRequestBoards(requestBoardsByProfessionalId);
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
  const profileCompletionScore = Math.round(
    (([
      portalState.displayName,
      portalState.phone,
      portalState.city,
      portalState.credentialNumber,
      portalState.yearsExperience,
      portalState.publicBio,
    ].filter((value) => Boolean(value?.trim())).length +
      (portalState.practiceModes.length > 0 ? 1 : 0) +
      (portalState.coverageAreaIds.length > 0 ? 1 : 0) +
      (activeServiceConfigurations.length > 0 ? 1 : 0) +
      (publicPortfolioEntries.length > 0 ? 1 : 0) +
      (portalState.galleryItems.length > 0 ? 1 : 0)) /
      10) *
      100,
  );

  return {
    activeCoverageAreas,
    activeProfessional,
    activeProfessionalCategoryLabel: activeProfessional ? getProfessionalCategoryLabel(activeProfessional) : '',
    activeServiceConfigurations,
    averageServicePriceLabel,
    customerAppointments,
    demoProfessionals: MOCK_PROFESSIONALS.slice(0, 4),
    featuredServiceConfiguration,
    inactiveServiceTemplates,
    portalState,
    profileCompletionScore,
    publicPortfolioEntries,
    publicProfessionals,
    requestStatusCounts,
    serviceCategories: MOCK_CATEGORIES,
    serviceTemplates: MOCK_SERVICES,
    updateRequestStatus,
    activateTemplateService,
    archiveService,
    completeProfessionalSetup,
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
    saveBusinessSettings,
    saveGalleryItem,
    savePortfolioEntry,
    saveServiceConfiguration,
    startProfessionalLogin,
    startProfessionalRegistration,
    switchProfessionalProfile,
    getAreaLabel: (areaId: string) => getAreaById(areaId)?.label || areaId,
    getPublicProfessionalById: (professionalId: string) =>
      publicProfessionals.find((professional) => professional.id === professionalId) || null,
    getPublicProfessionalBySlug: (professionalSlug: string) =>
      publicProfessionals.find((professional) => professional.slug === professionalSlug) || null,
    getServiceLabel: (serviceId: string) => getServiceById(serviceId)?.name || serviceId,
  };
};
