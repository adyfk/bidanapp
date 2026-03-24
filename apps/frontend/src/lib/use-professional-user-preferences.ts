'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { hydrateConsumerPreferencesFromApi, syncConsumerPreferencesToApi } from '@/lib/app-state-api';
import { findNearestAreaByPoint, getAreaById } from '@/lib/catalog-selectors';
import { hasCustomerAuthSessionHint, subscribeCustomerAuthSessionHint } from '@/lib/customer-auth-storage';
import { resolveLocationPoint, resolveLocationPointSync } from '@/lib/location-resolution';
import { useAppShell } from '@/lib/use-app-shell';
import { useCatalogReadModel } from '@/lib/use-catalog-read-model';
import type { Area, GeoPoint, ResolvedLocation } from '@/types/catalog';

const EMPTY_AREA: Area = {
  city: '',
  district: '',
  id: '',
  index: 0,
  label: '',
  latitude: 0,
  longitude: 0,
  province: '',
};

interface ConsumerPreferenceState {
  favoriteProfessionalIds: string[];
  resolvedLocation: ResolvedLocation;
  selectedAreaId: string;
  userLocation: GeoPoint;
}

const consumerPreferenceEventName = 'bidanapp:consumer-preferences-change';
const cachedPreferenceStateByConsumerId = new Map<string, ConsumerPreferenceState>();

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
    candidate.source === 'derived' &&
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

const normalizeFavoriteProfessionalIds = (value: unknown) =>
  Array.from(new Set(Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []));

const normalizePreferenceState = ({
  areas,
  defaultArea,
  defaultUserLocation,
  value,
}: {
  areas: Area[];
  defaultArea: Area;
  defaultUserLocation: GeoPoint;
  value?: Partial<ConsumerPreferenceState>;
}): ConsumerPreferenceState => {
  const favoriteProfessionalIds = normalizeFavoriteProfessionalIds(value?.favoriteProfessionalIds);
  const userLocation =
    value?.userLocation && isValidCoordinate(value.userLocation) ? value.userLocation : defaultUserLocation;
  const selectedArea =
    getAreaById(areas, value?.selectedAreaId || '') ||
    getAreaById(areas, value?.resolvedLocation?.areaId || '') ||
    findNearestAreaByPoint({
      areas,
      point: userLocation,
    }) ||
    defaultArea;
  const resolvedLocation =
    value?.resolvedLocation && isResolvedLocation(value.resolvedLocation)
      ? value.resolvedLocation
      : resolveLocationPointSync({
          areas,
          fallbackArea: selectedArea,
          point: userLocation,
        });

  return {
    favoriteProfessionalIds,
    resolvedLocation,
    selectedAreaId: selectedArea.id,
    userLocation,
  };
};

const readCachedPreferenceState = ({
  areas,
  consumerId,
  defaultArea,
  defaultUserLocation,
}: {
  areas: Area[];
  consumerId: string;
  defaultArea: Area;
  defaultUserLocation: GeoPoint;
}) =>
  normalizePreferenceState({
    areas,
    defaultArea,
    defaultUserLocation,
    value: cachedPreferenceStateByConsumerId.get(consumerId),
  });

const isSamePreferenceState = (leftState: ConsumerPreferenceState, rightState: ConsumerPreferenceState) =>
  leftState.selectedAreaId === rightState.selectedAreaId &&
  leftState.userLocation.latitude === rightState.userLocation.latitude &&
  leftState.userLocation.longitude === rightState.userLocation.longitude &&
  leftState.resolvedLocation.areaId === rightState.resolvedLocation.areaId &&
  leftState.resolvedLocation.formattedAddress === rightState.resolvedLocation.formattedAddress &&
  leftState.favoriteProfessionalIds.length === rightState.favoriteProfessionalIds.length &&
  leftState.favoriteProfessionalIds.every((value, index) => value === rightState.favoriteProfessionalIds[index]);

const writeCachedPreferenceState = (consumerId: string, nextState: ConsumerPreferenceState) => {
  const currentState = cachedPreferenceStateByConsumerId.get(consumerId);

  if (currentState && isSamePreferenceState(currentState, nextState)) {
    return;
  }

  cachedPreferenceStateByConsumerId.set(consumerId, nextState);

  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(consumerPreferenceEventName));
};

export const useProfessionalUserPreferences = () => {
  const { currentConsumer, currentUserContext } = useAppShell();
  const { areas } = useCatalogReadModel();
  const consumerId = currentConsumer.id || 'default';
  const defaultUserLocation = useMemo(
    () =>
      currentUserContext.userLocation && isValidCoordinate(currentUserContext.userLocation)
        ? currentUserContext.userLocation
        : {
            latitude: currentUserContext.area.latitude || 0,
            longitude: currentUserContext.area.longitude || 0,
          },
    [currentUserContext.area.latitude, currentUserContext.area.longitude, currentUserContext.userLocation],
  );
  const defaultArea = useMemo(
    () =>
      getAreaById(areas, currentUserContext.area.id) ||
      findNearestAreaByPoint({
        areas,
        point: defaultUserLocation,
      }) ||
      (currentUserContext.area.id ? currentUserContext.area : undefined) || {
        ...EMPTY_AREA,
        latitude: defaultUserLocation.latitude,
        longitude: defaultUserLocation.longitude,
      },
    [areas, currentUserContext.area, defaultUserLocation],
  );
  const [preferenceState, setPreferenceState] = useState<ConsumerPreferenceState>(() =>
    readCachedPreferenceState({
      areas,
      consumerId,
      defaultArea,
      defaultUserLocation,
    }),
  );
  const [hasCustomerAuthSession, setHasCustomerAuthSession] = useState(() => hasCustomerAuthSessionHint());
  const hasLoadedBackendRef = useRef(false);
  const selectedArea = useMemo(
    () =>
      getAreaById(areas, preferenceState.selectedAreaId) ||
      getAreaById(areas, preferenceState.resolvedLocation.areaId) ||
      findNearestAreaByPoint({
        areas,
        point: preferenceState.userLocation,
      }) ||
      defaultArea,
    [
      areas,
      defaultArea,
      preferenceState.resolvedLocation.areaId,
      preferenceState.selectedAreaId,
      preferenceState.userLocation,
    ],
  );

  useEffect(() => {
    setPreferenceState(
      readCachedPreferenceState({
        areas,
        consumerId,
        defaultArea,
        defaultUserLocation,
      }),
    );
  }, [areas, consumerId, defaultArea, defaultUserLocation]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncPreferences = () => {
      setPreferenceState(
        readCachedPreferenceState({
          areas,
          consumerId,
          defaultArea,
          defaultUserLocation,
        }),
      );
    };

    const unsubscribeAuth = subscribeCustomerAuthSessionHint(() => {
      setHasCustomerAuthSession(hasCustomerAuthSessionHint());
      syncPreferences();
    });

    window.addEventListener(consumerPreferenceEventName, syncPreferences);

    return () => {
      unsubscribeAuth();
      window.removeEventListener(consumerPreferenceEventName, syncPreferences);
    };
  }, [areas, consumerId, defaultArea, defaultUserLocation]);

  useEffect(() => {
    const nextPreferenceState: ConsumerPreferenceState = {
      favoriteProfessionalIds: preferenceState.favoriteProfessionalIds,
      resolvedLocation: preferenceState.resolvedLocation,
      selectedAreaId: selectedArea.id,
      userLocation: preferenceState.userLocation,
    };

    writeCachedPreferenceState(consumerId, nextPreferenceState);

    if (hasLoadedBackendRef.current) {
      syncConsumerPreferencesToApi(
        {
          consumerId,
          favoriteProfessionalIds: nextPreferenceState.favoriteProfessionalIds,
          resolvedLocation: nextPreferenceState.resolvedLocation,
          selectedAreaId: nextPreferenceState.selectedAreaId,
          userLocation: nextPreferenceState.userLocation,
        },
        consumerId,
      );
    }
  }, [
    consumerId,
    preferenceState.favoriteProfessionalIds,
    preferenceState.resolvedLocation,
    preferenceState.userLocation,
    selectedArea.id,
  ]);

  useEffect(() => {
    hasLoadedBackendRef.current = false;
    if (!hasCustomerAuthSession) {
      return;
    }

    void hydrateConsumerPreferencesFromApi(consumerId)
      .then((apiState) => {
        if (!apiState) {
          return;
        }

        const nextPreferenceState = normalizePreferenceState({
          areas,
          defaultArea,
          defaultUserLocation,
          value: {
            favoriteProfessionalIds: Array.isArray(apiState.favoriteProfessionalIds)
              ? apiState.favoriteProfessionalIds
              : undefined,
            resolvedLocation: isResolvedLocation(apiState.resolvedLocation) ? apiState.resolvedLocation : undefined,
            selectedAreaId: apiState.selectedAreaId,
            userLocation: apiState.userLocation,
          },
        });

        setPreferenceState(nextPreferenceState);
        writeCachedPreferenceState(consumerId, nextPreferenceState);
      })
      .finally(() => {
        hasLoadedBackendRef.current = true;
      });
  }, [areas, consumerId, defaultArea, defaultUserLocation, hasCustomerAuthSession]);

  const applyPreferenceState = (updater: (currentState: ConsumerPreferenceState) => ConsumerPreferenceState) => {
    setPreferenceState((currentState) => updater(currentState));
  };

  const setSelectedAreaId = async (areaId: string) => {
    const area = getAreaById(areas, areaId) || defaultArea;
    const nextLocation = {
      latitude: area.latitude,
      longitude: area.longitude,
    };
    const nextResolvedLocation = await resolveLocationPoint({
      areas,
      fallbackArea: area,
      point: nextLocation,
    });

    applyPreferenceState((currentState) => ({
      ...currentState,
      resolvedLocation: nextResolvedLocation,
      selectedAreaId: area.id,
      userLocation: nextLocation,
    }));

    return nextResolvedLocation;
  };

  const setUserLocation = async (location: GeoPoint) => {
    if (!isValidCoordinate(location)) {
      return undefined;
    }

    const nextResolvedLocation = await resolveLocationPoint({
      areas,
      fallbackArea: selectedArea,
      point: location,
    });

    applyPreferenceState((currentState) => ({
      ...currentState,
      resolvedLocation: nextResolvedLocation,
      selectedAreaId: nextResolvedLocation.areaId || selectedArea.id,
      userLocation: location,
    }));

    return nextResolvedLocation;
  };

  const resetUserLocation = () => setUserLocation(defaultUserLocation);

  const toggleFavorite = (professionalId: string) => {
    applyPreferenceState((currentState) => ({
      ...currentState,
      favoriteProfessionalIds: currentState.favoriteProfessionalIds.includes(professionalId)
        ? currentState.favoriteProfessionalIds.filter((currentId) => currentId !== professionalId)
        : [...currentState.favoriteProfessionalIds, professionalId],
    }));
  };

  const isFavorite = (professionalId: string) => preferenceState.favoriteProfessionalIds.includes(professionalId);

  return {
    favoriteProfessionalIds: preferenceState.favoriteProfessionalIds,
    isFavorite,
    isCustomLocation:
      preferenceState.userLocation.latitude !== defaultUserLocation.latitude ||
      preferenceState.userLocation.longitude !== defaultUserLocation.longitude,
    resetUserLocation,
    resolvedLocation: preferenceState.resolvedLocation,
    selectedArea,
    selectedAreaId: selectedArea.id,
    setSelectedAreaId,
    setUserLocation,
    toggleFavorite,
    userLocation: preferenceState.userLocation,
  };
};
