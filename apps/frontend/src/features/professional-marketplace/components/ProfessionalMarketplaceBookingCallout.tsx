import { ArrowRight, CalendarDays, Clock3, ShieldCheck } from 'lucide-react';
import {
  getProfessionalMarketplaceCopy,
  type ProfessionalPublicPageData,
} from '@/features/professional-marketplace/lib/page-data';
import { Link } from '@/i18n/routing';
import { professionalSectionRoute } from '@/lib/routes';

interface ProfessionalMarketplaceBookingCalloutProps {
  locale: string;
  pageData: ProfessionalPublicPageData;
}

export const ProfessionalMarketplaceBookingCallout = ({
  locale,
  pageData,
}: ProfessionalMarketplaceBookingCalloutProps) => {
  const copy = getProfessionalMarketplaceCopy(locale);
  const featuredEntry = pageData.featuredServices[0];
  const targetHref = professionalSectionRoute(pageData.professional.slug, 'services', {
    mode: featuredEntry?.serviceMapping.defaultMode,
    serviceId: featuredEntry?.serviceMapping.serviceId,
  });

  return (
    <div className="sticky top-24 overflow-hidden rounded-[1.9rem] border border-[color:var(--marketplace-line)] bg-white shadow-[0_28px_60px_-40px_rgba(14,165,233,0.42)]">
      <div className="border-b border-[color:var(--marketplace-line)] bg-[linear-gradient(180deg,rgba(224,242,254,0.9)_0%,rgba(255,255,255,0.98)_100%)] p-5">
        <p className="inline-flex items-center gap-2 rounded-full bg-[color:var(--marketplace-primary-soft)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[color:var(--marketplace-primary)]">
          <ShieldCheck className="h-3.5 w-3.5" />
          {copy.bookingSurfaceTitle}
        </p>
        <h2 className="mt-4 text-2xl font-black tracking-[-0.04em] text-slate-950">
          {locale === 'id' ? 'Booking siap diproses dari rail ini.' : 'Booking can start directly from this rail.'}
        </h2>
        <p className="mt-3 text-sm leading-7 text-[color:var(--marketplace-ink-muted)]">{copy.bookingHelper}</p>
      </div>

      <div className="p-5">
        {featuredEntry ? (
          <div className="rounded-[1.5rem] border border-[color:var(--marketplace-line)] bg-[color:var(--marketplace-surface-muted)] p-4">
            <p className="text-sm font-semibold text-slate-500">{copy.featuredServices}</p>
            <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950">
              {featuredEntry.catalogService.name}
            </h3>
            <p className="mt-2 text-sm leading-7 text-[color:var(--marketplace-ink-muted)]">
              {featuredEntry.serviceMapping.summary || featuredEntry.catalogService.shortDescription}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-[color:var(--marketplace-ink-muted)]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 shadow-sm">
                <Clock3 className="h-3.5 w-3.5 text-[color:var(--marketplace-primary)]" />
                {featuredEntry.serviceMapping.duration}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 shadow-sm">
                <CalendarDays className="h-3.5 w-3.5 text-[color:var(--marketplace-primary)]" />
                {featuredEntry.serviceMapping.defaultMode}
              </span>
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-500">
              {copy.fromPrice}{' '}
              <span className="text-xl font-black tracking-tight text-slate-950">
                {featuredEntry.serviceMapping.price}
              </span>
            </p>
          </div>
        ) : null}

        <div className="mt-4 grid gap-3">
          <div className="rounded-[1.2rem] border border-[color:var(--marketplace-line)] bg-white px-4 py-3 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{copy.responseTime}</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">{pageData.professional.responseTime}</p>
          </div>
          <div className="rounded-[1.2rem] border border-[color:var(--marketplace-line)] bg-white px-4 py-3 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{copy.availability}</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">
              {pageData.professional.availability.isAvailable
                ? locale === 'id'
                  ? 'Sedang menerima klien baru'
                  : 'Accepting new clients'
                : locale === 'id'
                  ? 'Ketersediaan terbatas'
                  : 'Limited availability'}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <Link
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3.5 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 motion-reduce:transition-none"
            href={targetHref}
          >
            {featuredEntry ? copy.bookService : copy.bookNow}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            className="inline-flex w-full items-center justify-center rounded-full border border-[color:var(--marketplace-line)] bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            href={professionalSectionRoute(pageData.professional.slug, 'services')}
          >
            {copy.servicesSection}
          </Link>
        </div>
      </div>
    </div>
  );
};

interface ProfessionalMarketplaceMobileStickyCtaProps {
  locale: string;
  pageData: ProfessionalPublicPageData;
}

export const ProfessionalMarketplaceMobileStickyCta = ({
  locale,
  pageData,
}: ProfessionalMarketplaceMobileStickyCtaProps) => {
  const copy = getProfessionalMarketplaceCopy(locale);
  const featuredEntry = pageData.featuredServices[0];

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[color:var(--marketplace-line)] bg-white/96 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_40px_rgba(15,23,42,0.12)] backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{copy.bookNow}</p>
          <p className="truncate text-sm font-bold text-slate-950">
            {featuredEntry ? featuredEntry.catalogService.name : pageData.professional.name}
          </p>
          {featuredEntry ? (
            <p className="text-xs text-slate-500">
              {copy.fromPrice} {featuredEntry.serviceMapping.price}
            </p>
          ) : null}
        </div>
        <Link
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-slate-950 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-800"
          href={professionalSectionRoute(pageData.professional.slug, 'services', {
            mode: featuredEntry?.serviceMapping.defaultMode,
            serviceId: featuredEntry?.serviceMapping.serviceId,
          })}
        >
          {copy.stickyBookLabel}
        </Link>
      </div>
    </div>
  );
};
