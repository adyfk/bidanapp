'use client';

import { createBidanappApiClient, fetchCatalogReadModel } from '@bidanapp/sdk';
import { useEffect, useState } from 'react';
import { getBackendApiBaseUrl } from '@/lib/backend';
import { normalizeProfessional } from '@/lib/catalog-normalizers';
import type { Area, Category, GlobalService, Professional } from '@/types/catalog';

interface CatalogReadModelSnapshot {
  areas: Area[];
  categories: Category[];
  professionals: Professional[];
  savedAt: string;
  services: GlobalService[];
}

const catalogReadModelEventName = 'bidanapp:catalog-read-model-change';
const requestTimeoutMs = 1500;
const client = createBidanappApiClient(getBackendApiBaseUrl());
let cachedCatalogReadModelSnapshot: CatalogReadModelSnapshot | null = null;

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number) =>
  new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => reject(new Error('Catalog read model request timed out')), timeoutMs);

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

const buildFallbackSnapshot = (): CatalogReadModelSnapshot => ({
  areas: [],
  categories: [],
  professionals: [],
  savedAt: new Date(0).toISOString(),
  services: [],
});

const normalizeCatalogReadModelSnapshot = (value: unknown): CatalogReadModelSnapshot => {
  const fallbackSnapshot = buildFallbackSnapshot();

  if (!value || typeof value !== 'object') {
    return fallbackSnapshot;
  }

  const candidate = value as Partial<CatalogReadModelSnapshot>;

  return {
    areas: Array.isArray(candidate.areas) ? (candidate.areas as Area[]) : fallbackSnapshot.areas,
    categories: Array.isArray(candidate.categories)
      ? (candidate.categories as Category[])
      : fallbackSnapshot.categories,
    professionals: Array.isArray(candidate.professionals)
      ? candidate.professionals.map((professional) => normalizeProfessional(professional))
      : fallbackSnapshot.professionals,
    savedAt:
      typeof candidate.savedAt === 'string' && candidate.savedAt.length > 0
        ? candidate.savedAt
        : fallbackSnapshot.savedAt,
    services: Array.isArray(candidate.services) ? (candidate.services as GlobalService[]) : fallbackSnapshot.services,
  };
};

const readCatalogReadModelSnapshot = (): CatalogReadModelSnapshot =>
  cachedCatalogReadModelSnapshot || buildFallbackSnapshot();

const writeCatalogReadModelSnapshot = (snapshot: CatalogReadModelSnapshot) => {
  cachedCatalogReadModelSnapshot = normalizeCatalogReadModelSnapshot(snapshot);

  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(catalogReadModelEventName));
};

const hydrateCatalogReadModelFromApi = async (): Promise<CatalogReadModelSnapshot | undefined> => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  try {
    const payload = await withTimeout(fetchCatalogReadModel(client), requestTimeoutMs);
    const snapshot = normalizeCatalogReadModelSnapshot({
      areas: payload.areas as Area[],
      categories: payload.categories as Category[],
      professionals: payload.professionals as unknown as Professional[],
      savedAt: new Date().toISOString(),
      services: payload.services as unknown as GlobalService[],
    });

    writeCatalogReadModelSnapshot(snapshot);
    return snapshot;
  } catch {
    return undefined;
  }
};

export const useCatalogReadModel = () => {
  const [snapshot, setSnapshot] = useState<CatalogReadModelSnapshot>(() => readCatalogReadModelSnapshot());

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncSnapshot = () => {
      setSnapshot(readCatalogReadModelSnapshot());
    };

    syncSnapshot();
    window.addEventListener(catalogReadModelEventName, syncSnapshot);

    void hydrateCatalogReadModelFromApi().then((nextSnapshot) => {
      if (nextSnapshot) {
        setSnapshot(nextSnapshot);
      }
    });

    return () => {
      window.removeEventListener(catalogReadModelEventName, syncSnapshot);
    };
  }, []);

  return snapshot;
};
