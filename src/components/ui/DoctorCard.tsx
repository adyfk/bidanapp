import React from 'react';
import Link from 'next/link';
import { Heart, Star } from 'lucide-react';
import { COLORS } from '@/lib/constants';
import { Doctor } from '@/types';

interface DoctorCardProps {
  doctor: Doctor;
  href: string;
}

export const DoctorCard = ({ doctor, href }: DoctorCardProps) => (
  <Link href={href} className="bg-white rounded-[24px] p-4 flex gap-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all active:scale-[0.98] block">
    <div className="w-[85px] h-[100px] bg-[#F5F5F5] rounded-[18px] overflow-hidden flex-shrink-0 relative">
      <img src={doctor.image} alt={doctor.name} className="w-full h-full object-cover object-top" />
    </div>
    <div className="flex-1 flex flex-col justify-center">
      <div className="flex justify-between items-start">
        <h3 className="font-bold text-[16px] text-gray-900 leading-tight">{doctor.name}</h3>
        <button className="text-[#7B61FF]" onClick={(e) => { e.preventDefault(); }}>
          <Heart className="w-5 h-5" />
        </button>
      </div>
      <p className="text-[13px] mt-1 mb-2 font-medium" style={{ color: COLORS.primary }}>
        {doctor.specialty} <span className="text-gray-400 font-normal">- {doctor.location}</span>
      </p>
      <div className="flex items-center gap-3 text-[12px] text-gray-500 font-medium">
        <div className="flex items-center text-[#FFB020]">
          <Star className="w-4 h-4 mr-1 fill-current" /> {doctor.rating.toFixed(1)}
        </div>
        <span>{doctor.experience}</span>
      </div>
    </div>
  </Link>
);
