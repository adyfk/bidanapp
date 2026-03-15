'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, MapPin, Loader2, SlidersHorizontal, Star, Clock } from 'lucide-react';
import { APP_CONFIG } from '@/lib/config';
import { MOCK_PROFESSIONALS, MOCK_CATEGORIES } from '@/lib/constants';
import { ProfessionalCard } from '@/components/ui/ProfessionalCard';

// Extract the core component into a separate function to wrap it with Suspense
const ExploreContent = () => {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('q') ? decodeURIComponent(searchParams.get('q')!) : '';
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Filter professionals based on search query and active filter
  const filteredProfessionals = MOCK_PROFESSIONALS.filter(prof => {
    const categoryName = MOCK_CATEGORIES.find(c => c.id === prof.categoryId)?.name || '';

    // Search match
    const matchesSearch = prof.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prof.location.toLowerCase().includes(searchQuery.toLowerCase());

    // Filter match
    let matchesFilter = true;
    if (activeFilter === 'top_rated') matchesFilter = prof.rating >= 4.8;
    if (activeFilter === 'available') matchesFilter = true; // Assuming all mock are available for now

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex flex-col h-full relative pb-24 overflow-y-auto custom-scrollbar" style={{ backgroundColor: APP_CONFIG.colors.bgLight }}>

      {/* Header Sticky */}
      <div className="px-6 pt-14 pb-4 sticky top-0 z-20" style={{ backgroundColor: APP_CONFIG.colors.bgLight }}>
        <h1 className="text-[22px] font-bold text-gray-900 mb-1">{APP_CONFIG.terms.professional}s</h1>
        <div className="flex items-center text-sm font-medium" style={{ color: APP_CONFIG.colors.textMuted }}>
          <MapPin className="w-4 h-4 mr-1" style={{ color: APP_CONFIG.colors.primary }} />
          Canada, Ontario <span className="ml-2 text-xs opacity-70">(Your Location)</span>
        </div>
      </div>

      <div className="px-6 space-y-6">

        {/* Professional Search Bar */}
        <div className="flex gap-3">
          <div className="flex-1 bg-white rounded-full flex items-center px-4 py-3 shadow-sm border border-gray-100 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all">
            <Search className="w-5 h-5 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder={`Find ${APP_CONFIG.terms.professional.toLowerCase()} by name or city...`}
              className="bg-transparent border-none outline-none text-sm w-full text-gray-700 placeholder:text-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="w-12 h-12 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-transform" style={{ color: APP_CONFIG.colors.primary }}>
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Filters */}
        <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar -mx-6 px-6">
          <button
            onClick={() => setActiveFilter('all')}
            className={`flex items-center px-4 py-2 rounded-full text-[13px] font-bold whitespace-nowrap transition-all border ${activeFilter === 'all' ? 'text-white border-transparent shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            style={{ backgroundColor: activeFilter === 'all' ? APP_CONFIG.colors.primary : undefined }}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter('top_rated')}
            className={`flex items-center px-4 py-2 rounded-full text-[13px] font-bold whitespace-nowrap transition-all border ${activeFilter === 'top_rated' ? 'text-white border-transparent shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            style={{ backgroundColor: activeFilter === 'top_rated' ? APP_CONFIG.colors.primary : undefined }}
          >
            <Star className="w-3.5 h-3.5 mr-1.5" /> Top Rated
          </button>
          <button
            onClick={() => setActiveFilter('available')}
            className={`flex items-center px-4 py-2 rounded-full text-[13px] font-bold whitespace-nowrap transition-all border ${activeFilter === 'available' ? 'text-white border-transparent shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            style={{ backgroundColor: activeFilter === 'available' ? APP_CONFIG.colors.primary : undefined }}
          >
            <Clock className="w-3.5 h-3.5 mr-1.5" /> Available Today
          </button>
        </div>

        {/* Professional List */}
        <div>
          <h2 className="text-[16px] font-bold text-gray-900 mb-4">
            {filteredProfessionals.length} {filteredProfessionals.length === 1 ? 'Result' : 'Results'} Found
          </h2>

          {filteredProfessionals.length > 0 ? (
            <div className="space-y-4">
              {filteredProfessionals.map((prof) => (
                <ProfessionalCard key={prof.id} professional={prof} href={`/p/${prof.slug}`} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
                <Search className="w-8 h-8" />
              </div>
              <p className="text-gray-900 font-bold">No results found</p>
              <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or search term.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const ExploreScreen = () => {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    }>
      <ExploreContent />
    </Suspense>
  );
};
