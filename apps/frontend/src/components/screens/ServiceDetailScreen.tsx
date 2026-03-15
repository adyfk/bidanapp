'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { ChevronLeft, Clock, Heart, Share2, MapPin } from 'lucide-react';
import { APP_CONFIG } from '@/lib/config';
import {
  MOCK_PROFESSIONALS,
  MOCK_CATEGORIES,
  MOCK_SERVICES,
  SIMULATION_MEDIA,
  SIMULATION_MESSAGES,
  getBookingMessage,
} from '@/lib/constants';
import { professionalRoute } from '@/lib/routes';
import { IconButton } from '@/components/ui/IconButton';

export const ServiceDetailScreen = ({ serviceId }: { serviceId: string }) => {
  const router = useRouter();
  const t = useTranslations('ServiceDetail');
  
  const service = MOCK_SERVICES.find(s => s.id === serviceId);
  if (!service) return null;

  const categoryName = MOCK_CATEGORIES.find(c => c.id === service.categoryId)?.name || '';

  // Get all professionals who offer this service
  const providers = MOCK_PROFESSIONALS.filter(prof => 
    prof.services.some(ps => ps.serviceId === service.id)
  ).map(prof => {
    const serviceMapping = prof.services.find(ps => ps.serviceId === service.id);
    return {
      ...prof,
      providedServiceDuration: serviceMapping?.duration,
      providedServicePrice: serviceMapping?.price
    };
  });

  return (
    <div className="flex flex-col h-full relative pb-10 overflow-y-auto custom-scrollbar" style={{ backgroundColor: APP_CONFIG.colors.bgLight }}>
      
      {/* Visual Header / Cover */}
      <div className="relative h-64 w-full bg-gray-200">
        <Image 
          src={service.coverImage || SIMULATION_MEDIA.serviceDetailCoverImage}
          alt={service.name} 
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
        
        {/* Top Navbar overlapping image */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-14 pb-4 z-20">
          <IconButton 
            icon={<ChevronLeft className="w-6 h-6 text-gray-800" />} 
            onClick={() => router.back()} 
            className="bg-white/90 backdrop-blur-sm"
          />
          <div className="flex gap-2">
             <IconButton icon={<Share2 className="w-5 h-5 text-gray-800" />} className="bg-white/90 backdrop-blur-sm" />
             <IconButton icon={<Heart className="w-5 h-5 text-gray-800" />} className="bg-white/90 backdrop-blur-sm" />
          </div>
        </div>

        {/* Title Info over image */}
        <div className="absolute bottom-6 left-6 right-6 z-10 text-white text-shadow-sm">
          <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[11px] font-bold tracking-wide uppercase mb-2 border border-white/30">
            {service.badge || categoryName}
          </div>
          <h1 className="text-3xl font-bold leading-tight mb-2">{service.name}</h1>
          <p className="text-sm text-white/80 max-w-xl">{service.shortDescription}</p>
        </div>
      </div>

      <div className="px-6 py-6 space-y-8">
        {/* Description Section */}
        <div>
          <h2 className="text-[18px] font-bold text-gray-900 mb-3">{t('about', { service: APP_CONFIG.terms.service })}</h2>
          <p className="text-gray-600 text-[14px] leading-relaxed">
            {service.description}
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {service.tags.map((tag) => (
              <span key={tag} className="px-3 py-1 rounded-full bg-gray-50 text-gray-500 text-[11px] font-semibold border border-gray-100">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-[18px] font-bold text-gray-900 mb-3">{SIMULATION_MESSAGES.serviceHighlightsTitle}</h2>
          <div className="space-y-2">
            {service.highlights.map((highlight) => (
              <div key={highlight} className="bg-white rounded-[18px] border border-gray-100 px-4 py-3 text-[13px] text-gray-600 shadow-sm">
                {highlight}
              </div>
            ))}
          </div>
        </div>

        {/* Providers Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-[18px] font-bold text-gray-900">{t('available', { professional: APP_CONFIG.terms.professional })}</h2>
             <span className="text-[13px] font-medium px-3 py-1 bg-gray-100 text-gray-600 rounded-full">
               {t('expertsCount', { count: providers.length })}
             </span>
          </div>
          
          <div className="space-y-4">
            {providers.map((prof) => (
              <div 
                key={prof.id}
                onClick={() => router.push(professionalRoute(prof.slug))}
                className="bg-white rounded-[24px] p-4 flex flex-col gap-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
              >
                {/* Embedded Professional Card-like info */}
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-[16px] overflow-hidden flex-shrink-0 relative bg-gray-100">
                    <Image src={prof.image} alt={prof.name} fill className="object-cover object-top" />
                    <div className="absolute top-1 left-1 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded-lg flex items-center shadow-sm">
                      <Heart className="w-2.5 h-2.5 text-red-500 fill-red-500 mr-1" />
                      <span className="text-[10px] font-bold text-gray-800">{prof.rating}</span>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h3 className="font-bold text-[15px] text-gray-900 mb-1">{prof.name}</h3>
                    <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: APP_CONFIG.colors.primary }}>
                      {prof.badgeLabel}
                    </p>
                    <p className="text-[12px] font-medium text-gray-500 flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1" /> {prof.location}
                    </p>
                    <p className="text-[12px] text-gray-400 mt-1">{prof.availabilityLabel}</p>
                  </div>
                </div>
                
                {/* Specific Service Details for this Provider */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                   <div className="flex items-center text-[13px] text-gray-600 font-medium">
                     <Clock className="w-4 h-4 mr-1.5 text-gray-400" /> {prof.providedServiceDuration}
                   </div>
                   <div className="font-bold text-[15px]" style={{ color: APP_CONFIG.colors.primary }}>
                     {prof.providedServicePrice}
                   </div>
                 </div>
                 
                 {/* Action Buttons for Provider */}
                 <div className="flex gap-2 pt-1 mt-1">
                   <button 
                     className="w-full py-2.5 rounded-[12px] text-white font-bold text-[13px] shadow-sm hover:opacity-90 transition-opacity"
                     style={{ backgroundColor: APP_CONFIG.colors.primary }}
                     onClick={(e) => {
                       e.stopPropagation();
                       alert(getBookingMessage(service.type));
                     }}
                   >
                     {t('makeAppointment')}
                   </button>
                 </div>
              </div>
            ))}
            
            {providers.length === 0 && (
              <p className="text-gray-500 text-sm py-4 text-center">{t('noProfessionals')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
