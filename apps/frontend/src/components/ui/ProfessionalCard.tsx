import { Heart, Star } from 'lucide-react';
import type { Route } from 'next';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { APP_CONFIG } from '@/lib/config';
import { getProfessionalCategoryLabel, getProfessionalCoverageStatus } from '@/lib/mock-db/catalog';
import { useUiText } from '@/lib/ui-text';
import type { GeoPoint, Professional } from '@/types/catalog';

interface ProfessionalCardProps {
  professional: Professional;
  href: Route;
  isFavorite: boolean;
  onToggleFavorite: (professionalId: string) => void;
  selectedAreaId: string;
  userLocation: GeoPoint;
}

export const ProfessionalCard = ({
  professional,
  href,
  isFavorite,
  onToggleFavorite,
  selectedAreaId,
  userLocation,
}: ProfessionalCardProps) => {
  const t = useTranslations('Professional');
  const uiText = useUiText();
  const categoryLabel = getProfessionalCategoryLabel(professional) || 'Professional';
  const coverageStatus = getProfessionalCoverageStatus(professional, userLocation, selectedAreaId);
  const hasHomeVisit = professional.services.some((service) => service.serviceModes.homeVisit);
  const genderLabel = uiText.getProfessionalGenderLabel(professional.gender);

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
              onToggleFavorite(professional.id);
            }}
            className="rounded-full p-1 transition-transform hover:scale-105"
            aria-label={
              isFavorite ? `Remove ${professional.name} from favorites` : `Add ${professional.name} to favorites`
            }
            style={{ color: APP_CONFIG.colors.primary }}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>
        <p className="text-[13px] mt-1 mb-2 font-medium" style={{ color: APP_CONFIG.colors.primary }}>
          {categoryLabel} <span className="text-gray-400 font-normal">- {professional.location}</span>
        </p>
        <p className="text-[12px] text-gray-500 mb-2 line-clamp-1">{professional.specialties.join(' • ')}</p>
        <div className="mb-2 flex flex-wrap gap-2">
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
            style={{ backgroundColor: APP_CONFIG.colors.primaryLight, color: APP_CONFIG.colors.primary }}
          >
            {genderLabel}
          </span>
        </div>
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
