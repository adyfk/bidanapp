'use client';
import React from 'react';
import { MapPin, Bell, Calendar, Clock, Navigation, MessageSquare, Stethoscope, Heart, Brain, Baby } from 'lucide-react';
import { COLORS, DOCTORS_NEARBY, DOCTOR_DATA } from '@/lib/constants';
import { IconButton } from '@/components/ui/IconButton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { DoctorCard } from '@/components/ui/DoctorCard';

export const HomeScreen = () => (
  <div className="flex flex-col h-full bg-[#F9FAFB] relative pb-24 overflow-y-auto custom-scrollbar">
    {/* Header */}
    <div className="flex items-center justify-between px-6 pt-14 pb-6 bg-[#F9FAFB] sticky top-0 z-20">
      <div className="w-11 h-11 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm">
        <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop" alt="User" className="w-full h-full object-cover" />
      </div>
      <div className="flex flex-col items-center">
        <span className="text-[11px] text-gray-400 font-medium tracking-wide">Location</span>
        <div className="flex items-center text-gray-900 font-bold text-[14px]">
          <MapPin className="w-4 h-4 mr-1" style={{ color: COLORS.primary }} />
          Canada, Ontario
        </div>
      </div>
      <div className="relative">
        <IconButton icon={<Bell className="w-6 h-6 text-gray-800" />} />
        <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-[#FF4B4B] rounded-full border-2 border-[#F9FAFB]"></span>
      </div>
    </div>

    <div className="px-6 space-y-7">
      {/* Section: Appointment */}
      <div>
        <SectionHeader title="Appointment" onSeeAll={() => {}} />
        <div
          className="rounded-[28px] p-5 text-white relative shadow-[0_10px_30px_rgba(123,97,255,0.25)]"
          style={{ background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryLight} 100%)` }}
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
            <button className="bg-white text-[#7B61FF] p-2.5 rounded-full shadow-md hover:scale-105 transition-transform">
              <Navigation className="w-4 h-4 rotate-45" />
            </button>
          </div>

          <div className="bg-white rounded-[20px] p-3 flex justify-between items-center text-gray-800 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                <img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=150&auto=format&fit=crop" alt="Dr. Reneva Roy" className="w-full h-full object-cover object-top" />
              </div>
              <div>
                <h3 className="font-bold text-[14px]">Dr. Reneva Roy</h3>
                <p className="text-[11px] text-gray-500 font-medium mt-0.5">Child Specialist</p>
              </div>
            </div>
            <button className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 border border-gray-100">
              <MessageSquare className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Indikator Paginasi */}
        <div className="flex justify-center gap-1.5 mt-4">
          <div className="w-4 h-1.5 rounded-full" style={{ backgroundColor: COLORS.primary }}></div>
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
        </div>
      </div>

      {/* Section: Doctor Speciality */}
      <div>
        <SectionHeader title="Doctor Speciality" onSeeAll={() => {}} />
        <div className="flex justify-between items-start">
          {[
            { icon: <Stethoscope />, label: 'General' },
            { icon: <Heart />, label: 'Cardiologist' },
            { icon: <Brain />, label: 'Neurologist' },
            { icon: <Baby />, label: 'Pediatrician' },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-3 cursor-pointer group w-1/4">
              <div className="w-[60px] h-[60px] rounded-[20px] bg-white shadow-sm border border-gray-50 flex items-center justify-center group-hover:scale-105 transition-all text-[#7B61FF]">
                {React.cloneElement(item.icon as React.ReactElement<any>, { className: 'w-7 h-7 stroke-[1.5]' })}
              </div>
              <span className="text-[11px] text-gray-400 font-medium group-hover:text-[#7B61FF] transition-colors">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Section: Doctor Near You */}
      <div className="pb-4">
        <SectionHeader title="Doctor near you" onSeeAll={() => {}} />
        <div className="space-y-4">
          {DOCTORS_NEARBY.map((doc) => (
            <DoctorCard key={doc.id} doctor={doc} href={`/doctor/${doc.id}`} />
          ))}
          {/* Duplicate card for visual fullness to match scrollability */}
          <DoctorCard
            doctor={{ ...DOCTORS_NEARBY[0], name: 'Dr. Omeya Sen', specialty: 'Heart Specialist', image: DOCTOR_DATA.image }}
            href="/doctor/1"
          />
        </div>
      </div>
    </div>
  </div>
);
