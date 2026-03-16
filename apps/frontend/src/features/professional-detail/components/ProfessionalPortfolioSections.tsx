'use client';

import { BadgeCheck, MapPin, Star } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  ProfessionalSectionTitle,
  professionalSectionClassName,
} from '@/features/professional-detail/components/ProfessionalSectionTitle';
import { SectionPaginationControls } from '@/features/professional-detail/components/SectionPaginationControls';
import { APP_CONFIG } from '@/lib/config';
import type { Professional } from '@/types/catalog';

interface ProfessionalPortfolioSectionsProps {
  getServiceName: (serviceId?: string) => string | undefined;
  profileCopy: {
    galleryTitle: string;
    portfolioEntriesTitle: string;
    testimonialsTitle: string;
  };
  professional: Professional;
}

export const ProfessionalPortfolioSections = ({
  getServiceName,
  profileCopy,
  professional,
}: ProfessionalPortfolioSectionsProps) => {
  const t = useTranslations('Professional');
  const [testimonialPage, setTestimonialPage] = useState(1);
  const testimonialPageSize = 1;
  const totalTestimonialPages = Math.ceil(professional.testimonials.length / testimonialPageSize);
  const visibleTestimonials = professional.testimonials.slice(
    (testimonialPage - 1) * testimonialPageSize,
    testimonialPage * testimonialPageSize,
  );

  return (
    <>
      <section className={professionalSectionClassName}>
        <ProfessionalSectionTitle icon={<BadgeCheck className="h-4 w-4" />} title={profileCopy.portfolioEntriesTitle} />
        <div className="space-y-4">
          {professional.portfolioEntries.map((entry) => {
            const serviceName = getServiceName(entry.serviceId);

            return (
              <article
                key={entry.title}
                className="overflow-hidden rounded-[24px] bg-white shadow-[0_18px_34px_-24px_rgba(17,24,39,0.32)]"
              >
                <div className="relative h-[180px]">
                  <Image src={entry.image} alt={entry.title} fill className="object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {serviceName ? (
                        <span
                          className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold"
                          style={{ color: APP_CONFIG.colors.primary }}
                        >
                          {serviceName}
                        </span>
                      ) : null}
                      <span className="rounded-full bg-black/35 px-3 py-1 text-[11px] font-semibold text-white">
                        {entry.periodLabel}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="text-[16px] font-bold text-gray-900">{entry.title}</h4>
                  <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{entry.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {entry.outcomes.map((outcome) => (
                      <span
                        key={outcome}
                        className="rounded-full bg-gray-50 px-3 py-1 text-[11px] font-semibold text-gray-600"
                      >
                        {outcome}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className={professionalSectionClassName}>
        <ProfessionalSectionTitle icon={<MapPin className="h-4 w-4" />} title={profileCopy.galleryTitle} />
        <div className="grid grid-cols-2 gap-3">
          {professional.gallery.map((photo, index) => (
            <div
              key={photo.label}
              className={`relative overflow-hidden rounded-[24px] ${index === 0 ? 'col-span-2 h-[200px]' : 'h-[132px]'}`}
            >
              <Image src={photo.image} alt={photo.alt} fill className="object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                <p className="text-[11px] font-semibold text-white">{photo.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={professionalSectionClassName}>
        <ProfessionalSectionTitle icon={<Star className="h-4 w-4" />} title={profileCopy.testimonialsTitle} />
        <div className="space-y-3">
          {visibleTestimonials.map((testimonial) => {
            const serviceName = getServiceName(testimonial.serviceId);

            return (
              <article
                key={`${testimonial.author}-${testimonial.dateLabel}`}
                className="rounded-[24px] bg-[#FCFCFC] p-4 shadow-[0_16px_28px_-24px_rgba(17,24,39,0.34)]"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="relative h-12 w-12 overflow-hidden rounded-full">
                    <Image src={testimonial.image} alt={testimonial.author} fill className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-gray-900">{testimonial.author}</p>
                    <p className="truncate text-[11px] text-gray-500">{testimonial.role}</p>
                  </div>
                </div>

                <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] font-medium">
                  <span className="flex items-center gap-1" style={{ color: APP_CONFIG.colors.warning }}>
                    <Star className="h-4 w-4 fill-current" /> {testimonial.rating.toFixed(1)}
                  </span>
                  <span className="text-gray-400">{testimonial.dateLabel}</span>
                  {serviceName ? (
                    <span
                      className="rounded-full px-2.5 py-1"
                      style={{ backgroundColor: APP_CONFIG.colors.primaryLight, color: APP_CONFIG.colors.primary }}
                    >
                      {serviceName}
                    </span>
                  ) : null}
                </div>

                <p className="text-[13px] leading-relaxed text-gray-600">{testimonial.quote}</p>
              </article>
            );
          })}
        </div>
        <SectionPaginationControls
          currentPage={testimonialPage}
          nextLabel={t('paginationNext')}
          onNext={() => setTestimonialPage((current) => Math.min(current + 1, totalTestimonialPages))}
          onPrevious={() => setTestimonialPage((current) => Math.max(current - 1, 1))}
          previousLabel={t('paginationPrevious')}
          statusLabel={t('paginationStatus', { current: testimonialPage, total: totalTestimonialPages })}
          totalPages={totalTestimonialPages}
        />
      </section>
    </>
  );
};
