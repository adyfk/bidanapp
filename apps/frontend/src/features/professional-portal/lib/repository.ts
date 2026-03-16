import { PUBLIC_ENV } from '@/lib/env';
import {
  PROFESSIONAL_PORTAL_SCHEMA_VERSION,
  type ProfessionalManagedRequest,
  type ProfessionalPortalDataSource,
  type ProfessionalPortalSnapshot,
  type ProfessionalPortalState,
} from './contracts';

export interface ProfessionalPortalRepository {
  readonly source: ProfessionalPortalDataSource;
  read(): ProfessionalPortalSnapshot | null;
  subscribe(listener: () => void): () => void;
  write(snapshot: ProfessionalPortalSnapshot): void;
}

const professionalPortalStorageKey = 'bidanapp:professional-portal';
const professionalPortalEventName = 'bidanapp:professional-portal-change';

let hasApiFallbackWarning = false;
const repositoryCache = new Map<ProfessionalPortalDataSource, ProfessionalPortalRepository>();

const createLocalStorageProfessionalPortalRepository = (): ProfessionalPortalRepository => ({
  source: 'local',
  read() {
    if (typeof window === 'undefined') {
      return null;
    }

    const rawValue = window.localStorage.getItem(professionalPortalStorageKey);

    if (!rawValue) {
      return null;
    }

    return JSON.parse(rawValue) as ProfessionalPortalSnapshot;
  },
  subscribe(listener) {
    if (typeof window === 'undefined') {
      return () => {};
    }

    window.addEventListener('storage', listener);
    window.addEventListener(professionalPortalEventName, listener);

    return () => {
      window.removeEventListener('storage', listener);
      window.removeEventListener(professionalPortalEventName, listener);
    };
  },
  write(snapshot) {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(professionalPortalStorageKey, JSON.stringify(snapshot));
    window.dispatchEvent(new Event(professionalPortalEventName));
  },
});

const createApiProfessionalPortalRepository = (): ProfessionalPortalRepository => {
  const localRepository = createLocalStorageProfessionalPortalRepository();

  return {
    source: 'api',
    read() {
      warnAboutApiFallback();
      return localRepository.read();
    },
    subscribe(listener) {
      warnAboutApiFallback();
      return localRepository.subscribe(listener);
    },
    write(snapshot) {
      warnAboutApiFallback();
      localRepository.write(snapshot);
    },
  };
};

const warnAboutApiFallback = () => {
  if (hasApiFallbackWarning || typeof window === 'undefined') {
    return;
  }

  hasApiFallbackWarning = true;
  console.warn(
    '[ProfessionalPortal] NEXT_PUBLIC_PROFESSIONAL_PORTAL_DATA_SOURCE=api is set, but the API repository is not implemented yet. Falling back to local storage.',
  );
};

export const createProfessionalPortalSnapshot = (
  state: ProfessionalPortalState,
  requestBoardsByProfessionalId?: Record<string, ProfessionalManagedRequest[]>,
): ProfessionalPortalSnapshot => ({
  requestBoardsByProfessionalId,
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
    source === 'api' ? createApiProfessionalPortalRepository() : createLocalStorageProfessionalPortalRepository();

  repositoryCache.set(source, nextRepository);
  return nextRepository;
};
