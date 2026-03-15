'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Search, ChevronRight, Clock, Tag } from 'lucide-react';
import { APP_CONFIG } from '@/lib/config';
import { MOCK_PROFESSIONALS, MOCK_CATEGORIES, MOCK_SERVICES } from '@/lib/constants';
import { IconButton } from '@/components/ui/IconButton';

export const ServicesScreen = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // Helper functions for ranges
  const parseDuration = (d?: string) => {
    if (!d) return 0;
    const val = parseInt(d);
    return d.includes('hr') ? val * 60 : val;
  };

  const formatDurationRange = (durations: (string | undefined)[]) => {
    const valid = durations.filter(Boolean) as string[];
    if (valid.length === 0) return '';
    const sorted = [...new Set(valid)].sort((a, b) => parseDuration(a) - parseDuration(b));
    if (sorted.length === 1) return sorted[0];
    return `${sorted[0]} - ${sorted[sorted.length - 1]}`;
  };

  const parsePrice = (p?: string) => {
    if (!p) return 0;
    return parseInt(p.replace(/\D/g, ''));
  };

  const formatPriceRange = (prices: (string | undefined)[]) => {
    const valid = prices.filter(Boolean) as string[];
    if (valid.length === 0) return '';
    const sorted = [...new Set(valid)].sort((a, b) => parsePrice(a) - parsePrice(b));
    if (sorted.length === 1) return sorted[0];
    return `${sorted[0]} - ${sorted[sorted.length - 1]}`;
  };

  // Lógica per Service global yang menampung daftar profesional penjual
  const enrichedServices = MOCK_SERVICES.map(svc => {
    const categoryName = MOCK_CATEGORIES.find(c => c.id === svc.categoryId)?.name || '';
    
    // Cari semua profesional yang menyediakan layanan ini
    const providers = MOCK_PROFESSIONALS.filter(prof => 
      prof.services.some(ps => ps.serviceId === svc.id)
    ).map(prof => {
      const pSvc = prof.services.find(ps => ps.serviceId === svc.id);
      return {
        name: prof.name,
        slug: prof.slug,
        image: prof.image,
        price: pSvc?.price,
        duration: pSvc?.duration
      };
    });
    
    return {
      ...svc,
      categoryName,
      providers
    };
  });

  const filteredServices = enrichedServices.filter(svc => {
    const matchesSearch = svc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          svc.categoryName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || svc.categoryId === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col h-full relative pb-24 overflow-y-auto custom-scrollbar" style={{ backgroundColor: APP_CONFIG.colors.bgLight }}>
      
      {/* Top Navigation */}
      <div className="flex items-center justify-between px-4 pt-14 pb-4 bg-white sticky top-0 z-20 shadow-sm">
        <IconButton icon={<ChevronLeft className="w-6 h-6 text-gray-800" />} onClick={() => router.back()} />
        <h1 className="text-[16px] font-bold text-gray-900 tracking-wide">Global {APP_CONFIG.terms.service}s</h1>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      <div className="px-6 py-6 space-y-7">
        
        {/* Search Bar */}
        <div className="bg-white rounded-full flex items-center px-4 py-3 shadow-sm border border-gray-100">
          <Search className="w-5 h-5 text-gray-400 mr-2" />
          <input 
            type="text" 
            placeholder={`Search ${APP_CONFIG.terms.service.toLowerCase()}...`}
            className="bg-transparent border-none outline-none text-sm w-full text-gray-700 placeholder:text-gray-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Filters */}
        <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar -mx-6 px-6">
          <button 
            onClick={() => setActiveCategory('All')}
            className={`flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
              activeCategory === 'All' 
                ? 'border-transparent text-white shadow-md' 
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
            style={{ backgroundColor: activeCategory === 'All' ? APP_CONFIG.colors.primary : undefined }}
          >
            All Services
          </button>
          {MOCK_CATEGORIES.map((cat) => (
            <button 
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
                activeCategory === cat.id 
                  ? 'border-transparent text-white shadow-md' 
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
              style={{ backgroundColor: activeCategory === cat.id ? APP_CONFIG.colors.primary : undefined }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Global Catalog List */}
        <div>
          <h2 className="text-[16px] font-bold text-gray-900 mb-4">
            {filteredServices.length} {filteredServices.length === 1 ? 'Service' : 'Services'} Catalog
          </h2>
          
          <div className="space-y-4">
            {filteredServices.map((svc) => (
              <div 
                key={svc.id}
                onClick={() => router.push(`/explore?category=${svc.categoryId}&q=${encodeURIComponent(svc.name)}`)}
                className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
              >
                <div className="flex justify-between items-start mb-2">
                   <div>
                     <h3 className="font-bold text-[16px] text-gray-900 mb-0.5">{svc.name}</h3>
                     <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: APP_CONFIG.colors.primary }}>
                       {svc.categoryName}
                     </p>
                   </div>
                   <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                     <ChevronRight className="w-4 h-4 text-gray-400" />
                   </div>
                </div>
                
                <p className="text-[13px] text-gray-600 mb-4 line-clamp-2">
                   {svc.description}
                </p>
                
                <div className="pt-3 border-t border-gray-50 flex items-center gap-4 text-[13px] text-gray-600 font-medium">
                   <div className="flex items-center">
                     <Clock className="w-4 h-4 mr-1.5 text-gray-400" />
                     {formatDurationRange(svc.providers.map(p => p.duration))}
                   </div>
                   <div className="flex items-center font-bold" style={{ color: APP_CONFIG.colors.primary }}>
                     <Tag className="w-4 h-4 mr-1.5 opacity-50" />
                     {formatPriceRange(svc.providers.map(p => p.price))}
                   </div>
                </div>
              </div>
            ))}
            
            {filteredServices.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
                  <Search className="w-8 h-8" />
                </div>
                <p className="text-gray-900 font-bold">No services found</p>
                <p className="text-sm text-gray-500 mt-1">Try another search term.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
