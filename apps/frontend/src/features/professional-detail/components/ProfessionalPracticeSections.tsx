'use client';

import { BadgeCheck, CalendarDays, User } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  ProfessionalSectionTitle,
  professionalSectionClassName,
} from '@/features/professional-detail/components/ProfessionalSectionTitle';
import { APP_CONFIG } from '@/lib/config';
import type { Professional } from '@/types/catalog';

interface ProfessionalPracticeSectionsProps {
  profCategory: string;
  profileCopy: {
    portfolioEntriesTitle: string;
    portfolioStatsTitle: string;
    storiesTitle: string;
  };
  professional: Professional;
}

export const ProfessionalPracticeSections = ({
  profCategory,
  profileCopy,
  professional,
}: ProfessionalPracticeSectionsProps) => {
  const t = useTranslations('Professional');

  return (
    <>
      <section className={professionalSectionClassName}>
        <ProfessionalSectionTitle icon={<CalendarDays className="h-4 w-4" />} title={profileCopy.storiesTitle} />
        <div className="custom-scrollbar flex gap-3 overflow-x-auto pb-1">
          {professional.activityStories.map((story) => (
            <div
              key={story.title}
              className="min-w-[240px] rounded-[24px] bg-[#FCFCFC] p-3 shadow-[0_16px_30px_-24px_rgba(17,24,39,0.3)]"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="rounded-full bg-gradient-to-br from-pink-500 via-orange-400 to-yellow-300 p-[2px]">
                  <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-white">
                    <Image src={story.image} alt={story.title} fill className="object-cover" />
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold text-gray-900">{story.title}</p>
                  <p className="mt-1 text-[11px] font-medium text-gray-500">{story.capturedAt}</p>
                  <p className="mt-1 text-[11px] text-gray-400">{story.location}</p>
                </div>
              </div>
              <p className="text-[12px] leading-relaxed text-gray-500">{story.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={professionalSectionClassName}>
        <ProfessionalSectionTitle icon={<BadgeCheck className="h-4 w-4" />} title={profileCopy.portfolioStatsTitle} />
        <div className="grid grid-cols-2 gap-3">
          {professional.portfolioStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-[22px] bg-[#FCFCFC] px-4 py-4 shadow-[0_14px_26px_-24px_rgba(17,24,39,0.38)]"
            >
              <p className="text-[24px] font-bold leading-none text-gray-900">{stat.value}</p>
              <p className="mt-2 text-[13px] font-semibold text-gray-900">{stat.label}</p>
              <p className="mt-2 text-[11px] leading-relaxed text-gray-500">{stat.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={professionalSectionClassName}>
        <ProfessionalSectionTitle
          icon={<User className="h-4 w-4" />}
          title={t('about', { professional: APP_CONFIG.terms.professional })}
        />
        <p className="text-[13px] leading-relaxed text-gray-500">{professional.about}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span
            className="rounded-full px-3 py-1 text-[11px] font-semibold"
            style={{ backgroundColor: APP_CONFIG.colors.primaryLight, color: APP_CONFIG.colors.primary }}
          >
            {profCategory}
          </span>
          {professional.specialties.map((specialty) => (
            <span
              key={specialty}
              className="rounded-full border border-gray-100 bg-white px-3 py-1 text-[11px] font-semibold text-gray-500"
            >
              {specialty}
            </span>
          ))}
        </div>
      </section>
    </>
  );
};
