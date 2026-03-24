import {
  createBidanappApiClient,
  fetchProfessionalPortalSession,
  type ProfessionalPortalSessionSnapshot,
  saveProfessionalPortalSession,
} from '@bidanapp/sdk';
import { getBackendApiBaseUrl } from '@/lib/backend';
import { PUBLIC_ENV } from '@/lib/env';
import { hasProfessionalAuthSessionHint } from '@/lib/professional-auth-storage';
import {
  PROFESSIONAL_PORTAL_SCHEMA_VERSION,
  type ProfessionalLifecycleReviewState,
  type ProfessionalManagedAppointmentRecord,
  type ProfessionalManagedRequest,
  type ProfessionalPortalDataSource,
  type ProfessionalPortalSnapshot,
  type ProfessionalPortalState,
} from './contracts';

export interface ProfessionalPortalRepository {
  readonly source: ProfessionalPortalDataSource;
  hydrate(professionalId?: string): Promise<ProfessionalPortalSnapshot | null>;
  read(): ProfessionalPortalSnapshot | null;
  subscribe(listener: () => void): () => void;
  write(snapshot: ProfessionalPortalSnapshot): void;
}

const requestTimeoutMs = 1500;

let hasApiFallbackWarning = false;
let cachedProfessionalPortalSnapshot: ProfessionalPortalSnapshot | null = null;
const repositoryCache = new Map<ProfessionalPortalDataSource, ProfessionalPortalRepository>();
const professionalPortalListeners = new Set<() => void>();

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

const createInMemoryProfessionalPortalRepository = (): ProfessionalPortalRepository => ({
  source: 'local',
  async hydrate() {
    return this.read();
  },
  read() {
    return cachedProfessionalPortalSnapshot;
  },
  subscribe(listener) {
    professionalPortalListeners.add(listener);

    return () => {
      professionalPortalListeners.delete(listener);
    };
  },
  write(snapshot) {
    cachedProfessionalPortalSnapshot = snapshot;
    notifyProfessionalPortalSubscribers();
  },
});

const createApiProfessionalPortalRepository = (): ProfessionalPortalRepository => {
  const localRepository = createInMemoryProfessionalPortalRepository();
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
        if (!hasProfessionalAuthSessionHint()) {
          return localRepository.read();
        }

        const session = await withTimeout(fetchProfessionalPortalSession(client, professionalId), requestTimeoutMs);

        if (!session.hasSnapshot || !session.snapshot) {
          return localRepository.read();
        }

        const snapshot = session.snapshot as unknown as ProfessionalPortalSnapshot;
        localRepository.write(snapshot);
        return snapshot;
      } catch {
        warnAboutApiFallback(
          '[ProfessionalPortal] Backend sync is unavailable. Continuing with the local cache for this browser session.',
        );
        return localRepository.read();
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
      return localRepository.read();
    },
    subscribe(listener) {
      return localRepository.subscribe(listener);
    },
    write(snapshot) {
      localRepository.write(snapshot);
      if (!hasProfessionalAuthSessionHint()) {
        return;
      }

      void withTimeout(
        saveProfessionalPortalSession(client, {
          professionalId: snapshot.state.activeProfessionalId,
          snapshot: snapshot as unknown as ProfessionalPortalSessionSnapshot,
        }),
        requestTimeoutMs,
      ).catch(() => {
        warnAboutApiFallback(
          '[ProfessionalPortal] Failed to persist the latest portal state to the backend. Local cache is still active.',
        );
      });
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
  const source = PUBLIC_ENV.professionalPortalDataSource;
  const cachedRepository = repositoryCache.get(source);

  if (cachedRepository) {
    return cachedRepository;
  }

  const nextRepository =
    source === 'api' ? createApiProfessionalPortalRepository() : createInMemoryProfessionalPortalRepository();

  repositoryCache.set(source, nextRepository);
  return nextRepository;
};
