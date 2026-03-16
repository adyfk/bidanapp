'use client';

import { useEffect, useState } from 'react';
import { resolveLocationPointMock, resolveLocationPointMockSync } from '@/lib/location-resolution';
import { findNearestAreaByPoint, getAreaById } from '@/lib/mock-db/catalog';
import { ACTIVE_CONSUMER, ACTIVE_USER_CONTEXT } from '@/lib/mock-db/runtime';
import type { GeoPoint, ResolvedLocation } from '@/types/catalog';

const favoriteStorageKey = `bidanapp:consumer:${ACTIVE_CONSUMER.id}:favorite-professionals`;
const areaStorageKey = `bidanapp:consumer:${ACTIVE_CONSUMER.id}:selected-area`;
const userLocationStorageKey = `bidanapp:consumer:${ACTIVE_CONSUMER.id}:selected-location-point`;
const resolvedLocationStorageKey = `bidanapp:consumer:${ACTIVE_CONSUMER.id}:resolved-location`;

const defaultAreaId = ACTIVE_USER_CONTEXT.area.id;
const defaultUserLocation = ACTIVE_USER_CONTEXT.userLocation;
const defaultResolvedLocation = resolveLocationPointMockSync(defaultUserLocation);

const isValidCoordinate = (location: GeoPoint) =>
  Number.isFinite(location.latitude) &&
  Number.isFinite(location.longitude) &&
  location.latitude >= -90 &&
  location.latitude <= 90 &&
  location.longitude >= -180 &&
  location.longitude <= 180;

const isResolvedLocation = (value: unknown): value is ResolvedLocation => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<ResolvedLocation>;

  return (
    candidate.source === 'mock' &&
    candidate.precision === 'district' &&
    typeof candidate.areaId === 'string' &&
    typeof candidate.areaLabel === 'string' &&
    typeof candidate.city === 'string' &&
    typeof candidate.district === 'string' &&
    typeof candidate.province === 'string' &&
    typeof candidate.postalCode === 'string' &&
    typeof candidate.country === 'string' &&
    typeof candidate.formattedAddress === 'string' &&
    !!candidate.point &&
    isValidCoordinate(candidate.point)
  );
};

const readFavoriteProfessionalIds = () => {
  if (typeof window === 'undefined') {
    return [] as string[];
  }

  try {
    const storedValue = window.localStorage.getItem(favoriteStorageKey);

    if (!storedValue) {
      return [] as string[];
    }

    const parsedValue = JSON.parse(storedValue);

    return Array.isArray(parsedValue) ? parsedValue.filter((value): value is string => typeof value === 'string') : [];
  } catch {
    return [] as string[];
  }
};

const readStoredUserLocation = () => {
  if (typeof window === 'undefined') {
    return defaultUserLocation;
  }

  try {
    const storedPoint = window.localStorage.getItem(userLocationStorageKey);

    if (storedPoint) {
      const parsedPoint = JSON.parse(storedPoint) as Partial<GeoPoint>;

      if (
        typeof parsedPoint?.latitude === 'number' &&
        typeof parsedPoint?.longitude === 'number' &&
        isValidCoordinate(parsedPoint as GeoPoint)
      ) {
        return parsedPoint as GeoPoint;
      }
    }

    const storedAreaId = window.localStorage.getItem(areaStorageKey);
    const storedArea = storedAreaId ? getAreaById(storedAreaId) : undefined;

    return storedArea
      ? {
          latitude: storedArea.latitude,
          longitude: storedArea.longitude,
        }
      : defaultUserLocation;
  } catch {
    return defaultUserLocation;
  }
};

const readStoredResolvedLocation = () => {
  if (typeof window === 'undefined') {
    return defaultResolvedLocation;
  }

  try {
    const storedValue = window.localStorage.getItem(resolvedLocationStorageKey);

    if (storedValue) {
      const parsedValue = JSON.parse(storedValue);

      if (isResolvedLocation(parsedValue)) {
        return parsedValue;
      }
    }

    return resolveLocationPointMockSync(readStoredUserLocation());
  } catch {
    return defaultResolvedLocation;
  }
};

export const useProfessionalUserPreferences = () => {
  const [favoriteProfessionalIds, setFavoriteProfessionalIds] = useState<string[]>(readFavoriteProfessionalIds);
  const [userLocationState, setUserLocationState] = useState<GeoPoint>(readStoredUserLocation);
  const [resolvedLocationState, setResolvedLocationState] = useState<ResolvedLocation>(readStoredResolvedLocation);
  const selectedArea =
    getAreaById(resolvedLocationState.areaId) || findNearestAreaByPoint(userLocationState) || ACTIVE_USER_CONTEXT.area;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(favoriteStorageKey, JSON.stringify(favoriteProfessionalIds));
  }, [favoriteProfessionalIds]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(userLocationStorageKey, JSON.stringify(userLocationState));
    window.localStorage.setItem(resolvedLocationStorageKey, JSON.stringify(resolvedLocationState));
    window.localStorage.setItem(areaStorageKey, selectedArea.id);
  }, [resolvedLocationState, selectedArea.id, userLocationState]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncPreferences = () => {
      setFavoriteProfessionalIds(readFavoriteProfessionalIds());
      setUserLocationState(readStoredUserLocation());
      setResolvedLocationState(readStoredResolvedLocation());
    };

    window.addEventListener('storage', syncPreferences);

    return () => window.removeEventListener('storage', syncPreferences);
  }, []);

  const applyResolvedLocation = (location: GeoPoint, resolvedLocation: ResolvedLocation) => {
    setUserLocationState(location);
    setResolvedLocationState(resolvedLocation);
  };

  const setSelectedAreaId = async (areaId: string) => {
    const area = getAreaById(areaId) || getAreaById(defaultAreaId);

    if (!area) {
      return undefined;
    }

    const nextLocation = {
      latitude: area.latitude,
      longitude: area.longitude,
    };
    const resolvedLocation = await resolveLocationPointMock(nextLocation);

    applyResolvedLocation(nextLocation, resolvedLocation);

    return resolvedLocation;
  };

  const setUserLocation = async (location: GeoPoint) => {
    if (!isValidCoordinate(location)) {
      return undefined;
    }

    const resolvedLocation = await resolveLocationPointMock(location);

    applyResolvedLocation(location, resolvedLocation);

    return resolvedLocation;
  };

  const resetUserLocation = () => setUserLocation(defaultUserLocation);

  const toggleFavorite = (professionalId: string) => {
    setFavoriteProfessionalIds((currentFavoriteIds) =>
      currentFavoriteIds.includes(professionalId)
        ? currentFavoriteIds.filter((currentId) => currentId !== professionalId)
        : [...currentFavoriteIds, professionalId],
    );
  };

  const isFavorite = (professionalId: string) => favoriteProfessionalIds.includes(professionalId);

  return {
    favoriteProfessionalIds,
    isFavorite,
    isCustomLocation:
      userLocationState.latitude !== defaultUserLocation.latitude ||
      userLocationState.longitude !== defaultUserLocation.longitude,
    resetUserLocation,
    resolvedLocation: resolvedLocationState,
    selectedArea,
    selectedAreaId: selectedArea.id,
    setSelectedAreaId,
    setUserLocation,
    toggleFavorite,
    userLocation: userLocationState,
  };
};
