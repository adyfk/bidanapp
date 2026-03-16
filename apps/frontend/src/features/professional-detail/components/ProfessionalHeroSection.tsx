'use client';

import { CalendarDays, Heart, Share2, Star, Users } from 'lucide-react';
import Image from 'next/image';
import { IconButton } from '@/components/ui/IconButton';
import type { ProfessionalTrustIndicator } from '@/features/professional-detail/hooks/useProfessionalDetail';
import { Link } from '@/i18n/routing';
import { APP_CONFIG } from '@/lib/config';
import { APP_ROUTES } from '@/lib/routes';
import { useUiText } from '@/lib/ui-text';
import type { Professional } from '@/types/catalog';

interface ProfessionalHeroSectionProps {
  genderLabel: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  profCategory: string;
  professional: Professional;
  ratingLabel: string;
  totalReviewsLabel: string;
  trustIndicators: ProfessionalTrustIndicator[];
}

export const ProfessionalHeroSection = ({
  genderLabel,
  isFavorite,
  onToggleFavorite,
  profCategory,
  professional,
  ratingLabel,
  totalReviewsLabel,
  trustIndicators,
}: ProfessionalHeroSectionProps) => {
  const uiText = useUiText();

  return (
    <>
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
            background: 'radial-gradient(circle at top right, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0) 42%)',
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-b from-transparent to-[#FFF7FB]" />
      </div>

      <div className="relative z-10 px-6 pb-4 pt-10">
        <div className="flex items-center justify-between rounded-full border border-white/60 bg-white/82 px-4 py-3 shadow-[0_16px_32px_rgba(17,24,39,0.14)] backdrop-blur-xl">
          <Link
            href={APP_ROUTES.home}
            className="text-[17px] font-bold tracking-[0.18em] text-gray-900 transition-opacity hover:opacity-80"
          >
            {APP_CONFIG.appName}
          </Link>
          <div className="flex items-center gap-2">
            <IconButton
              icon={<Share2 className="h-5 w-5" />}
              ariaLabel="Share professional profile"
              className="text-gray-700 hover:bg-black/5"
            />
            <IconButton
              icon={<Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />}
              ariaLabel={
                isFavorite ? `Remove ${professional.name} from favorites` : `Add ${professional.name} to favorites`
              }
              className={isFavorite ? 'text-pink-600 hover:bg-pink-50' : 'text-gray-700 hover:bg-black/5'}
              onClick={onToggleFavorite}
            />
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
              <p
                className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em]"
                style={{ color: APP_CONFIG.colors.primary }}
              >
                {professional.badgeLabel || profCategory}
              </p>
              <h2 className="text-[22px] font-bold leading-tight text-gray-900">{professional.name}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="text-[14px] font-semibold" style={{ color: APP_CONFIG.colors.primary }}>
                  {professional.title}
                </p>
                <span
                  className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
                  style={{ backgroundColor: APP_CONFIG.colors.primaryLight, color: APP_CONFIG.colors.primary }}
                >
                  {genderLabel}
                </span>
              </div>
              <p className="mt-1 text-[12px] text-gray-500">
                {profCategory} <span className="mx-1">•</span> {professional.location}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px] font-medium">
                <span className="flex items-center gap-1.5" style={{ color: APP_CONFIG.colors.warning }}>
                  <Star className="h-4 w-4 fill-current" /> {professional.rating.toFixed(1)}
                </span>
                <span className="text-gray-500">
                  {professional.reviews} {totalReviewsLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-gray-100 pt-4">
            <div className="flex flex-col items-center rounded-[20px] bg-gray-50 px-3 py-4 text-center">
              <div className="mb-1.5 flex items-center text-[15px] font-bold text-gray-900">
                <CalendarDays className="mr-1.5 h-4 w-4" style={{ color: APP_CONFIG.colors.primary }} />
                {professional.experience}
              </div>
              <span className="text-[11px] font-medium text-gray-400">{uiText.terms.experience}</span>
            </div>
            <div className="flex flex-col items-center rounded-[20px] bg-gray-50 px-3 py-4 text-center">
              <div className="mb-1.5 flex items-center text-[15px] font-bold text-gray-900">
                <Users className="mr-1.5 h-4 w-4" style={{ color: APP_CONFIG.colors.primary }} />
                {professional.clientsServed}
              </div>
              <span className="text-[11px] font-medium text-gray-400">{uiText.terms.patients}</span>
            </div>
            <div className="flex flex-col items-center rounded-[20px] bg-gray-50 px-3 py-4 text-center">
              <div className="mb-1.5 flex items-center text-[15px] font-bold text-gray-900">
                <Star className="mr-1.5 h-4 w-4 fill-current" style={{ color: APP_CONFIG.colors.warning }} />
                {professional.rating.toFixed(1)}
              </div>
              <span className="text-[11px] font-medium text-gray-400">{ratingLabel}</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3">
            {trustIndicators.map((item) => (
              <div
                key={item.label}
                className="flex items-start gap-3 rounded-[20px] bg-[#FCFCFC] px-4 py-3 shadow-[0_14px_28px_-24px_rgba(17,24,39,0.35)]"
              >
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
    </>
  );
};
