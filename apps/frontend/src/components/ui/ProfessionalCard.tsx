import { Heart, Star } from 'lucide-react';
import type { Route } from 'next';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { accentSoftPillClass, neutralSoftPillClass, softWhitePanelClass } from '@/components/ui/tokens';
import { Link } from '@/i18n/routing';
import { getProfessionalCategoryLabel, getProfessionalCoverageStatus } from '@/lib/catalog-selectors';
import { APP_CONFIG } from '@/lib/config';
import { useUiText } from '@/lib/ui-text';
import type { Area, Category, GeoPoint, GlobalService, Professional } from '@/types/catalog';

interface ProfessionalCardProps {
  areas: Area[];
  categories: Category[];
  professional: Professional;
  href: Route;
  isFavorite: boolean;
  onToggleFavorite: (professionalId: string) => void;
  selectedAreaId: string;
  services: GlobalService[];
  userLocation: GeoPoint;
}

export const ProfessionalCard = ({
  areas,
  categories,
  professional,
  href,
  isFavorite,
  onToggleFavorite,
  selectedAreaId,
  services,
  userLocation,
}: ProfessionalCardProps) => {
  const t = useTranslations('Professional');
  const uiText = useUiText();
  const categoryLabel =
    getProfessionalCategoryLabel({
      categories,
      professional,
      services,
    }) || 'Professional';
  const coverageStatus = getProfessionalCoverageStatus({
    areas,
    professional,
    selectedAreaId,
    userLocation,
  });
  const hasHomeVisit = professional.services.some((service) => service.serviceModes.homeVisit);
  const genderLabel = uiText.getProfessionalGenderLabel(professional.gender);

  return (
    <Link
      href={href}
      className={`${softWhitePanelClass} block cursor-pointer p-4 transition-all hover:shadow-[0_18px_45px_-32px_rgba(15,23,42,0.24)] active:scale-[0.98]`}
    >
      <div className="flex gap-4">
        <div className="relative h-[100px] w-[85px] flex-shrink-0 overflow-hidden rounded-[16px] bg-slate-100">
          <Image src={professional.image} alt={professional.name} fill className="object-cover object-top" />
        </div>
        <div className="flex flex-1 flex-col justify-center">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-[16px] font-bold leading-tight text-slate-900">{professional.name}</h3>
              <p className="mt-1 text-[13px] font-medium" style={{ color: APP_CONFIG.colors.primary }}>
                {categoryLabel} <span className="font-normal text-slate-400">• {professional.location}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onToggleFavorite(professional.id);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition-transform hover:scale-105"
              aria-label={
                isFavorite ? `Remove ${professional.name} from favorites` : `Add ${professional.name} to favorites`
              }
              style={{ color: isFavorite ? APP_CONFIG.colors.primary : undefined }}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>

          <p className="mt-2 line-clamp-1 text-[12px] text-slate-500">{professional.specialties.join(' • ')}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className={accentSoftPillClass}>{genderLabel}</span>
            <span className={neutralSoftPillClass}>
              {professional.experience} {t('experience')}
            </span>
            <span className={neutralSoftPillClass}>
              {professional.availability.isAvailable ? t('available') : t('unavailable')}
            </span>
          </div>

          <div className="mt-3 flex items-center gap-3 text-[12px] font-medium text-slate-500">
            <div className="flex items-center" style={{ color: APP_CONFIG.colors.warning }}>
              <Star className="mr-1 h-4 w-4 fill-current" /> {professional.rating.toFixed(1)}
            </div>
            <span>{categoryLabel}</span>
          </div>

          <p className="mt-2 text-[11px] text-slate-400">
            {hasHomeVisit
              ? `${coverageStatus.isHomeVisitCovered ? t('coverageIn') : t('coverageOut')}`
              : t('onlineOnlyCoverage')}
          </p>
        </div>
      </div>
    </Link>
  );
};
