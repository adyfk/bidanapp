'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Bell, Calendar, Clock, Navigation, MessageSquare, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { APP_CONFIG } from '@/lib/config';
import { MOCK_PROFESSIONALS, MOCK_CATEGORIES, MOCK_SERVICES } from '@/lib/constants';
import { Search } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ProfessionalCard } from '@/components/ui/ProfessionalCard';

export const HomeScreen = () => {
  const router = useRouter();

  return (
  <div className="flex flex-col h-full relative pb-24 overflow-y-auto custom-scrollbar" style={{ backgroundColor: APP_CONFIG.colors.bgLight }}>
    {/* Header */}
    <div className="flex items-center justify-between px-6 pt-14 pb-6 sticky top-0 z-20" style={{ backgroundColor: APP_CONFIG.colors.bgLight }}>
      <button onClick={() => router.push('/profile')} className="w-11 h-11 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm hover:opacity-80 transition-opacity active:scale-95">
        <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop" alt="User" className="w-full h-full object-cover" />
      </button>
      <div className="flex flex-col items-center">
        <span className="text-[11px] text-gray-400 font-medium tracking-wide">Location</span>
        <div className="flex items-center text-gray-900 font-bold text-[14px]">
          <MapPin className="w-4 h-4 mr-1" style={{ color: APP_CONFIG.colors.primary }} />
          Canada, Ontario
        </div>
      </div>
      <div className="relative">
        <IconButton icon={<Bell className="w-6 h-6 text-gray-800" />} />
        <span className="absolute top-2 right-2.5 w-2.5 h-2.5 rounded-full border-2" style={{ backgroundColor: APP_CONFIG.colors.danger, borderColor: APP_CONFIG.colors.bgLight }}></span>
      </div>
    </div>

    {/* Search Bar - Global Services Entry Point */}
    <div className="px-6 mb-7">
      <Link href="/services" className="bg-white rounded-full flex items-center px-4 py-3.5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <Search className="w-5 h-5 text-gray-400 mr-2" />
        <span className="text-sm text-gray-400 font-medium">Search {APP_CONFIG.terms.service.toLowerCase()} or {APP_CONFIG.terms.category.toLowerCase()}...</span>
      </Link>
    </div>

    <div className="px-6 space-y-7">
      {/* Section: Appointment */}
      <div>
        <SectionHeader title="Appointment" onSeeAll={() => router.push('/explore')} />
        <div
          className="rounded-[28px] p-5 text-white relative shadow-[0_10px_30px_rgba(233,30,140,0.25)]"
          style={{ background: `linear-gradient(135deg, ${APP_CONFIG.colors.primary} 0%, ${APP_CONFIG.colors.secondary} 100%)` }}
        >
          {/* Dekorasi Gelombang Background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="space-y-2.5">
              <div className="flex items-center text-[13px] font-medium bg-white/10 w-fit px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
                <Calendar className="w-4 h-4 mr-2 opacity-80" />
                Sunday, 28 February 2025
              </div>
              <div className="flex items-center text-[13px] ml-1 font-medium">
                <Clock className="w-4 h-4 mr-2 opacity-80" />
                09.00 - 10.00 AM
              </div>
            </div>
            <button className="bg-white p-2.5 rounded-full shadow-md hover:scale-105 transition-transform" style={{ color: APP_CONFIG.colors.primary }}>
              <Navigation className="w-4 h-4 rotate-45" />
            </button>
          </div>

          <div className="bg-white rounded-[20px] p-3 flex justify-between items-center text-gray-800 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                <img src={MOCK_PROFESSIONALS[0].image} alt={MOCK_PROFESSIONALS[0].name} className="w-full h-full object-cover object-top" />
              </div>
              <div>
                <h3 className="font-bold text-[15px]">{MOCK_PROFESSIONALS[0].name}</h3>
                <p className="text-[12px] text-gray-500">{MOCK_CATEGORIES.find(cat => cat.id === MOCK_PROFESSIONALS[0].categoryId)?.name}</p>
              </div>
            </div>
            <IconButton icon={<MessageSquare className="w-5 h-5" />} />
          </div>
        </div>
      </div>

      {/* Section: Popular Services */}
      <div>
        <SectionHeader title={`Popular ${APP_CONFIG.terms.service}s`} onSeeAll={() => router.push('/services')} />
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar -mx-6 px-6">
          {MOCK_SERVICES.slice(0, 4).map((svc, idx) => {
            const catName = MOCK_CATEGORIES.find(cat => cat.id === svc.categoryId)?.name || '';
            return (
              <div 
                key={idx} 
                className="relative overflow-hidden min-w-[200px] p-5 rounded-[24px] cursor-pointer group flex-shrink-0 border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all active:scale-[0.98]" 
                onClick={() => router.push(`/explore?category=${svc.categoryId}&q=${encodeURIComponent(svc.name)}`)}
                style={{ backgroundColor: APP_CONFIG.colors.bgLight }}
              >
                <div className="absolute inset-0 bg-white z-0"></div>
                {/* Decorative Background Element */}
                <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full opacity-[0.08] transition-transform duration-500 group-hover:scale-[1.5]" style={{ backgroundColor: APP_CONFIG.colors.primary }}></div>
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="w-11 h-11 rounded-[14px] flex items-center justify-center mb-4 border border-white/50 shadow-sm" style={{ backgroundColor: APP_CONFIG.colors.primaryLight, color: APP_CONFIG.colors.primary }}>
                     <Clock className="w-5 h-5 stroke-[2]" />
                  </div>
                  <h4 className="font-bold text-[15px] text-gray-900 leading-tight mb-2 pr-2">{svc.name}</h4>
                  
                  <div className="mt-auto pt-2 flex items-center justify-between text-[12px] font-medium text-gray-500">
                    <span>{catName}</span>
                    <span className="flex items-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" style={{ color: APP_CONFIG.colors.primary }}>
                      Explore <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section: Categories */}
      <div>
        <SectionHeader title={APP_CONFIG.terms.category} onSeeAll={() => router.push('/explore')} />
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar -mx-6 px-6">
          {MOCK_CATEGORIES.map((cat, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2 cursor-pointer group flex-shrink-0 w-[72px]" onClick={() => router.push('/explore')}>
              <div className="w-[60px] h-[60px] rounded-[20px] shadow-sm flex items-center justify-center group-hover:scale-105 transition-all text-[12px] font-bold text-center leading-tight px-1" style={{ backgroundColor: APP_CONFIG.colors.primaryLight, color: APP_CONFIG.colors.primaryDark }}>
                {cat.name.split(' ')[0]}
              </div>
              <span className="text-[11px] font-medium transition-colors text-center truncate w-full" style={{ color: APP_CONFIG.colors.textMuted }}>{cat.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Section: Professionals Near You */}
      <div className="pb-4">
        <SectionHeader title={`${APP_CONFIG.terms.professional} near you`} onSeeAll={() => router.push('/explore')} />
        <div className="space-y-4">
          {MOCK_PROFESSIONALS.map((prof) => (
            <ProfessionalCard key={prof.id} professional={prof} href={`/p/${prof.slug}`} />
          ))}
          {/* Duplicate card for visual fullness to match scrollability */}
          <ProfessionalCard
            professional={{ ...MOCK_PROFESSIONALS[0], id: '3', name: 'Dr. Jane Smith', categoryId: 'newborn' }}
            href={`/p/${MOCK_PROFESSIONALS[0].slug}`}
          />
        </div>
      </div>
    </div>
  </div>
  );
};
