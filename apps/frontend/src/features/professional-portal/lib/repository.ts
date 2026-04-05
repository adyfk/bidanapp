import {
  createBidanappApiClient,
  fetchProfessionalPortalSession,
  type ProfessionalPortalSessionSnapshot,
  saveProfessionalPortalSession,
} from '@bidanapp/sdk';
import { getBackendApiBaseUrl } from '@/lib/backend';
import {
  PROFESSIONAL_PORTAL_SCHEMA_VERSION,
  type ProfessionalLifecycleReviewState,
  type ProfessionalManagedAppointmentRecord,
  type ProfessionalManagedRequest,
  type ProfessionalPortalSnapshot,
  type ProfessionalPortalState,
} from './contracts';

export interface ProfessionalPortalRepository {
  readonly source: 'api';
  hydrate(professionalId?: string): Promise<ProfessionalPortalSnapshot | null>;
  read(): ProfessionalPortalSnapshot | null;
  subscribe(listener: () => void): () => void;
  write(snapshot: ProfessionalPortalSnapshot): Promise<void>;
}

const requestTimeoutMs = 1500;

let hasApiFallbackWarning = false;
let cachedProfessionalPortalSnapshot: ProfessionalPortalSnapshot | null = null;
const professionalPortalListeners = new Set<() => void>();
let cachedRepository: ProfessionalPortalRepository | null = null;

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number) =>
  new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => reject(new Error('Professional portal request timed out')), timeoutMs);

    promise.then(
      (value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timeoutId);
        reject(error);
      },
    );
  });

const notifyProfessionalPortalSubscribers = () => {
  for (const listener of professionalPortalListeners) {
    listener();
  }
};

const writeCachedSnapshot = (snapshot: ProfessionalPortalSnapshot | null) => {
  cachedProfessionalPortalSnapshot = snapshot;
  notifyProfessionalPortalSubscribers();
};

const createApiProfessionalPortalRepository = (): ProfessionalPortalRepository => {
  const client = createBidanappApiClient(getBackendApiBaseUrl());
  const hydrationPromises = new Map<string, Promise<ProfessionalPortalSnapshot | null>>();

  const hydrate = async (professionalId?: string): Promise<ProfessionalPortalSnapshot | null> => {
    if (typeof window === 'undefined') {
      return null;
    }

    const cacheKey = professionalId?.trim() || '__active__';
    const inflightRequest = hydrationPromises.get(cacheKey);

    if (inflightRequest) {
      return inflightRequest;
    }

    const request = (async () => {
      try {
        const session = await withTimeout(fetchProfessionalPortalSession(client, professionalId), requestTimeoutMs);

        if (!session.hasSnapshot || !session.snapshot) {
          writeCachedSnapshot(null);
          return null;
        }

        const snapshot = session.snapshot as unknown as ProfessionalPortalSnapshot;
        writeCachedSnapshot(snapshot);
        return snapshot;
      } catch {
        warnAboutApiFallback(
          '[ProfessionalPortal] Backend sync is unavailable. The latest persisted backend snapshot remains the source of truth.',
        );
        return cachedProfessionalPortalSnapshot;
      } finally {
        hydrationPromises.delete(cacheKey);
      }
    })();

    hydrationPromises.set(cacheKey, request);
    return request;
  };

  return {
    source: 'api',
    hydrate,
    read() {
      return cachedProfessionalPortalSnapshot;
    },
    subscribe(listener) {
      professionalPortalListeners.add(listener);

      return () => {
        professionalPortalListeners.delete(listener);
      };
    },
    async write(snapshot) {
      const previousSnapshot = cachedProfessionalPortalSnapshot;
      writeCachedSnapshot(snapshot);

      try {
        const savedSession = await withTimeout(
          saveProfessionalPortalSession(client, {
            professionalId: snapshot.state.activeProfessionalId,
            snapshot: snapshot as unknown as ProfessionalPortalSessionSnapshot,
          }),
          requestTimeoutMs,
        );

        if (savedSession.hasSnapshot && savedSession.snapshot) {
          writeCachedSnapshot(savedSession.snapshot as unknown as ProfessionalPortalSnapshot);
          return;
        }

        writeCachedSnapshot(snapshot);
      } catch {
        warnAboutApiFallback(
          '[ProfessionalPortal] Failed to persist the latest portal state to the backend. Reverting to the latest persisted backend snapshot.',
        );
        if (previousSnapshot && previousSnapshot.state.activeProfessionalId === snapshot.state.activeProfessionalId) {
          writeCachedSnapshot(previousSnapshot);
          return;
        }

        writeCachedSnapshot(snapshot);
      }
    },
  };
};

const warnAboutApiFallback = (message: string) => {
  if (hasApiFallbackWarning || typeof window === 'undefined') {
    return;
  }

  hasApiFallbackWarning = true;
  console.warn(message);
};

export const createProfessionalPortalSnapshot = (
  state: ProfessionalPortalState,
  appointmentRecordsByProfessionalId?: Record<string, ProfessionalManagedAppointmentRecord[]>,
  requestBoardsByProfessionalId?: Record<string, ProfessionalManagedRequest[]>,
  reviewStatesByProfessionalId?: Record<string, ProfessionalLifecycleReviewState>,
): ProfessionalPortalSnapshot => ({
  appointmentRecordsByProfessionalId,
  requestBoardsByProfessionalId,
  reviewStatesByProfessionalId,
  savedAt: new Date().toISOString(),
  schemaVersion: PROFESSIONAL_PORTAL_SCHEMA_VERSION,
  state,
});

export const getProfessionalPortalRepository = (): ProfessionalPortalRepository => {
  if (cachedRepository) {
    return cachedRepository;
  }

  cachedRepository = createApiProfessionalPortalRepository();
  return cachedRepository;
};
