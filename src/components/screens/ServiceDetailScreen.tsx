'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Clock, Heart, Share2, MapPin } from 'lucide-react';
import { APP_CONFIG } from '@/lib/config';
import { MOCK_PROFESSIONALS, MOCK_CATEGORIES, MOCK_SERVICES } from '@/lib/constants';
import { IconButton } from '@/components/ui/IconButton';

export const ServiceDetailScreen = ({ serviceId }: { serviceId: string }) => {
  const router = useRouter();
  
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
        <img 
          src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=600&auto=format&fit=crop" 
          alt={service.name} 
          className="w-full h-full object-cover"
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
            {categoryName}
          </div>
          <h1 className="text-3xl font-bold leading-tight mb-2">{service.name}</h1>
        </div>
      </div>

      <div className="px-6 py-6 space-y-8">
        {/* Description Section */}
        <div>
          <h2 className="text-[18px] font-bold text-gray-900 mb-3">About this {APP_CONFIG.terms.service}</h2>
          <p className="text-gray-600 text-[14px] leading-relaxed">
            {service.description}
          </p>
        </div>

        {/* Providers Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-[18px] font-bold text-gray-900">Available {APP_CONFIG.terms.professional}s</h2>
             <span className="text-[13px] font-medium px-3 py-1 bg-gray-100 text-gray-600 rounded-full">
               {providers.length} {providers.length === 1 ? 'Expert' : 'Experts'}
             </span>
          </div>
          
          <div className="space-y-4">
            {providers.map((prof) => (
              <div 
                key={prof.id}
                onClick={() => router.push(`/p/${prof.slug}`)}
                className="bg-white rounded-[24px] p-4 flex flex-col gap-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
              >
                {/* Embedded Professional Card-like info */}
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-[16px] overflow-hidden flex-shrink-0 relative bg-gray-100">
                    <img src={prof.image} alt={prof.name} className="w-full h-full object-cover object-top" />
                    <div className="absolute top-1 left-1 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded-lg flex items-center shadow-sm">
                      <Heart className="w-2.5 h-2.5 text-red-500 fill-red-500 mr-1" />
                      <span className="text-[10px] font-bold text-gray-800">{prof.rating}</span>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h3 className="font-bold text-[15px] text-gray-900 mb-1">{prof.name}</h3>
                    <p className="text-[12px] font-medium text-gray-500 flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1" /> {prof.location}
                    </p>
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
              </div>
            ))}
            
            {providers.length === 0 && (
              <p className="text-gray-500 text-sm py-4 text-center">No professionals currently provide this service.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
