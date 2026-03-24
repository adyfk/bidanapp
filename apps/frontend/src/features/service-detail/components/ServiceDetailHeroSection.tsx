'use client';

import { ChevronLeft, Heart, Share2 } from 'lucide-react';
import Image from 'next/image';
import { IconButton } from '@/components/ui/IconButton';
import { APP_MEDIA_PRESET } from '@/lib/app-media';
import type { GlobalService } from '@/types/catalog';

interface ServiceDetailHeroSectionProps {
  categoryName: string;
  onBack: () => void;
  service: GlobalService;
}

export const ServiceDetailHeroSection = ({ categoryName, onBack, service }: ServiceDetailHeroSectionProps) => {
  return (
    <div className="relative h-64 w-full bg-gray-200">
      <Image
        src={service.coverImage || APP_MEDIA_PRESET.serviceDetailCoverImage}
        alt={service.name}
        fill
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-4 pb-4 pt-14">
        <IconButton
          icon={<ChevronLeft className="h-6 w-6 text-gray-800" />}
          onClick={onBack}
          className="bg-white/90 backdrop-blur-sm"
        />
        <div className="flex gap-2">
          <IconButton icon={<Share2 className="h-5 w-5 text-gray-800" />} className="bg-white/90 backdrop-blur-sm" />
          <IconButton icon={<Heart className="h-5 w-5 text-gray-800" />} className="bg-white/90 backdrop-blur-sm" />
        </div>
      </div>

      <div className="absolute bottom-6 left-6 right-6 z-10 text-white text-shadow-sm">
        <div className="mb-2 inline-block rounded-full border border-white/30 bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wide backdrop-blur-md">
          {categoryName}
        </div>
        <h1 className="mb-2 text-3xl font-bold leading-tight">{service.name}</h1>
        <p className="max-w-xl text-sm text-white/80">{service.shortDescription}</p>
      </div>
    </div>
  );
};
