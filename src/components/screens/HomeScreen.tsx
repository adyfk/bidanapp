'use client';
import React from 'react';
import { MapPin, Bell, Calendar, Clock, Navigation, MessageSquare, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { Link, useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { APP_CONFIG } from '@/lib/config';
import { MOCK_CATEGORIES, SIMULATION_APP_SECTIONS, SIMULATION_HOME, SIMULATION_MESSAGES } from '@/lib/constants';
import { Search } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ProfessionalCard } from '@/components/ui/ProfessionalCard';

export const HomeScreen = () => {
  const router = useRouter();
  const t = useTranslations('Home');
  const featuredProfessional = SIMULATION_HOME.featuredAppointment?.professional;
  const homeCategories = (
    SIMULATION_APP_SECTIONS.homeCategoryIds?.length
      ? SIMULATION_APP_SECTIONS.homeCategoryIds
          .map((categoryId) => MOCK_CATEGORIES.find((category) => category.id === categoryId))
          .filter(Boolean)
      : MOCK_CATEGORIES
  ) as typeof MOCK_CATEGORIES;

  return (
  <div className="flex flex-col h-full relative pb-24 overflow-y-auto custom-scrollbar" style={{ backgroundColor: APP_CONFIG.colors.bgLight }}>
    {/* Header */}
    <div className="flex items-center justify-between px-6 pt-14 pb-6 sticky top-0 z-20" style={{ backgroundColor: APP_CONFIG.colors.bgLight }}>
      <button onClick={() => router.push('/profile')} className="w-11 h-11 relative rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm hover:opacity-80 transition-opacity active:scale-95">
        <Image src={SIMULATION_HOME.currentUser.avatar} alt={SIMULATION_HOME.currentUser.name} fill className="object-cover" />
      </button>
      <div className="flex flex-col items-center">
        <span className="text-[11px] text-gray-400 font-medium tracking-wide">{t('location')}</span>
        <div className="flex items-center text-gray-900 font-bold text-[14px]">
          <MapPin className="w-4 h-4 mr-1" style={{ color: APP_CONFIG.colors.primary }} />
          {SIMULATION_HOME.sharedContext.currentArea}
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
        <span className="text-sm text-gray-400 font-medium">{t('searchPlaceholder', { service: APP_CONFIG.terms.service.toLowerCase(), category: APP_CONFIG.terms.category.toLowerCase() })}</span>
      </Link>
    </div>

    <div className="px-6 space-y-7">
      {/* Section: Appointment */}
      <div>
        <SectionHeader title={t('appointment')} onSeeAll={() => router.push('/explore')} />
        {SIMULATION_HOME.featuredAppointment && featuredProfessional ? (
          <div
            className="rounded-[28px] p-5 text-white relative shadow-[0_10px_30px_rgba(233,30,140,0.25)]"
            style={{ background: `linear-gradient(135deg, ${APP_CONFIG.colors.primary} 0%, ${APP_CONFIG.colors.secondary} 100%)` }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="space-y-2.5">
                <div className="flex items-center text-[13px] font-medium bg-white/10 w-fit px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
                  <Calendar className="w-4 h-4 mr-2 opacity-80" />
                  {SIMULATION_HOME.featuredAppointment.dateLabel}
                </div>
                <div className="flex items-center text-[13px] ml-1 font-medium">
                  <Clock className="w-4 h-4 mr-2 opacity-80" />
                  {SIMULATION_HOME.featuredAppointment.timeLabel}
                </div>
              </div>
              <button className="bg-white p-2.5 rounded-full shadow-md hover:scale-105 transition-transform" style={{ color: APP_CONFIG.colors.primary }}>
                <Navigation className="w-4 h-4 rotate-45" />
              </button>
            </div>

            <div className="bg-white rounded-[20px] p-3 flex justify-between items-center text-gray-800 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 relative rounded-full overflow-hidden bg-gray-100">
                  <Image src={featuredProfessional.image} alt={featuredProfessional.name} fill className="object-cover object-top" />
                </div>
                <div>
                  <h3 className="font-bold text-[15px]">{featuredProfessional.name}</h3>
                  <p className="text-[12px] text-gray-500">{MOCK_CATEGORIES.find(cat => cat.id === featuredProfessional.categoryId)?.name}</p>
                </div>
              </div>
              <IconButton icon={<MessageSquare className="w-5 h-5" />} />
            </div>
          </div>
        ) : (
          <div className="rounded-[28px] p-6 bg-white border border-gray-100 shadow-sm">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: APP_CONFIG.colors.primaryLight, color: APP_CONFIG.colors.primary }}>
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-[18px] font-bold text-gray-900 mb-2">{SIMULATION_MESSAGES.homeEmptyStateTitle}</h3>
            <p className="text-[14px] text-gray-500 leading-relaxed mb-4">{SIMULATION_MESSAGES.homeEmptyStateDescription}</p>
            <button
              onClick={() => router.push('/services')}
              className="px-5 py-3 rounded-full text-white font-bold text-[14px]"
              style={{ backgroundColor: APP_CONFIG.colors.primary }}
            >
              {SIMULATION_MESSAGES.homeEmptyStateAction}
            </button>
          </div>
        )}
      </div>

      {/* Section: Popular Services */}
      <div>
        <SectionHeader title={t('popularServices', { service: APP_CONFIG.terms.service })} onSeeAll={() => router.push('/services')} />
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar -mx-6 px-6">
          {SIMULATION_HOME.popularServices.map((svc, idx) => {
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
                  <div className="w-12 h-12 rounded-[14px] overflow-hidden mb-4 border border-white/50 shadow-sm relative">
                    <Image src={svc.image} alt={svc.name} fill className="object-cover" />
                  </div>
                  <h4 className="font-bold text-[15px] text-gray-900 leading-tight mb-2 pr-2">{svc.name}</h4>
                  <p className="text-[12px] text-gray-500 line-clamp-2 mb-3">{svc.shortDescription}</p>
                  
                  <div className="mt-auto pt-2 flex items-center justify-between text-[12px] font-medium text-gray-500">
                    <span>{svc.badge || catName}</span>
                    <span className="flex items-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" style={{ color: APP_CONFIG.colors.primary }}>
                      {t('explore')} <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
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
        <SectionHeader title={APP_CONFIG.terms.category || t('categories')} onSeeAll={() => router.push('/explore')} />
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar -mx-6 px-6">
          {homeCategories.map((cat) => (
            <div key={cat.id} className="flex flex-col items-center gap-2 cursor-pointer group flex-shrink-0 w-[84px]" onClick={() => router.push(`/explore?category=${cat.id}`)}>
              <div className="w-[72px] h-[72px] rounded-[22px] shadow-sm overflow-hidden relative group-hover:scale-105 transition-all">
                <Image src={cat.iconImage || cat.image} alt={cat.name} fill className="object-cover" />
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute inset-x-0 bottom-0 px-2 py-1.5 text-white text-[11px] font-bold text-center leading-tight">
                  {cat.shortLabel}
                </div>
              </div>
              <span className="text-[11px] font-medium transition-colors text-center w-full leading-tight line-clamp-2" style={{ color: APP_CONFIG.colors.textMuted }}>{cat.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Section: Professionals Near You */}
      <div className="pb-4">
        <SectionHeader title={t('professionalsNearYou', { professional: APP_CONFIG.terms.professional })} onSeeAll={() => router.push('/explore')} />
        <div className="space-y-4">
          {SIMULATION_HOME.nearbyProfessionals.map((prof) => (
            <ProfessionalCard key={prof.id} professional={prof} href={`/p/${prof.slug}`} />
          ))}
        </div>
      </div>
    </div>
  </div>
  );
};
