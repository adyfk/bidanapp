'use client';

import { Clock, Loader2, MapPin, Search, SlidersHorizontal, Star, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Suspense, useState } from 'react';
import { ProfessionalCard } from '@/components/ui/ProfessionalCard';
import { APP_CONFIG } from '@/lib/config';
import { getProfessionalCategoryLabel, MOCK_PROFESSIONALS } from '@/lib/mock-db/catalog';
import { ACTIVE_USER_CONTEXT } from '@/lib/mock-db/runtime';
import { professionalRoute } from '@/lib/routes';
import { useUiText } from '@/lib/ui-text';

// Extract the core component into a separate function to wrap it with Suspense
const ExploreContent = () => {
  const searchParams = useSearchParams();
  const searchParam = searchParams.get('q');
  const initialSearch = searchParam ? decodeURIComponent(searchParam) : '';
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const t = useTranslations('Explore');
  const uiText = useUiText();

  // Filter professionals based on search query and active filter
  const filteredProfessionals = MOCK_PROFESSIONALS.filter((prof) => {
    const categoryName = getProfessionalCategoryLabel(prof).toLowerCase();
    const query = searchQuery.toLowerCase();

    // Search match
    const matchesSearch =
      prof.name.toLowerCase().includes(query) ||
      categoryName.includes(query) ||
      prof.location.toLowerCase().includes(query);

    // Filter match
    let matchesFilter = true;
    if (activeFilter === 'top_rated') matchesFilter = prof.rating >= 4.8;
    if (activeFilter === 'available') matchesFilter = prof.availability.isAvailable;

    return matchesSearch && matchesFilter;
  });

  return (
    <>
      <div
        className="flex flex-col h-full relative pb-24 overflow-y-auto custom-scrollbar"
        style={{ backgroundColor: APP_CONFIG.colors.bgLight }}
      >
        {/* Header Sticky */}
        <div className="px-6 pt-14 pb-4 sticky top-0 z-20" style={{ backgroundColor: APP_CONFIG.colors.bgLight }}>
          <h1 className="text-[22px] font-bold text-gray-900 mb-1">
            {t('title', { professional: uiText.terms.professional })}
          </h1>
          <div className="flex items-center text-sm font-medium" style={{ color: APP_CONFIG.colors.textMuted }}>
            <MapPin className="w-4 h-4 mr-1" style={{ color: APP_CONFIG.colors.primary }} />
            {ACTIVE_USER_CONTEXT.currentArea} <span className="ml-2 text-xs opacity-70">({t('yourLocation')})</span>
          </div>
        </div>

        <div className="px-6 space-y-6">
          {/* Professional Search Bar */}
          <div className="flex gap-3">
            <div className="flex-1 bg-white rounded-full flex items-center px-4 py-3 shadow-sm border border-gray-100 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all">
              <Search className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder={t('searchPlaceholder', { professional: uiText.terms.professional.toLowerCase() })}
                className="bg-transparent border-none outline-none text-sm w-full text-gray-700 placeholder:text-gray-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={() => setIsFilterModalOpen(true)}
              className="w-12 h-12 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-transform"
              style={{ color: APP_CONFIG.colors.primary }}
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar -mx-6 px-6">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
                activeFilter === 'all'
                  ? 'text-white border-transparent shadow-md'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
              style={{ backgroundColor: activeFilter === 'all' ? APP_CONFIG.colors.primary : undefined }}
            >
              {t('allExperts')}
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('top_rated')}
              className={`flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
                activeFilter === 'top_rated'
                  ? 'text-white border-transparent shadow-md'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
              style={{ backgroundColor: activeFilter === 'top_rated' ? APP_CONFIG.colors.primary : undefined }}
            >
              <Star className="w-4 h-4 mr-2" /> {t('topRated')}
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('available')}
              className={`flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
                activeFilter === 'available'
                  ? 'text-white border-transparent shadow-md'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
              style={{ backgroundColor: activeFilter === 'available' ? APP_CONFIG.colors.primary : undefined }}
            >
              <Clock className="w-4 h-4 mr-2" /> {t('availableToday')}
            </button>
          </div>

          {/* Professional List */}
          <div>
            <h2 className="text-[16px] font-bold text-gray-900 mb-4">
              {t('resultsFound', { count: filteredProfessionals.length })}
            </h2>

            {filteredProfessionals.length > 0 ? (
              <div className="space-y-4">
                {filteredProfessionals.map((prof) => (
                  <ProfessionalCard key={prof.id} professional={prof} href={professionalRoute(prof.slug)} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
                  <Search className="w-8 h-8" />
                </div>
                <p className="text-gray-900 font-bold">{t('noResults')}</p>
                <p className="text-sm text-gray-500 mt-1">{t('tryAdjusting')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Filter Modal Bottom Sheet */}
      {isFilterModalOpen && (
        <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center overflow-hidden">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close filters"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsFilterModalOpen(false)}
          ></button>

          {/* Sheet */}
          <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] relative z-10 flex flex-col max-h-[90vh] shadow-2xl animate-in slide-in-from-bottom-full duration-300">
            {/* Handle for mobile */}
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-4 mb-2 sm:hidden"></div>

            <div className="flex items-center justify-between px-6 pb-4 pt-2 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {t('filterTitle', { professional: uiText.terms.professional })}
              </h2>
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 active:scale-95 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-6 overflow-y-auto space-y-8 flex-1">
              {/* Sort By Section */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 text-[15px]">{t('sortBy')}</h3>
                <div className="space-y-3">
                  {uiText.exploreSortOptions.map((sortType) => (
                    <button key={sortType} type="button" className="flex w-full items-center justify-between group">
                      <span className="text-[14px] text-gray-700 font-medium group-hover:text-gray-900">
                        {sortType}
                      </span>
                      <div className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center">
                        {sortType === uiText.exploreSortOptions[0] && (
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: APP_CONFIG.colors.primary }}
                          ></div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Gender Preference */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 text-[15px]">{t('genderPreference')}</h3>
                <div className="flex gap-3">
                  {uiText.exploreGenderOptions.map((gender) => (
                    <button
                      type="button"
                      key={gender}
                      className={`flex-1 py-3 rounded-xl text-[13px] font-bold border transition-all ${
                        gender === uiText.exploreGenderOptions[0]
                          ? 'bg-gray-50 border-gray-200 text-gray-900'
                          : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                      style={
                        gender === uiText.exploreGenderOptions[0]
                          ? {
                              borderColor: APP_CONFIG.colors.primary,
                              color: APP_CONFIG.colors.primary,
                              backgroundColor: APP_CONFIG.colors.primaryLight,
                            }
                          : {}
                      }
                    >
                      {gender}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-white rounded-b-[32px] flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveFilter('all');
                  setIsFilterModalOpen(false);
                }}
                className="px-6 py-4 rounded-full font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all w-1/3"
              >
                {t('reset')}
              </button>
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="flex-1 py-4 rounded-full font-bold text-white shadow-lg shadow-pink-500/30 hover:opacity-90 active:scale-95 transition-all text-center"
                style={{
                  background: `linear-gradient(to right, ${APP_CONFIG.colors.primary}, ${APP_CONFIG.colors.secondary})`,
                }}
              >
                {t('applyFilters')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const ExploreScreen = () => {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
};
