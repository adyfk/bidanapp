'use client';

import { useEffect, useRef, useState } from 'react';
import { type AdminConsoleReadModelSnapshot, hydrateAdminConsoleReadModelFromApi } from '@/lib/admin-read-model-api';
import {
  hydrateAdminConsoleFromApi,
  hydrateAdminConsoleTableFromApi,
  syncAdminConsoleTableToApi,
  syncAdminConsoleToApi,
} from '@/lib/app-state-api';
import type { AppointmentTimelineEvent } from '@/types/appointments';
import type { Category, GlobalService, Professional } from '@/types/catalog';
import type {
  AdminStaffRow,
  AppointmentRow,
  AppRuntimeSelectionRow,
  ConsumerRow,
  HomeFeedSnapshotRow,
  ProfessionalRow,
  ProfessionalServiceOfferingRow,
  UserContextRow,
} from '@/types/seed-data';

const ADMIN_CONSOLE_SCHEMA_VERSION = 1;
const adminConsoleEventName = 'bidanapp:admin-console-change';

interface ReferenceAppointmentStatusRow {
  code: string;
  description: string;
  isActive: boolean;
  isTerminal: boolean;
  label: string;
  nextStates: string[];
  phase: string;
}

interface AdminConsoleTables {
  admin_staff: AdminStaffRow[];
  app_runtime_selections: AppRuntimeSelectionRow[];
  appointments: AppointmentRow[];
  consumers: ConsumerRow[];
  home_feed_snapshots: HomeFeedSnapshotRow[];
  professional_service_offerings: ProfessionalServiceOfferingRow[];
  professionals: ProfessionalRow[];
  reference_appointment_statuses: ReferenceAppointmentStatusRow[];
  service_categories: Category[];
  services: GlobalService[];
  user_contexts: UserContextRow[];
}

export const ADMIN_CONSOLE_TABLE_NAMES = [
  'admin_staff',
  'app_runtime_selections',
  'appointments',
  'consumers',
  'home_feed_snapshots',
  'professional_service_offerings',
  'professionals',
  'reference_appointment_statuses',
  'service_categories',
  'services',
  'user_contexts',
] as const;

export type AdminConsoleTableName = (typeof ADMIN_CONSOLE_TABLE_NAMES)[number];

interface AdminConsoleSnapshot {
  savedAt: string;
  schemaVersion: typeof ADMIN_CONSOLE_SCHEMA_VERSION;
  tables: AdminConsoleTables;
}
let cachedAdminConsoleSnapshot: AdminConsoleSnapshot | null = null;

const DEFAULT_REFERENCE_APPOINTMENT_STATUSES: ReferenceAppointmentStatusRow[] = [
  {
    code: 'requested',
    description: 'Permintaan baru masuk dan menunggu tindak lanjut profesional.',
    isActive: true,
    isTerminal: false,
    label: 'Requested',
    nextStates: ['approved_waiting_payment', 'confirmed', 'rejected', 'expired'],
    phase: 'intake',
  },
  {
    code: 'approved_waiting_payment',
    description: 'Permintaan sudah disetujui dan pelanggan menunggu untuk menyelesaikan pembayaran.',
    isActive: true,
    isTerminal: false,
    label: 'Waiting Payment',
    nextStates: ['paid', 'cancelled', 'expired'],
    phase: 'payment',
  },
  {
    code: 'paid',
    description: 'Pembayaran sudah diterima dan layanan menunggu konfirmasi jadwal akhir.',
    isActive: true,
    isTerminal: false,
    label: 'Paid',
    nextStates: ['confirmed', 'cancelled', 'expired'],
    phase: 'payment',
  },
  {
    code: 'confirmed',
    description: 'Jadwal layanan sudah dikonfirmasi kedua pihak.',
    isActive: true,
    isTerminal: false,
    label: 'Confirmed',
    nextStates: ['in_service', 'cancelled'],
    phase: 'delivery',
  },
  {
    code: 'in_service',
    description: 'Layanan sedang berlangsung.',
    isActive: true,
    isTerminal: false,
    label: 'In Service',
    nextStates: ['completed', 'cancelled'],
    phase: 'delivery',
  },
  {
    code: 'completed',
    description: 'Layanan selesai dan appointment ditutup.',
    isActive: true,
    isTerminal: true,
    label: 'Completed',
    nextStates: [],
    phase: 'closed',
  },
  {
    code: 'cancelled',
    description: 'Appointment dibatalkan oleh salah satu pihak.',
    isActive: true,
    isTerminal: true,
    label: 'Cancelled',
    nextStates: [],
    phase: 'closed',
  },
  {
    code: 'rejected',
    description: 'Permintaan ditolak sebelum layanan dikonfirmasi.',
    isActive: true,
    isTerminal: true,
    label: 'Rejected',
    nextStates: [],
    phase: 'closed',
  },
  {
    code: 'expired',
    description: 'Permintaan melewati SLA atau batas waktu pembayaran.',
    isActive: true,
    isTerminal: true,
    label: 'Expired',
    nextStates: [],
    phase: 'closed',
  },
];

const cloneValue = <T>(value: T): T => {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
};

const reindexRows = <TRow extends { index?: number }>(rows: TRow[]) =>
  rows.map((row, index) => ({
    ...row,
    index: index + 1,
  })) as TRow[];

const replaceRowById = <TRow extends { id: string }>(rows: TRow[], rowId: string, changes: Partial<TRow>) =>
  rows.map((row) => (row.id === rowId ? ({ ...row, ...changes } as TRow) : row));

const setTableRows = <TName extends AdminConsoleTableName>(
  tables: AdminConsoleTables,
  tableName: TName,
  rows: AdminConsoleTables[TName],
) => {
  tables[tableName] = rows;
};

const setPartialTableRows = <TName extends AdminConsoleTableName>(
  tables: Partial<AdminConsoleTables>,
  tableName: TName,
  rows: AdminConsoleTables[TName],
) => {
  tables[tableName] = rows;
};

const buildDefaultTables = (): AdminConsoleTables => ({
  admin_staff: [],
  app_runtime_selections: [],
  appointments: [],
  consumers: [],
  home_feed_snapshots: [],
  professional_service_offerings: [],
  professionals: [],
  reference_appointment_statuses: cloneValue(DEFAULT_REFERENCE_APPOINTMENT_STATUSES),
  service_categories: [],
  services: [],
  user_contexts: [],
});

const buildDefaultSnapshot = (): AdminConsoleSnapshot => ({
  savedAt: new Date().toISOString(),
  schemaVersion: ADMIN_CONSOLE_SCHEMA_VERSION,
  tables: buildDefaultTables(),
});

const buildSnapshotFromReadModel = (readModel: AdminConsoleReadModelSnapshot): AdminConsoleSnapshot => {
  const tables = buildDefaultTables();

  return {
    savedAt: new Date().toISOString(),
    schemaVersion: ADMIN_CONSOLE_SCHEMA_VERSION,
    tables: {
      ...tables,
      app_runtime_selections: reindexRows(cloneValue(readModel.appRuntimeSelections)),
      appointments: reindexRows(cloneValue(readModel.appointments)),
      consumers: reindexRows(cloneValue(readModel.consumers)),
      home_feed_snapshots: reindexRows(cloneValue(readModel.homeFeedSnapshots)),
      professional_service_offerings: reindexRows(cloneValue(readModel.professionalServiceOfferings)),
      professionals: reindexRows(cloneValue(readModel.professionals)),
      service_categories: reindexRows(cloneValue(readModel.serviceCategories)),
      services: reindexRows(cloneValue(readModel.services)),
      user_contexts: reindexRows(cloneValue(readModel.userContexts)),
    },
  };
};

const buildSnapshotFromSources = ({
  readModel,
  tableRows,
}: {
  readModel?: AdminConsoleReadModelSnapshot;
  tableRows?: Partial<AdminConsoleTables>;
}): AdminConsoleSnapshot => {
  const snapshot = readModel ? buildSnapshotFromReadModel(readModel) : buildDefaultSnapshot();
  const nextTables = cloneValue(snapshot.tables) as AdminConsoleTables;

  if (tableRows) {
    for (const tableName of ADMIN_CONSOLE_TABLE_NAMES) {
      const rows = tableRows[tableName];

      if (!Array.isArray(rows)) {
        continue;
      }

      setTableRows(
        nextTables,
        tableName,
        reindexRows(cloneValue(rows as { index?: number }[])) as AdminConsoleTables[typeof tableName],
      );
    }
  }

  return {
    ...snapshot,
    savedAt: new Date().toISOString(),
    tables: nextTables,
  };
};

const normalizeSnapshot = (value: unknown): AdminConsoleSnapshot => {
  const defaultSnapshot = buildDefaultSnapshot();

  if (!value || typeof value !== 'object') {
    return defaultSnapshot;
  }

  const rawSnapshot = value as Partial<AdminConsoleSnapshot>;

  if (
    rawSnapshot.schemaVersion !== ADMIN_CONSOLE_SCHEMA_VERSION ||
    !rawSnapshot.tables ||
    typeof rawSnapshot.tables !== 'object'
  ) {
    return defaultSnapshot;
  }

  const tables = buildDefaultTables();
  const nextTables = tables as Record<AdminConsoleTableName, AdminConsoleTables[AdminConsoleTableName]>;

  for (const tableName of ADMIN_CONSOLE_TABLE_NAMES) {
    const rows = rawSnapshot.tables[tableName];

    if (!Array.isArray(rows)) {
      continue;
    }

    nextTables[tableName] = reindexRows(
      cloneValue(rows as { index?: number }[]),
    ) as AdminConsoleTables[typeof tableName];
  }

  return {
    savedAt: rawSnapshot.savedAt || defaultSnapshot.savedAt,
    schemaVersion: ADMIN_CONSOLE_SCHEMA_VERSION,
    tables,
  };
};

const readAdminConsoleSnapshot = (): AdminConsoleSnapshot => {
  return cachedAdminConsoleSnapshot || buildDefaultSnapshot();
};

const writeAdminConsoleSnapshotToStorage = (snapshot: AdminConsoleSnapshot) => {
  cachedAdminConsoleSnapshot = normalizeSnapshot(snapshot);

  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(adminConsoleEventName));
};

export const clearAdminConsoleSnapshotCache = () => {
  writeAdminConsoleSnapshotToStorage(buildDefaultSnapshot());
};

const hydrateAdminConsoleTablesFromApi = async (): Promise<Partial<AdminConsoleTables> | undefined> => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const entries = await Promise.all(
    ADMIN_CONSOLE_TABLE_NAMES.map(async (tableName) => {
      const apiState = await hydrateAdminConsoleTableFromApi(tableName);

      return [tableName, apiState] as const;
    }),
  );
  const nextTables: Partial<AdminConsoleTables> = {};
  let hasHydratedTable = false;

  for (const [tableName, apiState] of entries) {
    if (!apiState || !Array.isArray(apiState.rows)) {
      continue;
    }

    setPartialTableRows(
      nextTables,
      tableName,
      reindexRows(cloneValue(apiState.rows as { index?: number }[])) as AdminConsoleTables[typeof tableName],
    );
    hasHydratedTable = true;
  }

  return hasHydratedTable ? nextTables : undefined;
};

const persistAdminConsoleSnapshot = (snapshot: AdminConsoleSnapshot, syncBackend: boolean) => {
  writeAdminConsoleSnapshotToStorage(snapshot);

  if (syncBackend) {
    syncAdminConsoleToApi({
      savedAt: snapshot.savedAt,
      schemaVersion: snapshot.schemaVersion,
      tables: Object.fromEntries(
        ADMIN_CONSOLE_TABLE_NAMES.map((tableName) => [
          tableName,
          snapshot.tables[tableName] as unknown as Array<Record<string, unknown>>,
        ]),
      ),
    });
  }
};

const persistAdminConsoleTables = (
  snapshot: AdminConsoleSnapshot,
  tableNames: AdminConsoleTableName[],
  syncBackend: boolean,
) => {
  writeAdminConsoleSnapshotToStorage(snapshot);

  if (!syncBackend) {
    return;
  }

  for (const tableName of tableNames) {
    syncAdminConsoleTableToApi(tableName, {
      rows: snapshot.tables[tableName] as unknown as Array<Record<string, unknown>>,
      savedAt: snapshot.savedAt,
      schemaVersion: snapshot.schemaVersion,
    });
  }
};

const parseNumber = (value: string, fallback = 0) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';

const createTimestampId = (prefix: string) => `${prefix}-${Date.now().toString(36)}`;

const getNextNumericId = (values: string[]) => {
  const numericValues = values
    .map((value) => Number.parseInt(value.replace(/[^\d]/g, ''), 10))
    .filter((value) => Number.isFinite(value));

  return String((numericValues.length ? Math.max(...numericValues) : 0) + 1);
};

const withUpdatedTable = <TName extends AdminConsoleTableName>(
  currentSnapshot: AdminConsoleSnapshot,
  tableName: TName,
  rows: AdminConsoleTables[TName],
): AdminConsoleSnapshot => ({
  ...currentSnapshot,
  tables: {
    ...currentSnapshot.tables,
    [tableName]: reindexRows(cloneValue(rows as { index?: number }[])) as AdminConsoleTables[TName],
  },
});

const formatTimelineLabel = (value: string) =>
  new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

const createAdminRequestedTimeline = ({
  appointmentId,
  requestedAt,
  serviceName,
}: {
  appointmentId: string;
  requestedAt: string;
  serviceName: string;
}): AppointmentTimelineEvent[] => [
  {
    actor: 'system',
    createdAt: requestedAt,
    createdAtLabel: formatTimelineLabel(requestedAt),
    customerSummary: `Permintaan ${serviceName} dibuat ulang dari admin console dan menunggu tindak lanjut operasional.`,
    id: `${appointmentId}-timeline-requested`,
    internalNote: `Booking ${appointmentId} dibuat dari admin console sebagai data operasional baru.`,
    toStatus: 'requested',
  },
];

export const useAdminConsoleData = () => {
  const [snapshot, setSnapshot] = useState<AdminConsoleSnapshot>(() => readAdminConsoleSnapshot());
  const hasLoadedBackendRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncSnapshot = () => {
      setSnapshot(readAdminConsoleSnapshot());
    };

    syncSnapshot();
    window.addEventListener(adminConsoleEventName, syncSnapshot);

    void hydrateAdminConsoleFromApi()
      .then(async (apiState) => {
        if (apiState) {
          const nextSnapshot = normalizeSnapshot(apiState);
          setSnapshot(nextSnapshot);
          writeAdminConsoleSnapshotToStorage(nextSnapshot);
          return;
        }

        const [tableRows, readModel] = await Promise.all([
          hydrateAdminConsoleTablesFromApi(),
          hydrateAdminConsoleReadModelFromApi(),
        ]);

        if (!tableRows && !readModel) {
          return;
        }

        const nextSnapshot = buildSnapshotFromSources({
          readModel,
          tableRows,
        });
        setSnapshot(nextSnapshot);
        writeAdminConsoleSnapshotToStorage(nextSnapshot);
      })
      .finally(() => {
        hasLoadedBackendRef.current = true;
      });

    return () => {
      window.removeEventListener(adminConsoleEventName, syncSnapshot);
    };
  }, []);

  const updateSnapshot = (updater: (currentSnapshot: AdminConsoleSnapshot) => AdminConsoleSnapshot) => {
    setSnapshot((currentSnapshot) => {
      const updatedSnapshot = updater(currentSnapshot);

      if (updatedSnapshot === currentSnapshot) {
        return currentSnapshot;
      }

      const nextSnapshot = {
        ...updatedSnapshot,
        savedAt: new Date().toISOString(),
      };
      const changedTableNames = ADMIN_CONSOLE_TABLE_NAMES.filter(
        (tableName) => currentSnapshot.tables[tableName] !== nextSnapshot.tables[tableName],
      );

      if (changedTableNames.length > 0 && changedTableNames.length < ADMIN_CONSOLE_TABLE_NAMES.length) {
        persistAdminConsoleTables(nextSnapshot, changedTableNames, hasLoadedBackendRef.current);
      } else {
        persistAdminConsoleSnapshot(nextSnapshot, hasLoadedBackendRef.current);
      }

      return nextSnapshot;
    });
  };

  const updateRows = <TName extends AdminConsoleTableName>(tableName: TName, rows: AdminConsoleTables[TName]) => {
    updateSnapshot((currentSnapshot) => withUpdatedTable(currentSnapshot, tableName, rows));
  };

  const updateConsumer = (consumerId: string, changes: Partial<ConsumerRow>) => {
    updateRows('consumers', replaceRowById(snapshot.tables.consumers, consumerId, changes));
  };

  const updateUserContext = (contextId: string, changes: Partial<UserContextRow>) => {
    updateRows('user_contexts', replaceRowById(snapshot.tables.user_contexts, contextId, changes));
  };

  const updateRuntimeSelection = (selectionId: string, changes: Partial<AppRuntimeSelectionRow>) => {
    updateRows('app_runtime_selections', replaceRowById(snapshot.tables.app_runtime_selections, selectionId, changes));
  };

  const updateService = (serviceId: string, changes: Partial<GlobalService>) => {
    updateRows('services', replaceRowById(snapshot.tables.services, serviceId, changes));
  };

  const updateCategory = (categoryId: string, changes: Partial<Category>) => {
    updateRows('service_categories', replaceRowById(snapshot.tables.service_categories, categoryId, changes));
  };

  const updateProfessional = (professionalId: string, changes: Partial<ProfessionalRow>) => {
    updateRows('professionals', replaceRowById(snapshot.tables.professionals, professionalId, changes));
  };

  const updateProfessionalServiceOffering = (offeringId: string, changes: Partial<ProfessionalServiceOfferingRow>) => {
    updateRows(
      'professional_service_offerings',
      replaceRowById(snapshot.tables.professional_service_offerings, offeringId, changes),
    );
  };

  const updateAppointment = (appointmentId: string, changes: Partial<AppointmentRow>) => {
    updateRows('appointments', replaceRowById(snapshot.tables.appointments, appointmentId, changes));
  };

  const updateAdminStaff = (adminId: string, changes: Partial<AdminStaffRow>) => {
    updateRows('admin_staff', replaceRowById(snapshot.tables.admin_staff, adminId, changes));
  };

  const createConsumer = (): ConsumerRow | null => {
    let nextRow: ConsumerRow | null = null;

    updateSnapshot((currentSnapshot) => {
      const row: ConsumerRow = {
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop',
        id: createTimestampId('consumer'),
        index: currentSnapshot.tables.consumers.length + 1,
        name: `Customer ${currentSnapshot.tables.consumers.length + 1}`,
        phone: '',
      };
      nextRow = row;

      return withUpdatedTable(currentSnapshot, 'consumers', [...currentSnapshot.tables.consumers, row]);
    });

    return nextRow;
  };

  const deleteConsumer = (consumerId: string) => {
    if (snapshot.tables.consumers.length <= 1) {
      return {
        message: 'Minimal harus ada satu customer aktif.',
        ok: false,
      };
    }

    if (snapshot.tables.appointments.some((appointment) => appointment.consumerId === consumerId)) {
      return {
        message: 'Customer masih dipakai oleh appointment. Hapus atau pindahkan appointment dulu.',
        ok: false,
      };
    }

    if (snapshot.tables.home_feed_snapshots.some((row) => row.consumerId === consumerId)) {
      return {
        message: 'Customer masih dipakai oleh home feed snapshot.',
        ok: false,
      };
    }

    if (snapshot.tables.app_runtime_selections.some((selection) => selection.currentConsumerId === consumerId)) {
      return {
        message: 'Customer sedang aktif di runtime selection.',
        ok: false,
      };
    }

    updateRows(
      'consumers',
      snapshot.tables.consumers.filter((consumer) => consumer.id !== consumerId),
    );

    return {
      message: 'Customer berhasil dihapus dari snapshot admin.',
      ok: true,
    };
  };

  const createUserContext = (): UserContextRow | null => {
    let nextRow: UserContextRow | null = null;

    updateSnapshot((currentSnapshot) => {
      const row: UserContextRow = {
        id: createTimestampId('context'),
        index: currentSnapshot.tables.user_contexts.length + 1,
        onlineStatusLabel: 'Tersedia',
        selectedAreaId: 'jakarta-selatan-kebayoran-baru',
        userLatitude: -6.2447,
        userLongitude: 106.7986,
      };
      nextRow = row;

      return withUpdatedTable(currentSnapshot, 'user_contexts', [...currentSnapshot.tables.user_contexts, row]);
    });

    return nextRow;
  };

  const deleteUserContext = (contextId: string) => {
    if (snapshot.tables.user_contexts.length <= 1) {
      return {
        message: 'Minimal harus ada satu user context aktif.',
        ok: false,
      };
    }

    if (snapshot.tables.home_feed_snapshots.some((row) => row.userContextId === contextId)) {
      return {
        message: 'Context masih dipakai oleh home feed snapshot.',
        ok: false,
      };
    }

    if (snapshot.tables.app_runtime_selections.some((selection) => selection.currentUserContextId === contextId)) {
      return {
        message: 'Context sedang aktif di runtime selection.',
        ok: false,
      };
    }

    updateRows(
      'user_contexts',
      snapshot.tables.user_contexts.filter((context) => context.id !== contextId),
    );

    return {
      message: 'User context berhasil dihapus.',
      ok: true,
    };
  };

  const createProfessional = (): ProfessionalRow | null => {
    let nextRow: ProfessionalRow | null = null;

    updateSnapshot((currentSnapshot) => {
      const nextId = getNextNumericId(currentSnapshot.tables.professionals.map((professional) => professional.id));

      const row: ProfessionalRow = {
        about: 'Lengkapi ringkasan profesional ini dari admin console.',
        badgeLabel: 'Perlu review',
        clientsServed: '0+',
        coverImage: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=1200&auto=format&fit=crop',
        experience: '0+',
        gender: 'female',
        id: nextId,
        image: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?q=80&w=150&auto=format&fit=crop',
        index: currentSnapshot.tables.professionals.length + 1,
        isAvailable: false,
        location: 'Jakarta',
        name: `Profesional ${nextId}`,
        rating: 0,
        responseTime: '< 1 jam',
        reviews: '0',
        slug: `profesional-${nextId}`,
        title: 'Tenaga kesehatan',
      };
      nextRow = row;

      return withUpdatedTable(currentSnapshot, 'professionals', [...currentSnapshot.tables.professionals, row]);
    });

    return nextRow;
  };

  const deleteProfessional = (professionalId: string) => {
    if (snapshot.tables.professionals.length <= 1) {
      return {
        message: 'Minimal harus ada satu profesional aktif.',
        ok: false,
      };
    }

    if (snapshot.tables.professional_service_offerings.some((offering) => offering.professionalId === professionalId)) {
      return {
        message: 'Profesional masih punya service offering aktif.',
        ok: false,
      };
    }

    if (snapshot.tables.appointments.some((appointment) => appointment.professionalId === professionalId)) {
      return {
        message: 'Profesional masih dipakai oleh appointment.',
        ok: false,
      };
    }

    updateRows(
      'professionals',
      snapshot.tables.professionals.filter((professional) => professional.id !== professionalId),
    );

    return {
      message: 'Profesional berhasil dihapus.',
      ok: true,
    };
  };

  const createCategory = (): Category | null => {
    let nextRow: Category | null = null;

    updateSnapshot((currentSnapshot) => {
      const nextId = createTimestampId('category');

      const row: Category = {
        accentColor: '#E2E8F0',
        coverImage: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?q=80&w=1200&auto=format&fit=crop',
        description: 'Lengkapi deskripsi kategori layanan ini dari admin console.',
        iconImage: 'https://images.unsplash.com/photo-1544126592-807ade215a0b?q=80&w=200&auto=format&fit=crop',
        id: nextId,
        image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?q=80&w=600&auto=format&fit=crop',
        index: currentSnapshot.tables.service_categories.length + 1,
        name: `Kategori ${currentSnapshot.tables.service_categories.length + 1}`,
        overviewPoints: ['Lengkapi poin kategori', 'Tambahkan use case', 'Atur service terkait'],
        shortLabel: 'Layanan',
      };
      nextRow = row;

      return withUpdatedTable(currentSnapshot, 'service_categories', [
        ...currentSnapshot.tables.service_categories,
        row,
      ]);
    });

    return nextRow;
  };

  const deleteCategory = (categoryId: string) => {
    if (snapshot.tables.service_categories.length <= 1) {
      return {
        message: 'Minimal harus ada satu category.',
        ok: false,
      };
    }

    if (snapshot.tables.services.some((service) => service.categoryId === categoryId)) {
      return {
        message: 'Category masih dipakai oleh service. Pindahkan service dulu.',
        ok: false,
      };
    }

    updateRows(
      'service_categories',
      snapshot.tables.service_categories.filter((category) => category.id !== categoryId),
    );

    return {
      message: 'Category berhasil dihapus.',
      ok: true,
    };
  };

  const createService = (categoryId?: string): GlobalService | null => {
    let nextRow: GlobalService | null = null;

    updateSnapshot((currentSnapshot) => {
      const nextId = `s${getNextNumericId(currentSnapshot.tables.services.map((service) => service.id))}`;
      const nextSlug = slugify(`layanan-${nextId}`);

      const row: GlobalService = {
        categoryId: categoryId || currentSnapshot.tables.service_categories[0]?.id || 'general',
        coverImage: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?q=80&w=1200&auto=format&fit=crop',
        defaultMode: 'home_visit',
        description: 'Lengkapi deskripsi layanan ini dari admin console.',
        highlights: ['Lengkapi highlights layanan', 'Atur provider terkait', 'Review mode delivery'],
        id: nextId,
        image: 'https://images.unsplash.com/photo-1544126592-807ade215a0b?q=80&w=400&auto=format&fit=crop',
        index: currentSnapshot.tables.services.length + 1,
        name: `Layanan ${nextId.toUpperCase()}`,
        serviceModes: {
          homeVisit: true,
          online: false,
          onsite: false,
        },
        shortDescription: 'Lengkapi ringkasan layanan ini.',
        slug: nextSlug,
        tags: ['Admin'],
      };
      nextRow = row;

      return withUpdatedTable(currentSnapshot, 'services', [...currentSnapshot.tables.services, row]);
    });

    return nextRow;
  };

  const deleteService = (serviceId: string) => {
    if (snapshot.tables.services.length <= 1) {
      return {
        message: 'Minimal harus ada satu service.',
        ok: false,
      };
    }

    if (snapshot.tables.professional_service_offerings.some((offering) => offering.serviceId === serviceId)) {
      return {
        message: 'Service masih dipakai oleh provider offering.',
        ok: false,
      };
    }

    if (snapshot.tables.appointments.some((appointment) => appointment.serviceId === serviceId)) {
      return {
        message: 'Service masih dipakai oleh appointment.',
        ok: false,
      };
    }

    updateRows(
      'services',
      snapshot.tables.services.filter((service) => service.id !== serviceId),
    );

    return {
      message: 'Service berhasil dihapus.',
      ok: true,
    };
  };

  const createProfessionalServiceOffering = ({
    professionalId,
    serviceId,
  }: {
    professionalId?: string;
    serviceId?: string;
  }): ProfessionalServiceOfferingRow | null => {
    let nextRow: ProfessionalServiceOfferingRow | null = null;

    updateSnapshot((currentSnapshot) => {
      const targetProfessionalId = professionalId || currentSnapshot.tables.professionals[0]?.id;
      const targetServiceId = serviceId || currentSnapshot.tables.services[0]?.id;

      if (!targetProfessionalId || !targetServiceId) {
        return currentSnapshot;
      }

      const existingOffering = currentSnapshot.tables.professional_service_offerings.find(
        (offering) => offering.professionalId === targetProfessionalId && offering.serviceId === targetServiceId,
      );

      if (existingOffering) {
        nextRow = existingOffering;
        return currentSnapshot;
      }

      const row: ProfessionalServiceOfferingRow = {
        bookingFlow: 'request',
        defaultMode: 'home_visit',
        duration: '60 min',
        id: `professional-service-offering-${targetProfessionalId}-${targetServiceId}-${Date.now().toString(36)}`,
        index: currentSnapshot.tables.professional_service_offerings.length + 1,
        price: 'Rp 200.000',
        professionalId: targetProfessionalId,
        serviceId: targetServiceId,
        summary: 'Lengkapi ringkasan pricing dan cakupan offering ini.',
        supportsHomeVisit: true,
        supportsOnline: false,
        supportsOnsite: false,
      };
      nextRow = row;

      return withUpdatedTable(currentSnapshot, 'professional_service_offerings', [
        ...currentSnapshot.tables.professional_service_offerings,
        row,
      ]);
    });

    return nextRow;
  };

  const deleteProfessionalServiceOffering = (offeringId: string) => {
    if (snapshot.tables.professional_service_offerings.length <= 1) {
      return {
        message: 'Minimal harus ada satu service offering.',
        ok: false,
      };
    }

    if (snapshot.tables.appointments.some((appointment) => appointment.serviceOfferingId === offeringId)) {
      return {
        message: 'Offering masih dipakai oleh appointment.',
        ok: false,
      };
    }

    updateRows(
      'professional_service_offerings',
      snapshot.tables.professional_service_offerings.filter((offering) => offering.id !== offeringId),
    );

    return {
      message: 'Offering berhasil dihapus.',
      ok: true,
    };
  };

  const duplicateAppointment = (appointmentId: string): AppointmentRow | null => {
    let nextRow: AppointmentRow | null = null;

    updateSnapshot((currentSnapshot) => {
      const sourceAppointment = currentSnapshot.tables.appointments.find(
        (appointment) => appointment.id === appointmentId,
      );

      if (!sourceAppointment) {
        return currentSnapshot;
      }

      const nextId = createTimestampId('apt');
      const requestedAt = new Date().toISOString();

      const row: AppointmentRow = {
        ...sourceAppointment,
        cancellationResolution: null,
        customerFeedback: null,
        id: nextId,
        index: currentSnapshot.tables.appointments.length + 1,
        recentActivity: null,
        requestNote: `${sourceAppointment.requestNote}\n\n[Duplikat admin console]`,
        requestedAt,
        status: 'requested',
        timeline: createAdminRequestedTimeline({
          appointmentId: nextId,
          requestedAt,
          serviceName: sourceAppointment.serviceSnapshot.name,
        }),
      };
      nextRow = row;

      return withUpdatedTable(currentSnapshot, 'appointments', [...currentSnapshot.tables.appointments, row]);
    });

    return nextRow;
  };

  const deleteAppointment = (appointmentId: string) => {
    if (snapshot.tables.appointments.length <= 1) {
      return {
        message: 'Minimal harus ada satu appointment.',
        ok: false,
      };
    }

    updateRows(
      'appointments',
      snapshot.tables.appointments.filter((appointment) => appointment.id !== appointmentId),
    );

    return {
      message: 'Appointment berhasil dihapus.',
      ok: true,
    };
  };

  const replaceTable = <TName extends AdminConsoleTableName>(tableName: TName, rows: AdminConsoleTables[TName]) => {
    updateRows(tableName, rows);
  };

  const resetTable = (tableName: AdminConsoleTableName) => {
    const baselineTables = buildDefaultTables();

    updateSnapshot((currentSnapshot) => ({
      ...currentSnapshot,
      tables: {
        ...currentSnapshot.tables,
        [tableName]: baselineTables[tableName],
      },
    }));
  };

  const resetAll = () => {
    const nextSnapshot = buildDefaultSnapshot();
    setSnapshot(nextSnapshot);
    persistAdminConsoleSnapshot(nextSnapshot, hasLoadedBackendRef.current);
  };

  const importSnapshot = (value: string) => {
    const parsed = JSON.parse(value) as unknown;
    const nextSnapshot = normalizeSnapshot(parsed);

    setSnapshot(nextSnapshot);
    persistAdminConsoleSnapshot(nextSnapshot, hasLoadedBackendRef.current);
  };

  const getServicesForProfessional = (professionalId: string) =>
    snapshot.tables.professional_service_offerings.filter((offering) => offering.professionalId === professionalId);

  const getProvidersCountForService = (serviceId: string) =>
    snapshot.tables.professional_service_offerings.filter((offering) => offering.serviceId === serviceId).length;

  const seedTables = buildDefaultTables();
  const getSeedTableRows = <TName extends AdminConsoleTableName>(tableName: TName) => seedTables[tableName];
  const getTableMeta = (tableName: AdminConsoleTableName) => {
    const currentRows = snapshot.tables[tableName];
    const seedRows = seedTables[tableName];
    const isModified = JSON.stringify(currentRows) !== JSON.stringify(seedRows);

    return {
      currentCount: currentRows.length,
      isModified,
      seedCount: seedRows.length,
    };
  };
  const modifiedTableNames = ADMIN_CONSOLE_TABLE_NAMES.filter((tableName) => getTableMeta(tableName).isModified);

  const getProfessionalSummary = (professionalId: string): Professional | null => {
    const row = snapshot.tables.professionals.find((professional) => professional.id === professionalId);

    if (!row) {
      return null;
    }

    return {
      about: row.about,
      activityStories: [],
      availability: {
        isAvailable: row.isAvailable,
      },
      availabilityRulesByMode: undefined,
      badgeLabel: row.badgeLabel,
      cancellationPoliciesByMode: undefined,
      clientsServed: row.clientsServed,
      coverImage: row.coverImage || undefined,
      coverage: {
        areaIds: [],
        center: {
          latitude: 0,
          longitude: 0,
        },
        homeVisitRadiusKm: 0,
      },
      credentials: [],
      experience: row.experience,
      feedbackBreakdown: [],
      feedbackMetrics: [],
      feedbackSummary: {
        recommendationRate: '',
        repeatClientRate: '',
      },
      gallery: [],
      gender: row.gender,
      id: row.id,
      image: row.image,
      index: row.index,
      languages: [],
      location: row.location,
      name: row.name,
      portfolioEntries: [],
      practiceLocation: undefined,
      rating: row.rating,
      recentActivities: [],
      responseTime: row.responseTime,
      reviews: row.reviews,
      services: [],
      slug: row.slug,
      specialties: [],
      testimonials: [],
      title: row.title,
    };
  };

  return {
    adminStaff: snapshot.tables.admin_staff,
    adminStaffMembers: snapshot.tables.admin_staff.map((row) => ({
      email: row.email,
      focusArea: row.focusArea,
      id: row.id,
      index: row.index,
      name: row.name,
      phone: row.phone,
      presence: row.presence,
      shiftLabel: row.shiftLabel,
      title: row.title,
    })),
    appointments: snapshot.tables.appointments,
    categories: snapshot.tables.service_categories,
    createCategory,
    createConsumer,
    createProfessional,
    createProfessionalServiceOffering,
    createService,
    createUserContext,
    deleteAppointment,
    deleteCategory,
    deleteConsumer,
    deleteProfessional,
    deleteProfessionalServiceOffering,
    deleteService,
    deleteUserContext,
    duplicateAppointment,
    consumers: snapshot.tables.consumers,
    exportSnapshot: () => JSON.stringify(snapshot, null, 2),
    getSeedTableRows,
    getTableMeta,
    getProfessionalSummary,
    getProvidersCountForService,
    getServicesForProfessional,
    getTableRows: <TName extends AdminConsoleTableName>(tableName: TName) => snapshot.tables[tableName],
    getTables: () => snapshot.tables,
    importSnapshot,
    modifiedTableNames,
    professionalServiceOfferings: snapshot.tables.professional_service_offerings,
    professionals: snapshot.tables.professionals,
    replaceTable,
    resetAll,
    resetTable,
    runtimeSelections: snapshot.tables.app_runtime_selections,
    snapshotSavedAt: snapshot.savedAt,
    services: snapshot.tables.services,
    updateAdminStaff,
    updateAppointment,
    updateCategory,
    updateConsumer,
    updateProfessional,
    updateProfessionalServiceOffering,
    updateRuntimeSelection,
    updateService,
    updateUserContext,
    userContexts: snapshot.tables.user_contexts,
    utils: {
      parseNumber,
    },
  };
};
