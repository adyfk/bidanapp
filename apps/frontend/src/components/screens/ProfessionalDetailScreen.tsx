'use client';

import React, { useState } from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import {
  Activity,
  BadgeCheck,
  CalendarDays,
  Clock3,
  Heart,
  House,
  Languages,
  MapPin,
  Navigation,
  Share2,
  ShieldCheck,
  Star,
  Stethoscope,
  User,
  Users,
  Video,
} from 'lucide-react';
import { APP_CONFIG } from '@/lib/config';
import {
  MOCK_CATEGORIES,
  MOCK_PROFESSIONALS,
  MOCK_SERVICES,
  SIMULATION_MEDIA,
  SIMULATION_MESSAGES,
  SIMULATION_PROFESSIONAL_DETAIL,
  getBookingMessage,
} from '@/lib/constants';
import { IconButton } from '@/components/ui/IconButton';

const sectionClassName =
  'rounded-[30px] bg-white/94 p-5 shadow-[0_18px_40px_rgba(17,24,39,0.08)] backdrop-blur-sm';

const SectionTitle = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
  <div className="mb-5 flex items-center gap-3">
    <span
      className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white shadow-sm"
      style={{
        background: `linear-gradient(135deg, ${APP_CONFIG.colors.primaryLight} 0%, #FFFFFF 100%)`,
        color: APP_CONFIG.colors.primary,
      }}
    >
      {icon}
    </span>
    <h3 className="text-[17px] font-bold text-gray-900">{title}</h3>
  </div>
);

export const ProfessionalDetailScreen = ({ professionalSlug }: { professionalSlug?: string }) => {
  const professional = MOCK_PROFESSIONALS.find((item) => item.slug === professionalSlug) || MOCK_PROFESSIONALS[0];
  const [selectedService, setSelectedService] = useState<string>(
    professional.services.length > 0 ? professional.services[0].serviceId : ''
  );

  const t = useTranslations('Professional');
  const profileCopy = SIMULATION_MESSAGES.professionalProfile;
  const profCategory = MOCK_CATEGORIES.find((category) => category.id === professional.categoryId)?.name || 'Professional';
  const offeredServices = professional.services.flatMap((serviceMapping) => {
    const catalogService = MOCK_SERVICES.find((service) => service.id === serviceMapping.serviceId);

    return catalogService ? [{ serviceMapping, catalogService }] : [];
  });
  const selectedServiceEntry = offeredServices.find(({ serviceMapping }) => serviceMapping.serviceId === selectedService);

  const getServiceName = (serviceId?: string) =>
    serviceId ? MOCK_SERVICES.find((service) => service.id === serviceId)?.name : undefined;

  const trustIndicators = [
    {
      label: profileCopy.availabilityLabel,
      value: professional.availabilityLabel,
      icon: <BadgeCheck className="h-4 w-4" />,
    },
    {
      label: profileCopy.responseTimeLabel,
      value: professional.responseTime,
      icon: <Clock3 className="h-4 w-4" />,
    },
    {
      label: profileCopy.languagesLabel,
      value: professional.languages.join(' / '),
      icon: <Languages className="h-4 w-4" />,
    },
  ];

  return (
    <div
      className="relative flex h-full flex-col overflow-y-auto custom-scrollbar"
      style={{ background: 'linear-gradient(180deg, #FFF7FB 0%, #FFFFFF 20%, #F9FAFB 100%)' }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[520px] overflow-hidden">
        <div
          className="absolute -left-20 top-6 h-48 w-48 rounded-full blur-3xl"
          style={{ backgroundColor: 'rgba(233, 30, 140, 0.16)' }}
        />
        <div
          className="absolute -right-12 top-24 h-40 w-40 rounded-full blur-3xl"
          style={{ backgroundColor: 'rgba(249, 115, 22, 0.14)' }}
        />
      </div>

      <div className="absolute inset-x-0 top-0 h-[390px] overflow-hidden rounded-b-[42px]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundColor: APP_CONFIG.colors.primaryDark,
            backgroundImage: `url('${professional.coverImage || professional.image}')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/18 to-transparent" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at top right, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0) 42%)',
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-b from-transparent to-[#FFF7FB]" />
      </div>

      <div className="relative z-10 px-6 pb-4 pt-10">
        <div className="flex items-center justify-between rounded-full border border-white/60 bg-white/82 px-4 py-3 shadow-[0_16px_32px_rgba(17,24,39,0.14)] backdrop-blur-xl">
          <Link href="/home" className="text-[17px] font-bold tracking-[0.18em] text-gray-900 transition-opacity hover:opacity-80">
            {APP_CONFIG.appName}
          </Link>
          <div className="flex items-center gap-2">
            <IconButton icon={<Share2 className="h-5 w-5" />} className="text-gray-700 hover:bg-black/5" />
            <IconButton icon={<Heart className="h-5 w-5" />} className="text-gray-700 hover:bg-black/5" />
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-3 px-6">
        <div className="rounded-[32px] bg-white/94 p-5 shadow-[0_22px_52px_rgba(17,24,39,0.12)] backdrop-blur-sm">
          <div className="mb-6 flex gap-4">
            <div
              className="relative h-[108px] w-[90px] flex-shrink-0 overflow-hidden rounded-[20px]"
              style={{ backgroundColor: APP_CONFIG.colors.primaryLight }}
            >
              <Image src={professional.image} alt={professional.name} fill className="object-cover object-top" />
            </div>

            <div className="flex flex-1 flex-col justify-center">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: APP_CONFIG.colors.primary }}>
                {professional.badgeLabel}
              </p>
              <h2 className="text-[22px] font-bold leading-tight text-gray-900">{professional.name}</h2>
              <p className="mt-1 text-[14px] font-semibold" style={{ color: APP_CONFIG.colors.primary }}>
                {professional.title}
              </p>
              <p className="mt-1 text-[12px] text-gray-500">
                {profCategory} <span className="mx-1">•</span> {professional.location}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px] font-medium">
                <span className="flex items-center gap-1.5" style={{ color: APP_CONFIG.colors.warning }}>
                  <Star className="h-4 w-4 fill-current" /> {professional.rating.toFixed(1)}
                </span>
                <span className="text-gray-500">{professional.reviews} {profileCopy.totalReviewsLabel}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-gray-100 pt-4">
            <div className="flex flex-col items-center rounded-[20px] bg-gray-50 px-3 py-4 text-center">
              <div className="mb-1.5 flex items-center text-[15px] font-bold text-gray-900">
                <CalendarDays className="mr-1.5 h-4 w-4" style={{ color: APP_CONFIG.colors.primary }} />
                {professional.experience}
              </div>
              <span className="text-[11px] font-medium text-gray-400">{APP_CONFIG.terms.experience}</span>
            </div>
            <div className="flex flex-col items-center rounded-[20px] bg-gray-50 px-3 py-4 text-center">
              <div className="mb-1.5 flex items-center text-[15px] font-bold text-gray-900">
                <Users className="mr-1.5 h-4 w-4" style={{ color: APP_CONFIG.colors.primary }} />
                {professional.clientsServed}
              </div>
              <span className="text-[11px] font-medium text-gray-400">{APP_CONFIG.terms.patients}</span>
            </div>
            <div className="flex flex-col items-center rounded-[20px] bg-gray-50 px-3 py-4 text-center">
              <div className="mb-1.5 flex items-center text-[15px] font-bold text-gray-900">
                <Star className="mr-1.5 h-4 w-4 fill-current" style={{ color: APP_CONFIG.colors.warning }} />
                {professional.rating.toFixed(1)}
              </div>
              <span className="text-[11px] font-medium text-gray-400">{t('rating')}</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3">
            {trustIndicators.map((item) => (
              <div key={item.label} className="flex items-start gap-3 rounded-[20px] bg-[#FCFCFC] px-4 py-3 shadow-[0_14px_28px_-24px_rgba(17,24,39,0.35)]">
                <span
                  className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: APP_CONFIG.colors.primaryLight, color: APP_CONFIG.colors.primary }}
                >
                  {item.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{item.label}</p>
                  <p className="mt-1 text-[13px] font-semibold text-gray-900">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-6 space-y-5 px-6 pb-44">
        <section className={sectionClassName}>
          <SectionTitle icon={<CalendarDays className="h-4 w-4" />} title={profileCopy.storiesTitle} />
          <div className="flex gap-3 overflow-x-auto pb-1 custom-scrollbar">
            {professional.activityStories.map((story) => (
              <div key={story.title} className="min-w-[240px] rounded-[24px] bg-[#FCFCFC] p-3 shadow-[0_16px_30px_-24px_rgba(17,24,39,0.3)]">
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

        <section className={sectionClassName}>
          <SectionTitle icon={<BadgeCheck className="h-4 w-4" />} title={profileCopy.portfolioStatsTitle} />
          <div className="grid grid-cols-2 gap-3">
            {professional.portfolioStats.map((stat) => (
              <div key={stat.label} className="rounded-[22px] bg-[#FCFCFC] px-4 py-4 shadow-[0_14px_26px_-24px_rgba(17,24,39,0.38)]">
                <p className="text-[24px] font-bold leading-none text-gray-900">{stat.value}</p>
                <p className="mt-2 text-[13px] font-semibold text-gray-900">{stat.label}</p>
                <p className="mt-2 text-[11px] leading-relaxed text-gray-500">{stat.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={sectionClassName}>
          <SectionTitle icon={<User className="h-4 w-4" />} title={t('about', { professional: APP_CONFIG.terms.professional })} />
          <p className="text-[13px] leading-relaxed text-gray-500">{professional.about}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span
              className="rounded-full px-3 py-1 text-[11px] font-semibold"
              style={{ backgroundColor: APP_CONFIG.colors.primaryLight, color: APP_CONFIG.colors.primary }}
            >
              {profCategory}
            </span>
            {professional.specialties.map((specialty) => (
              <span key={specialty} className="rounded-full border border-gray-100 bg-white px-3 py-1 text-[11px] font-semibold text-gray-500">
                {specialty}
              </span>
            ))}
          </div>
        </section>

        <section className={sectionClassName}>
          <SectionTitle icon={<BadgeCheck className="h-4 w-4" />} title={profileCopy.portfolioEntriesTitle} />
          <div className="space-y-4">
            {professional.portfolioEntries.map((entry) => {
              const serviceName = getServiceName(entry.serviceId);

              return (
                <article key={entry.title} className="overflow-hidden rounded-[24px] bg-white shadow-[0_18px_34px_-24px_rgba(17,24,39,0.32)]">
                  <div className="relative h-[180px]">
                    <Image src={entry.image} alt={entry.title} fill className="object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {serviceName ? (
                          <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold" style={{ color: APP_CONFIG.colors.primary }}>
                            {serviceName}
                          </span>
                        ) : null}
                        <span className="rounded-full bg-black/35 px-3 py-1 text-[11px] font-semibold text-white">{entry.periodLabel}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="text-[16px] font-bold text-gray-900">{entry.title}</h4>
                    <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{entry.summary}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {entry.outcomes.map((outcome) => (
                        <span key={outcome} className="rounded-full bg-gray-50 px-3 py-1 text-[11px] font-semibold text-gray-600">
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

        <section className={sectionClassName}>
          <SectionTitle icon={<MapPin className="h-4 w-4" />} title={profileCopy.galleryTitle} />
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

        <section className={sectionClassName}>
          <SectionTitle icon={<Star className="h-4 w-4" />} title={profileCopy.testimonialsTitle} />
          <div className="flex gap-3 overflow-x-auto pb-1 custom-scrollbar">
            {professional.testimonials.map((testimonial) => {
              const serviceName = getServiceName(testimonial.serviceId);

              return (
                <article key={`${testimonial.author}-${testimonial.dateLabel}`} className="min-w-[280px] rounded-[24px] bg-[#FCFCFC] p-4 shadow-[0_16px_28px_-24px_rgba(17,24,39,0.34)]">
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
        </section>

        <section className={sectionClassName}>
          <SectionTitle icon={<Star className="h-4 w-4" />} title={profileCopy.feedbackTitle} />

          <div className="mb-5 flex flex-col gap-3 rounded-[24px] bg-[#FCFCFC] p-4 shadow-[0_18px_34px_-28px_rgba(17,24,39,0.42)]">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="flex items-end gap-2">
                  <span className="text-[34px] font-bold leading-none text-gray-900">{professional.rating.toFixed(1)}</span>
                  <span className="mb-1 text-[12px] font-medium text-gray-400">/ 5.0</span>
                </div>
                <p className="mt-2 text-[12px] text-gray-500">
                  {professional.reviews} {profileCopy.totalReviewsLabel}
                </p>
              </div>
              <div className="grid flex-1 grid-cols-2 gap-2">
                <div className="rounded-[18px] bg-white px-3 py-3 text-center">
                  <p className="text-[16px] font-bold text-gray-900">{professional.feedbackSummary.recommendationRate}</p>
                  <p className="mt-1 text-[11px] text-gray-500">{profileCopy.recommendationLabel}</p>
                </div>
                <div className="rounded-[18px] bg-white px-3 py-3 text-center">
                  <p className="text-[16px] font-bold text-gray-900">{professional.feedbackSummary.repeatClientRate}</p>
                  <p className="mt-1 text-[11px] text-gray-500">{profileCopy.repeatClientsLabel}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {professional.feedbackBreakdown.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="w-16 flex-shrink-0 text-[11px] font-semibold text-gray-500">{item.label}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                    <div className="h-full rounded-full" style={{ width: `${item.percentage}%`, backgroundColor: APP_CONFIG.colors.primary }} />
                  </div>
                  <span className="w-10 flex-shrink-0 text-right text-[11px] font-medium text-gray-500">{item.total}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {professional.feedbackMetrics.map((metric) => (
              <div key={metric.label} className="rounded-[22px] bg-[#FCFCFC] p-4 shadow-[0_14px_26px_-24px_rgba(17,24,39,0.34)]">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[13px] font-semibold text-gray-900">{metric.label}</p>
                  <span
                    className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style={{ backgroundColor: APP_CONFIG.colors.primaryLight, color: APP_CONFIG.colors.primary }}
                  >
                    {metric.value}
                  </span>
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-gray-500">{metric.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={sectionClassName}>
          <SectionTitle icon={<MapPin className="h-4 w-4" />} title={APP_CONFIG.terms.location} />
          <div
            className="relative mb-4 h-[190px] overflow-hidden rounded-[24px] bg-cover bg-center"
            style={{ backgroundImage: `url('${SIMULATION_MEDIA.professionalMapBackgroundImage}')` }}
          >
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px]" />
            <svg className="absolute inset-0 h-full w-full drop-shadow-md" style={{ zIndex: 1 }}>
              <path
                d="M 60,110 L 100,60 L 120,80 L 150,50 C 180,50 180,90 200,90 L 250,130"
                fill="none"
                stroke={APP_CONFIG.colors.primary}
                strokeWidth="3"
              />
              <circle cx="60" cy="110" r="5" fill={APP_CONFIG.colors.primary} />
              <circle cx="250" cy="130" r="5" fill={APP_CONFIG.colors.danger} />
              <circle cx="250" cy="130" r="12" fill={APP_CONFIG.colors.danger} opacity="0.2" className="animate-pulse" />
            </svg>
          </div>

          <div className="mb-4 flex items-end justify-between text-sm">
            <div className="flex gap-8">
              <div>
                <span className="mb-1 block text-[11px] text-gray-400">{t('distance')}</span>
                <span className="font-bold text-gray-900">{SIMULATION_PROFESSIONAL_DETAIL.distance}</span>
              </div>
              <div>
                <span className="mb-1 block text-[11px] text-gray-400">{t('time')}</span>
                <span className="font-bold text-gray-900">{SIMULATION_PROFESSIONAL_DETAIL.travelTime}</span>
              </div>
            </div>
            <button className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:bg-gray-50">
              <Navigation className="h-4 w-4 rotate-45" style={{ color: APP_CONFIG.colors.primary }} />
            </button>
          </div>

          <p className="text-[14px] font-bold text-gray-900">
            {professional.addressLines[0] || SIMULATION_PROFESSIONAL_DETAIL.addressLine1}
          </p>
          <p className="mt-1 text-[12px] text-gray-500">
            {professional.addressLines[1] || SIMULATION_PROFESSIONAL_DETAIL.addressLine2}
          </p>
        </section>

        <section className={sectionClassName}>
          <SectionTitle icon={<ShieldCheck className="h-4 w-4" />} title={profileCopy.credentialsTitle} />
          <div className="space-y-3">
            {professional.credentials.map((credential) => (
              <div key={credential.title} className="rounded-[22px] bg-[#FCFCFC] p-4 shadow-[0_16px_28px_-24px_rgba(17,24,39,0.32)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-semibold text-gray-900">{credential.title}</p>
                    <p className="mt-1 text-[12px] font-medium text-gray-500">{credential.issuer}</p>
                  </div>
                  <span
                    className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style={{ backgroundColor: APP_CONFIG.colors.primaryLight, color: APP_CONFIG.colors.primary }}
                  >
                    {credential.year}
                  </span>
                </div>
                <p className="mt-3 text-[12px] leading-relaxed text-gray-500">{credential.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] bg-white p-5 shadow-sm">
          <SectionTitle icon={<Activity className="h-4 w-4" />} title={profileCopy.recentActivityTitle} />
          <div>
            {professional.recentActivities.map((activity, index) => (
              <div key={`${activity.dateLabel}-${activity.title}`} className="flex gap-3">
                <div className="flex w-5 flex-col items-center">
                  <span className="mt-1 h-3 w-3 rounded-full" style={{ backgroundColor: APP_CONFIG.colors.primary }} />
                  {index < professional.recentActivities.length - 1 ? (
                    <span className="mt-2 h-full w-px bg-pink-100" />
                  ) : null}
                </div>
                <div className={`flex-1 ${index < professional.recentActivities.length - 1 ? 'pb-5' : ''}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[14px] font-semibold text-gray-900">{activity.title}</p>
                    <span className="text-[11px] font-medium text-gray-400">{activity.dateLabel}</span>
                  </div>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: APP_CONFIG.colors.primary }}>
                    {activity.channel}
                  </p>
                  <p className="mt-2 text-[12px] leading-relaxed text-gray-500">{activity.summary}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] bg-white p-5 shadow-sm">
          <SectionTitle icon={<Stethoscope className="h-4 w-4" />} title={profileCopy.serviceSectionTitle} />
          <div className="space-y-3">
            {offeredServices.map(({ serviceMapping, catalogService }) => {
              const isSelected = selectedService === serviceMapping.serviceId;
              const ServiceTypeIcon = catalogService.type === 'visit' ? House : Video;

              return (
                <button
                  key={serviceMapping.serviceId}
                  onClick={() => setSelectedService(serviceMapping.serviceId)}
                  className={`w-full rounded-[24px] border p-4 text-left transition-all ${
                    isSelected ? 'shadow-[0_16px_34px_-18px_rgba(233,30,140,0.25)]' : 'shadow-[0_14px_28px_-24px_rgba(17,24,39,0.24)] hover:shadow-[0_18px_32px_-22px_rgba(17,24,39,0.28)]'
                  }`}
                  style={{
                    borderColor: isSelected ? 'rgba(233, 30, 140, 0.18)' : 'transparent',
                    backgroundColor: isSelected ? '#FFF7FB' : '#FCFCFC',
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 gap-3">
                      <span
                        className="mt-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: APP_CONFIG.colors.primaryLight, color: APP_CONFIG.colors.primary }}
                      >
                        <ServiceTypeIcon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-[15px] font-bold text-gray-900">{catalogService.name}</h4>
                          <span
                            className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
                            style={{ backgroundColor: APP_CONFIG.colors.primaryLight, color: APP_CONFIG.colors.primary }}
                          >
                            {catalogService.badge}
                          </span>
                        </div>
                        <p className="mt-1 text-[12px] leading-relaxed text-gray-500">
                          {serviceMapping.summary || catalogService.shortDescription}
                        </p>
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <p className="text-[16px] font-bold text-gray-900">{serviceMapping.price}</p>
                      <p className="mt-1 text-[11px] font-medium text-gray-500">{serviceMapping.duration}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {catalogService.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-gray-500">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2">
                    {catalogService.highlights.slice(0, 2).map((highlight) => (
                      <div key={highlight} className="flex items-start gap-2 text-[12px] text-gray-600">
                        <span className="mt-[5px] h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: APP_CONFIG.colors.primary }} />
                        <span>{highlight}</span>
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <div className="absolute bottom-0 left-0 z-30 w-full rounded-t-[34px] bg-white/90 p-6 pt-5 shadow-[0_-18px_40px_rgba(17,24,39,0.08)] backdrop-blur-xl">
        {selectedServiceEntry ? (
          <div className="mb-5 rounded-[20px] px-4 py-3" style={{ backgroundColor: APP_CONFIG.colors.primaryLight }}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: APP_CONFIG.colors.primary }}>
                  {selectedServiceEntry.catalogService.badge}
                </p>
                <p className="mt-1 text-[14px] font-bold text-gray-900">{selectedServiceEntry.catalogService.name}</p>
              </div>
              <div className="text-right">
                <p className="text-[15px] font-bold text-gray-900">{selectedServiceEntry.serviceMapping.price}</p>
                <p className="mt-1 text-[11px] font-medium text-gray-500">{selectedServiceEntry.serviceMapping.duration}</p>
              </div>
            </div>
            <p className="text-[13px] leading-relaxed text-gray-600">
              {selectedServiceEntry.serviceMapping.summary || selectedServiceEntry.catalogService.shortDescription}
            </p>
          </div>
        ) : null}

        <button
          className="w-full rounded-full py-4 text-[15px] font-bold text-white transition-transform active:scale-[0.98]"
          style={{
            backgroundColor: APP_CONFIG.colors.primary,
            boxShadow: '0 12px 28px rgba(233, 30, 140, 0.28)',
          }}
          onClick={() => {
            if (selectedServiceEntry) {
              alert(getBookingMessage(selectedServiceEntry.catalogService.type));
            }
          }}
        >
          {t('makeAppointment')}
        </button>
      </div>
    </div>
  );
};
