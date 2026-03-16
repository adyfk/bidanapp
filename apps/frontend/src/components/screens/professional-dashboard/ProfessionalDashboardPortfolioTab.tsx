'use client';

import { ArrowRight, ImagePlus, Plus } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { surfaceCardPaddedClass } from '@/components/ui/tokens';
import type { ProfessionalManagedGalleryItem, ProfessionalManagedPortfolioEntry } from '@/lib/use-professional-portal';
import { MiniStatCard, ServiceMetaChip } from './ProfessionalDashboardShared';

interface ProfessionalDashboardPortfolioTabProps {
  galleryItems: ProfessionalManagedGalleryItem[];
  getServiceLabel: (serviceId: string) => string;
  isGalleryEditorOpen: boolean;
  isPortfolioEditorOpen: boolean;
  onAddGallery: () => void;
  onAddPortfolio: () => void;
  onEditGallery: (id: string) => void;
  onEditPortfolio: (id: string) => void;
  portfolioEntries: ProfessionalManagedPortfolioEntry[];
  publicPortfolioCount: number;
  selectedGalleryId: string;
  selectedPortfolioId: string;
}

export const ProfessionalDashboardPortfolioTab = ({
  galleryItems,
  getServiceLabel,
  isGalleryEditorOpen,
  isPortfolioEditorOpen,
  onAddGallery,
  onAddPortfolio,
  onEditGallery,
  onEditPortfolio,
  portfolioEntries,
  publicPortfolioCount,
  selectedGalleryId,
  selectedPortfolioId,
}: ProfessionalDashboardPortfolioTabProps) => {
  const t = useTranslations('ProfessionalPortal');
  const sectionActionButtonClass =
    'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[18px] border border-blue-200 bg-blue-50 px-4 py-3 text-[13px] font-bold text-blue-700 transition-all hover:border-blue-300 hover:bg-blue-100';
  const cardActionButtonClass = (isSelected: boolean) =>
    `flex min-h-11 w-full items-center justify-between rounded-[16px] border px-4 py-3 text-[13px] font-bold transition-all ${
      isSelected
        ? 'border-blue-200 bg-blue-50 text-blue-700'
        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100'
    }`;
  const cardSurfaceClass = (isSelected: boolean) =>
    `overflow-hidden rounded-[22px] border transition-all ${
      isSelected
        ? 'border-blue-500 bg-blue-50 shadow-[0_20px_36px_-30px_rgba(37,99,235,0.45)]'
        : 'border-slate-200 bg-white'
    }`;

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <MiniStatCard label={t('portfolio.publicCountLabel')} value={String(publicPortfolioCount)} />
        <MiniStatCard label={t('portfolio.galleryCountLabel')} value={String(galleryItems.length)} />
      </div>

      <div className="grid gap-4">
        <div className={surfaceCardPaddedClass}>
          <div className="space-y-4 border-b border-slate-200/80 pb-4">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {t('portfolio.title')}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{t('portfolio.description')}</p>
            </div>
            <button type="button" onClick={onAddPortfolio} className={sectionActionButtonClass}>
              <Plus className="h-4 w-4" />
              {t('portfolio.addButton')}
            </button>
          </div>

          <div className="mt-5 grid gap-3">
            {portfolioEntries.map((entry) => {
              const isSelected = selectedPortfolioId === entry.id && isPortfolioEditorOpen;

              return (
                <article key={entry.id} className={cardSurfaceClass(isSelected)}>
                  <div className="space-y-4 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[17px] font-bold leading-snug text-slate-900">{entry.title}</p>
                        <p className="mt-1.5 text-[13px] text-slate-500">{entry.periodLabel}</p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1.5 text-[11px] font-semibold ${
                          entry.visibility === 'public'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {entry.visibility === 'public'
                          ? t('portfolio.visibility.public')
                          : t('portfolio.visibility.private')}
                      </span>
                    </div>

                    <p className="text-[13px] leading-relaxed text-slate-600">{entry.summary}</p>

                    <div className="flex flex-wrap gap-2">
                      {entry.serviceId ? (
                        <ServiceMetaChip
                          label={t('portfolio.fields.service')}
                          value={getServiceLabel(entry.serviceId)}
                        />
                      ) : null}
                      <ServiceMetaChip label={t('portfolio.fields.outcomes')} value={String(entry.outcomes.length)} />
                    </div>
                  </div>

                  <div
                    className={`border-t px-4 py-3 ${isSelected ? 'border-blue-100 bg-blue-50/60' : 'border-slate-200/80 bg-slate-50/80'}`}
                  >
                    <button
                      type="button"
                      onClick={() => onEditPortfolio(entry.id)}
                      className={cardActionButtonClass(isSelected)}
                    >
                      <span>{t('portfolio.editButton')}</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className={surfaceCardPaddedClass}>
          <div className="space-y-4 border-b border-slate-200/80 pb-4">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {t('portfolio.galleryTitle')}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{t('portfolio.galleryDescription')}</p>
            </div>
            <button type="button" onClick={onAddGallery} className={sectionActionButtonClass}>
              <ImagePlus className="h-4 w-4" />
              {t('portfolio.galleryAddButton')}
            </button>
          </div>

          <div className="mt-5 grid gap-3">
            {galleryItems.map((item) => {
              const isSelected = selectedGalleryId === item.id && isGalleryEditorOpen;

              return (
                <article key={item.id} className={cardSurfaceClass(isSelected)}>
                  <div className="space-y-4 px-4 py-4">
                    <div className="flex gap-3">
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-[16px] bg-slate-200">
                        <Image src={item.image} alt={item.alt} fill className="object-cover" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[17px] font-bold leading-snug text-slate-900">{item.label}</p>
                            <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-slate-500">{item.alt}</p>
                          </div>
                          {item.isFeatured ? (
                            <span className="rounded-full bg-amber-100 px-2.5 py-1.5 text-[11px] font-semibold text-amber-700">
                              {t('portfolio.featuredAsset')}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`border-t px-4 py-3 ${isSelected ? 'border-blue-100 bg-blue-50/60' : 'border-slate-200/80 bg-slate-50/80'}`}
                  >
                    <button
                      type="button"
                      onClick={() => onEditGallery(item.id)}
                      className={cardActionButtonClass(isSelected)}
                    >
                      <span>{t('portfolio.galleryEditButton')}</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
