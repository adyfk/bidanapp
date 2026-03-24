'use client';

import { ChevronDown, Clock, Heart, Loader2, MapPin, Search, SlidersHorizontal, Star, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Suspense, useEffect, useState } from 'react';
import { ProfessionalCard } from '@/components/ui/ProfessionalCard';
import {
  blushInputShellClass,
  blushSubtlePanelClass,
  filterChipClass,
  iconButtonSurfaceClass,
  insetSurfaceClass,
  mutedInputClass,
} from '@/components/ui/tokens';
import { getProfessionalCategories, getProfessionalCategoryLabel } from '@/lib/catalog-selectors';
import { APP_CONFIG } from '@/lib/config';
import { professionalRoute } from '@/lib/routes';
import { useUiText } from '@/lib/ui-text';
import { useProfessionalUserPreferences } from '@/lib/use-professional-user-preferences';
import type { UserContext } from '@/types/app-state';
import type { Area, Category, GeoPoint, GlobalService, Professional, ProfessionalGender } from '@/types/catalog';

const formatCoordinate = (value: number) => value.toFixed(6);

const ExploreContent = ({
  areas,
  categories,
  professionals,
  services,
  userContext,
}: {
  areas: Area[];
  categories: Category[];
  professionals: Professional[];
  services: GlobalService[];
  userContext: UserContext;
}) => {
  const searchParams = useSearchParams();
  const searchParam = searchParams.get('q');
  const categoryParam = searchParams.get('category');
  const initialSearch = searchParam ? decodeURIComponent(searchParam) : '';
  const initialCategoryId =
    categoryParam && categories.some((category) => category.id === categoryParam) ? categoryParam : 'all';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [activeFilter, setActiveFilter] = useState<'all' | 'top_rated' | 'available'>('all');
  const [activeCategoryId, setActiveCategoryId] = useState(initialCategoryId);
  const [selectedGender, setSelectedGender] = useState<ProfessionalGender | 'any'>('any');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [latitudeInput, setLatitudeInput] = useState(formatCoordinate(userContext.userLocation.latitude));
  const [longitudeInput, setLongitudeInput] = useState(formatCoordinate(userContext.userLocation.longitude));
  const t = useTranslations('Explore');
  const uiText = useUiText();
  const {
    favoriteProfessionalIds,
    isCustomLocation,
    isFavorite,
    resetUserLocation,
    resolvedLocation,
    selectedAreaId,
    setUserLocation,
    toggleFavorite,
    userLocation,
  } = useProfessionalUserPreferences();
  const genderOptions = uiText.exploreGenderOptions as { key: 'any' | ProfessionalGender; label: string }[];

  useEffect(() => {
    setSearchQuery(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    setActiveCategoryId(initialCategoryId);
  }, [initialCategoryId]);

  useEffect(() => {
    setLatitudeInput(formatCoordinate(userLocation.latitude));
    setLongitudeInput(formatCoordinate(userLocation.longitude));
  }, [userLocation.latitude, userLocation.longitude]);

  const activeFilterCount =
    Number(activeFilter !== 'all') +
    Number(activeCategoryId !== 'all') +
    Number(selectedGender !== 'any') +
    Number(favoritesOnly) +
    Number(isCustomLocation);

  const applyPointLocation = async () => {
    const latitude = Number.parseFloat(latitudeInput);
    const longitude = Number.parseFloat(longitudeInput);
    const nextPoint: GeoPoint = { latitude, longitude };

    if (
      Number.isNaN(latitude) ||
      Number.isNaN(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      setLocationError(t('invalidCoordinates'));
      return false;
    }

    try {
      setIsResolvingLocation(true);
      await setUserLocation(nextPoint);
      setLocationError(null);
      return true;
    } catch {
      setLocationError(t('locationResolveFailed'));
      return false;
    } finally {
      setIsResolvingLocation(false);
    }
  };

  const detectCurrentLocation = () => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setLocationError(t('locationBrowserUnsupported'));
      return;
    }

    setIsDetectingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextPoint = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        try {
          setIsResolvingLocation(true);
          await setUserLocation(nextPoint);
          setLatitudeInput(formatCoordinate(nextPoint.latitude));
          setLongitudeInput(formatCoordinate(nextPoint.longitude));
          setLocationError(null);
        } catch {
          setLocationError(t('locationResolveFailed'));
        } finally {
          setIsResolvingLocation(false);
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        if (error.code === 1) {
          setLocationError(t('locationPermissionDenied'));
        } else if (error.code === 2) {
          setLocationError(t('locationUnavailable'));
        } else if (error.code === 3) {
          setLocationError(t('locationTimeout'));
        } else {
          setLocationError(t('locationFetchFailed'));
        }

        setIsDetectingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  const resetFilters = async () => {
    setActiveFilter('all');
    setActiveCategoryId('all');
    setSelectedGender('any');
    setFavoritesOnly(false);
    setLatitudeInput(formatCoordinate(userContext.userLocation.latitude));
    setLongitudeInput(formatCoordinate(userContext.userLocation.longitude));
    setLocationError(null);
    try {
      setIsResolvingLocation(true);
      await resetUserLocation();
    } catch {
      setLocationError(t('locationResolveFailed'));
    } finally {
      setIsResolvingLocation(false);
    }
  };

  const filteredProfessionals = professionals.filter((professional) => {
    const categoryName = getProfessionalCategoryLabel({
      categories,
      professional,
      services,
    }).toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesServiceName =
      query.length === 0
        ? true
        : professional.services.some((serviceMapping) =>
            (services.find((service) => service.id === serviceMapping.serviceId)?.name || '')
              .toLowerCase()
              .includes(query),
          );

    const matchesSearch =
      professional.name.toLowerCase().includes(query) ||
      categoryName.includes(query) ||
      professional.location.toLowerCase().includes(query) ||
      matchesServiceName;

    const matchesAvailability =
      activeFilter === 'top_rated'
        ? professional.rating >= 4.8
        : activeFilter === 'available'
          ? professional.availability.isAvailable
          : true;
    const matchesCategory =
      activeCategoryId === 'all'
        ? true
        : getProfessionalCategories({
            categories,
            professional,
            services,
          }).some((category) => category.id === activeCategoryId);
    const matchesGender = selectedGender === 'any' ? true : professional.gender === selectedGender;
    const matchesFavorites = favoritesOnly ? isFavorite(professional.id) : true;

    return matchesSearch && matchesAvailability && matchesCategory && matchesGender && matchesFavorites;
  });

  return (
    <>
      <div
        className="relative flex h-full flex-col overflow-y-auto pb-24 custom-scrollbar"
        style={{ backgroundColor: APP_CONFIG.colors.bgLight }}
      >
        <div className="sticky top-0 z-20 px-6 pb-4 pt-14" style={{ backgroundColor: APP_CONFIG.colors.bgLight }}>
          <h1 className="mb-1 text-[22px] font-bold text-gray-900">
            {t('title', { professional: uiText.terms.professional })}
          </h1>
          <button
            type="button"
            onClick={() => setIsFilterModalOpen(true)}
            className="flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-80"
            style={{ color: APP_CONFIG.colors.textMuted }}
          >
            <MapPin className="h-4 w-4" style={{ color: APP_CONFIG.colors.primary }} />
            <span>{resolvedLocation.city}</span>
            <span className="text-xs opacity-70">({t('yourLocation')})</span>
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 px-6">
          <div className="flex gap-3">
            <div
              className={`${blushInputShellClass} flex flex-1 items-center rounded-full px-4 py-3 focus-within:border-pink-100 focus-within:ring-2 focus-within:ring-pink-100`}
            >
              <Search className="mr-2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('searchPlaceholder', { professional: uiText.terms.professional.toLowerCase() })}
                className="w-full border-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={() => setIsFilterModalOpen(true)}
              className={`relative h-12 w-12 ${iconButtonSurfaceClass}`}
            >
              <SlidersHorizontal className="h-5 w-5" />
              {activeFilterCount > 0 ? (
                <span
                  className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                  style={{ backgroundColor: APP_CONFIG.colors.primary }}
                >
                  {activeFilterCount}
                </span>
              ) : null}
            </button>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 className="text-[16px] font-bold text-gray-900">
                {t('resultsFound', { count: filteredProfessionals.length })}
              </h2>
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(true)}
                className="text-[12px] font-semibold"
                style={{ color: APP_CONFIG.colors.primary }}
              >
                {t('changeLocation')}
              </button>
            </div>
            <div className={`${blushSubtlePanelClass} mb-4 p-4`}>
              <p className="text-[12px] text-slate-500">{resolvedLocation.formattedAddress}</p>
              <p className="mt-2 text-[11px] text-slate-400">
                {formatCoordinate(userLocation.latitude)}, {formatCoordinate(userLocation.longitude)}
              </p>
            </div>

            {filteredProfessionals.length > 0 ? (
              <div className="space-y-4">
                {filteredProfessionals.map((professional) => (
                  <ProfessionalCard
                    areas={areas}
                    categories={categories}
                    key={professional.id}
                    professional={professional}
                    href={professionalRoute(professional.slug)}
                    isFavorite={isFavorite(professional.id)}
                    onToggleFavorite={toggleFavorite}
                    selectedAreaId={selectedAreaId}
                    services={services}
                    userLocation={userLocation}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                  <Search className="h-8 w-8" />
                </div>
                <p className="font-bold text-gray-900">{t('noResults')}</p>
                <p className="mt-1 text-sm text-gray-500">{t('tryAdjusting')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {isFilterModalOpen ? (
        <div className="absolute inset-0 z-50 flex items-end justify-center overflow-hidden">
          <button
            type="button"
            aria-label="Close filters"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsFilterModalOpen(false)}
          />

          <div className="relative z-10 flex max-h-[90vh] w-full max-w-md flex-col rounded-t-[32px] bg-white shadow-2xl animate-in slide-in-from-bottom-full duration-300">
            <div className="mx-auto mb-2 mt-4 h-1.5 w-12 rounded-full bg-gray-200" />

            <div className="flex items-center justify-between border-b border-gray-100 px-6 pb-4 pt-2">
              <h2 className="text-xl font-bold text-gray-900">
                {t('filterTitle', { professional: uiText.terms.professional })}
              </h2>
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all hover:bg-slate-200 active:scale-95"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
              <div className="space-y-4">
                <h3 className="text-[15px] font-bold text-gray-900">{t('locationSection')}</h3>

                <div className={`${insetSurfaceClass} p-4`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                        {t('nearestArea')}
                      </p>
                      <p className="mt-1 text-[14px] font-bold text-gray-900">{resolvedLocation.areaLabel}</p>
                    </div>
                    <span
                      className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
                      style={{ backgroundColor: APP_CONFIG.colors.primaryLight, color: APP_CONFIG.colors.primary }}
                    >
                      {t('locationPointOnly')}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-[12px] text-gray-500">
                    <div>
                      <p className="font-semibold text-gray-400">{t('city')}</p>
                      <p className="mt-1 font-medium text-gray-900">{resolvedLocation.city}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-400">{t('district')}</p>
                      <p className="mt-1 font-medium text-gray-900">{resolvedLocation.district}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-400">{t('province')}</p>
                      <p className="mt-1 font-medium text-gray-900">{resolvedLocation.province}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-400">{t('postalCode')}</p>
                      <p className="mt-1 font-medium text-gray-900">{resolvedLocation.postalCode}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="font-semibold text-gray-400">{t('country')}</p>
                      <p className="mt-1 font-medium text-gray-900">{resolvedLocation.country}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="font-semibold text-gray-400">{t('formattedAddress')}</p>
                      <p className="mt-1 font-medium text-gray-900">{resolvedLocation.formattedAddress}</p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={detectCurrentLocation}
                  disabled={isDetectingLocation || isResolvingLocation}
                  className="flex w-full items-center justify-center rounded-[18px] bg-blue-600 px-4 py-3 text-[14px] font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isDetectingLocation || isResolvingLocation ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <MapPin className="mr-2 h-4 w-4" />
                  )}
                  {t('useCurrentLocation')}
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-2">
                    <span className="text-[12px] font-semibold text-gray-500">{t('latitude')}</span>
                    <input
                      type="number"
                      step="any"
                      value={latitudeInput}
                      onChange={(event) => setLatitudeInput(event.target.value)}
                      className={mutedInputClass}
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-[12px] font-semibold text-gray-500">{t('longitude')}</span>
                    <input
                      type="number"
                      step="any"
                      value={longitudeInput}
                      onChange={(event) => setLongitudeInput(event.target.value)}
                      className={mutedInputClass}
                    />
                  </label>
                </div>

                <p className="text-[12px] leading-relaxed text-gray-500">{t('locationPointHint')}</p>
                <p className="text-[12px] leading-relaxed text-gray-400">{t('locationModelHint')}</p>
                {locationError ? <p className="text-[12px] font-medium text-red-500">{locationError}</p> : null}
              </div>

              <div className="space-y-4">
                <h3 className="text-[15px] font-bold text-gray-900">{t('categorySection')}</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveCategoryId('all')}
                    className={filterChipClass(activeCategoryId === 'all')}
                  >
                    {t('allCategories')}
                  </button>
                  {categories.map((category) => (
                    <button
                      type="button"
                      key={category.id}
                      onClick={() => setActiveCategoryId(category.id)}
                      className={filterChipClass(activeCategoryId === category.id)}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[15px] font-bold text-gray-900">{t('availabilitySection')}</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveFilter('all')}
                    className={filterChipClass(activeFilter === 'all')}
                  >
                    {t('allExperts')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('top_rated')}
                    className={filterChipClass(activeFilter === 'top_rated')}
                  >
                    <Star className="mr-2 inline h-4 w-4" /> {t('topRated')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('available')}
                    className={filterChipClass(activeFilter === 'available')}
                  >
                    <Clock className="mr-2 inline h-4 w-4" /> {t('availableToday')}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[15px] font-bold text-gray-900">{t('genderPreference')}</h3>
                <div className="flex gap-3">
                  {genderOptions.map((genderOption) => {
                    const isSelected = genderOption.key === selectedGender;

                    return (
                      <button
                        type="button"
                        key={genderOption.key}
                        onClick={() => setSelectedGender(genderOption.key)}
                        className={`flex-1 ${filterChipClass(isSelected)}`}
                      >
                        {genderOption.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[15px] font-bold text-gray-900">{t('favoritesSection')}</h3>
                <button
                  type="button"
                  onClick={() => setFavoritesOnly((current) => !current)}
                  className={`flex w-full items-center justify-between px-4 py-4 text-left transition-all ${filterChipClass(favoritesOnly)}`}
                >
                  <span className="flex items-center text-[14px] font-semibold">
                    <Heart className={`mr-2 h-4 w-4 ${favoritesOnly ? 'fill-current' : ''}`} />
                    {t('myFavorites')}
                  </span>
                  <span className="text-[12px] font-medium text-slate-500">{favoriteProfessionalIds.length}</span>
                </button>
              </div>
            </div>

            <div className="flex gap-3 rounded-b-[32px] border-t border-gray-100 bg-white p-6">
              <button
                type="button"
                onClick={async () => {
                  await resetFilters();
                  setIsFilterModalOpen(false);
                }}
                disabled={isResolvingLocation}
                className="w-1/3 rounded-full bg-slate-100 px-6 py-4 font-bold text-slate-600 transition-all hover:bg-slate-200 active:scale-95"
              >
                {t('reset')}
              </button>
              <button
                type="button"
                onClick={async () => {
                  const isApplied = await applyPointLocation();

                  if (!isApplied) {
                    return;
                  }

                  setIsFilterModalOpen(false);
                }}
                disabled={isResolvingLocation}
                className="flex-1 rounded-full bg-blue-600 py-4 text-center font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:opacity-90 active:scale-95"
              >
                {isResolvingLocation ? t('resolvingLocation') : t('applyFilters')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export const ExploreScreen = ({
  areas,
  categories,
  professionals,
  services,
  userContext,
}: {
  areas: Area[];
  categories: Category[];
  professionals: Professional[];
  services: GlobalService[];
  userContext: UserContext;
}) => {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      }
    >
      <ExploreContent
        areas={areas}
        categories={categories}
        professionals={professionals}
        services={services}
        userContext={userContext}
      />
    </Suspense>
  );
};
