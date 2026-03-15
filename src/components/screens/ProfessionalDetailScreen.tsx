'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Share2, Heart, User, Star, Navigation, MessageSquare } from 'lucide-react';
import { APP_CONFIG } from '@/lib/config';
import { MOCK_PROFESSIONALS, MOCK_CATEGORIES, MOCK_SERVICES } from '@/lib/constants';
import { IconButton } from '@/components/ui/IconButton';
import { ServiceOption } from '@/components/ui/ServiceOption';

export const ProfessionalDetailScreen = () => {
  const professional = MOCK_PROFESSIONALS[0];
  const [selectedService, setSelectedService] = useState<string>(
    professional.services && professional.services.length > 0 ? professional.services[0].serviceId : ''
  );
  
  const profCategory = MOCK_CATEGORIES.find(c => c.id === professional.categoryId)?.name || 'Professional';

  return (
    <div className="flex flex-col h-full relative overflow-y-auto custom-scrollbar" style={{ backgroundColor: APP_CONFIG.colors.bgLight }}>
      {/* Header Background */}
      <div className="absolute top-0 left-0 w-full h-[280px] z-0" style={{ backgroundColor: APP_CONFIG.colors.primary }}></div>

      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-6 pt-14 pb-4 text-white relative z-10">
        <Link href="/home" className="flex items-center font-bold text-[18px] tracking-wider hover:opacity-80 transition-opacity">
          {APP_CONFIG.appName}
        </Link>
        <div className="flex items-center gap-1">
          <IconButton icon={<Share2 className="w-5 h-5" />} className="text-white hover:bg-white/10" />
          <IconButton icon={<Heart className="w-5 h-5" />} className="text-white hover:bg-white/10" />
        </div>
      </div>

      {/* Kartu Profil Dokter (Overlapping) */}
      <div className="px-6 relative z-10 mt-2">
        <div className="bg-white rounded-[24px] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
          <div className="flex gap-4 mb-6">
            <div className="w-[85px] h-[100px] rounded-[18px] overflow-hidden flex-shrink-0" style={{ backgroundColor: APP_CONFIG.colors.primaryLight }}>
              <img src={professional.image} alt={professional.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <h2 className="text-[18px] font-bold text-gray-900 mb-1">{professional.name}</h2>
              <p className="text-[13px] font-semibold mb-1" style={{ color: APP_CONFIG.colors.primary }}>
                {profCategory} <span className="text-gray-400 font-normal">- {professional.location}</span>
              </p>
            </div>
          </div>

          {/* Statistik Detail */}
          <div className="flex justify-between items-center pt-4 px-2">
            <div className="flex flex-col items-center">
              <div className="flex items-center text-gray-900 font-bold mb-1.5 text-[15px]">
                <User className="w-4 h-4 mr-1.5" style={{ color: APP_CONFIG.colors.primary }} /> {professional.experience}
              </div>
              <span className="text-[11px] text-gray-400 font-medium">{APP_CONFIG.terms.experience}</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center text-gray-900 font-bold mb-1.5 text-[15px]">
                <User className="w-4 h-4 mr-1.5" style={{ color: APP_CONFIG.colors.primary }} /> {professional.clientsServed}
              </div>
              <span className="text-[11px] text-gray-400 font-medium">{APP_CONFIG.terms.patients}</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center text-gray-900 font-bold mb-1.5 text-[15px]">
                <Star className="w-4 h-4 mr-1.5 fill-current" style={{ color: APP_CONFIG.colors.warning }} /> {professional.rating.toFixed(1)}
              </div>
              <span className="text-[11px] text-gray-400 font-medium">Rating</span>
            </div>
          </div>
        </div>
      </div>

      {/* Konten Scrollable Bawah */}
      <div className="px-6 mt-6">
        {/* Bagian Peta & Lokasi */}
        <div className="mb-6">
          <div className="h-[180px] bg-gray-100 rounded-[24px] mb-4 relative overflow-hidden bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=600&auto=format&fit=crop')] bg-cover bg-center shadow-sm">
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px]"></div>

            {/* Simulasi SVG Rute Peta (Persis seperti Referensi) */}
            <svg className="absolute inset-0 w-full h-full drop-shadow-md" style={{ zIndex: 1 }}>
              <path d="M 60,110 L 100,60 L 120,80 L 150,50 C 180,50 180,90 200,90 L 250,130" fill="none" stroke={APP_CONFIG.colors.primary} strokeWidth="3" />
              <circle cx="60" cy="110" r="5" fill={APP_CONFIG.colors.primary} className="shadow-lg" />
              <circle cx="250" cy="130" r="5" fill={APP_CONFIG.colors.danger} />
              <circle cx="250" cy="130" r="12" fill={APP_CONFIG.colors.danger} opacity="0.2" className="animate-pulse" />
            </svg>
          </div>

          <div className="flex justify-between items-end mb-4 text-sm px-2">
            <div className="flex gap-8">
              <div>
                <span className="text-gray-400 block text-[11px] mb-1">Distance</span>
                <span className="font-bold text-gray-900">5.23 km</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[11px] mb-1">Time</span>
                <span className="font-bold text-gray-900">8 min</span>
              </div>
            </div>
            <button className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-50 shadow-sm">
              <Navigation className="w-4 h-4 rotate-45" style={{ color: APP_CONFIG.colors.primary }} />
            </button>
          </div>

          <div className="px-2">
            <p className="font-bold text-gray-900 text-[14px]">42 Ontario, Newbridge NSW 822</p>
            <p className="text-gray-500 text-[12px] mt-1">Duo Place, New Mall M83</p>
          </div>
        </div>

        {/* Bagian About */}
        <div className="pb-32 px-2">
          <h3 className="font-bold text-[17px] text-gray-900 mb-2">About {APP_CONFIG.terms.professional}</h3>
          <p className="text-[13px] text-gray-500 leading-relaxed font-medium">
            {professional.about}
          </p>
        </div>
      </div>

      {/* Panel Bawah Tetap (Make Appointment) */}
      <div className="absolute bottom-0 left-0 w-full bg-white rounded-t-[32px] p-6 pt-5 shadow-[0_-15px_40px_rgba(0,0,0,0.06)] z-30">
        <div className="flex gap-3 mb-5 overflow-x-auto pb-2 custom-scrollbar">
          {professional.services.map((svcMapping) => {
            const globalService = MOCK_SERVICES.find(s => s.id === svcMapping.serviceId);
            if (!globalService) return null;
            
            return (
              <ServiceOption 
                key={svcMapping.serviceId}
                title={globalService.name} 
                price={svcMapping.price} 
                active={selectedService === svcMapping.serviceId} 
                onClick={() => setSelectedService(svcMapping.serviceId)} 
              />
            );
          })}
        </div>

        <div className="flex gap-3">
          <button
            className="flex-1 text-white font-bold py-4 rounded-full transition-transform active:scale-[0.98] shadow-[0_8px_20px_rgba(123,97,255,0.3)] text-[15px]"
            style={{ backgroundColor: APP_CONFIG.colors.primary }}
          >
            Make Appointment
          </button>
          <button className="w-[56px] h-[56px] border-[1.5px] border-gray-200 rounded-[20px] flex items-center justify-center hover:bg-gray-50 transition-colors active:scale-95 text-gray-600">
            <MessageSquare className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
