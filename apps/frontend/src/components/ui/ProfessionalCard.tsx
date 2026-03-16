import { Heart, Star } from 'lucide-react';
import type { Route } from 'next';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { APP_CONFIG } from '@/lib/config';
import { getProfessionalCategoryLabel, getProfessionalCoverageStatus } from '@/lib/mock-db/catalog';
import { ACTIVE_USER_CONTEXT } from '@/lib/mock-db/runtime';
import type { Professional } from '@/types/catalog';

interface ProfessionalCardProps {
  professional: Professional;
  href: Route;
}

export const ProfessionalCard = ({ professional, href }: ProfessionalCardProps) => {
  const t = useTranslations('Professional');
  const categoryLabel = getProfessionalCategoryLabel(professional) || 'Professional';
  const coverageStatus = getProfessionalCoverageStatus(
    professional,
    ACTIVE_USER_CONTEXT.userLocation,
    ACTIVE_USER_CONTEXT.area.id,
  );
  const hasHomeVisit = professional.services.some((service) => service.serviceModes.homeVisit);

  return (
    <Link
      href={href}
      className="bg-white rounded-[24px] p-4 flex gap-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all active:scale-[0.98] block"
    >
      <div className="w-[85px] h-[100px] bg-[#F5F5F5] rounded-[18px] overflow-hidden flex-shrink-0 relative">
        <Image src={professional.image} alt={professional.name} fill className="object-cover object-top" />
      </div>
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-[16px] text-gray-900 leading-tight">{professional.name}</h3>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
            }}
            style={{ color: APP_CONFIG.colors.primary }}
          >
            <Heart className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[13px] mt-1 mb-2 font-medium" style={{ color: APP_CONFIG.colors.primary }}>
          {categoryLabel} <span className="text-gray-400 font-normal">- {professional.location}</span>
        </p>
        <p className="text-[12px] text-gray-500 mb-2 line-clamp-1">{professional.specialties.join(' • ')}</p>
        <div className="flex items-center gap-3 text-[12px] text-gray-500 font-medium">
          <div className="flex items-center" style={{ color: APP_CONFIG.colors.warning }}>
            <Star className="w-4 h-4 mr-1 fill-current" /> {professional.rating.toFixed(1)}
          </div>
          <span>
            {professional.experience} {t('experience')}
          </span>
        </div>
        <p className="text-[11px] text-gray-400 mt-2">
          {professional.availability.isAvailable ? t('available') : t('unavailable')}
          {hasHomeVisit ? ` • ${coverageStatus.isHomeVisitCovered ? t('coverageIn') : t('coverageOut')}` : ''}
        </p>
      </div>
    </Link>
  );
};
