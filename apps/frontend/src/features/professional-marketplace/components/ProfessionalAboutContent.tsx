import { Activity, BadgeCheck, GalleryHorizontal, MapPin, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import {
  ProfessionalMarketplaceBookingCallout,
  ProfessionalMarketplaceMobileStickyCta,
} from '@/features/professional-marketplace/components/ProfessionalMarketplaceBookingCallout';
import {
  getProfessionalMarketplaceCopy,
  type ProfessionalPublicPageData,
} from '@/features/professional-marketplace/lib/page-data';

interface ProfessionalAboutContentProps {
  locale: string;
  pageData: ProfessionalPublicPageData;
}

export const ProfessionalAboutContent = ({ locale, pageData }: ProfessionalAboutContentProps) => {
  const copy = getProfessionalMarketplaceCopy(locale);

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <section className="rounded-[1.9rem] border border-[color:var(--marketplace-line)] bg-white p-6 shadow-[0_24px_50px_-40px_rgba(15,23,42,0.24)]">
            <div className="grid gap-5 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <article className="rounded-[1.6rem] border border-[color:var(--marketplace-line)] bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(245,249,252,0.95)_100%)] p-5">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-[color:var(--marketplace-primary)]" />
                  <h2 className="text-xl font-black tracking-tight text-slate-950">{copy.aboutSection}</h2>
                </div>
                <p className="mt-4 text-sm leading-8 text-[color:var(--marketplace-ink-muted)]">
                  {pageData.professional.about}
                </p>
                {pageData.professional.specialties.length > 0 ? (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {pageData.professional.specialties.map((specialty) => (
                      <span
                        key={specialty}
                        className="rounded-full border border-[color:var(--marketplace-line)] bg-white px-3 py-1.5 text-sm font-semibold text-[color:var(--marketplace-ink-muted)]"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
              <article className="rounded-[1.6rem] border border-[color:var(--marketplace-line)] bg-slate-950 p-5 text-white">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                  {locale === 'id' ? 'Bahasa & operasional' : 'Languages and operations'}
                </p>
                <div className="mt-4 space-y-4 text-sm">
                  <div className="rounded-[1.15rem] border border-white/10 bg-white/5 px-4 py-4">
                    <p className="font-semibold text-white">{copy.languagesLabel}</p>
                    <p className="mt-1 text-white/72">{pageData.professional.languages.join(' / ')}</p>
                  </div>
                  <div className="rounded-[1.15rem] border border-white/10 bg-white/5 px-4 py-4">
                    <p className="font-semibold text-white">{copy.responseTime}</p>
                    <p className="mt-1 text-white/72">{pageData.professional.responseTime}</p>
                  </div>
                  <div className="rounded-[1.15rem] border border-white/10 bg-white/5 px-4 py-4">
                    <p className="font-semibold text-white">{copy.availability}</p>
                    <p className="mt-1 text-white/72">
                      {pageData.professional.availability.isAvailable
                        ? locale === 'id'
                          ? 'Sedang menerima klien baru'
                          : 'Currently accepting new clients'
                        : locale === 'id'
                          ? 'Ketersediaan terbatas'
                          : 'Limited availability'}
                    </p>
                  </div>
                </div>
              </article>
            </div>
          </section>

          <section className="rounded-[1.9rem] border border-[color:var(--marketplace-line)] bg-white p-6 shadow-[0_24px_50px_-40px_rgba(15,23,42,0.24)]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[color:var(--marketplace-primary)]" />
              <h2 className="text-xl font-black tracking-tight text-slate-950">{copy.credentialsSection}</h2>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {pageData.professional.credentials.map((credential) => (
                <article
                  key={credential.title}
                  className="rounded-[1.5rem] border border-[color:var(--marketplace-line)] bg-[color:var(--marketplace-surface-muted)] p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-950">{credential.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">{credential.issuer}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-[color:var(--marketplace-primary)] shadow-sm">
                      {credential.year}
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-[color:var(--marketplace-ink-muted)]">{credential.note}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[1.9rem] border border-[color:var(--marketplace-line)] bg-white p-6 shadow-[0_24px_50px_-40px_rgba(15,23,42,0.24)]">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[color:var(--marketplace-primary)]" />
              <h2 className="text-xl font-black tracking-tight text-slate-950">{copy.practiceSection}</h2>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <article className="rounded-[1.5rem] border border-[color:var(--marketplace-line)] bg-[color:var(--marketplace-surface-muted)] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {locale === 'id' ? 'Praktik utama' : 'Primary practice'}
                </p>
                <h3 className="mt-2 text-lg font-bold text-slate-950">{pageData.practiceLocationLabel}</h3>
                <p className="mt-3 text-sm leading-7 text-[color:var(--marketplace-ink-muted)]">
                  {pageData.professional.practiceLocation?.address || pageData.professional.location}
                </p>
              </article>
              <article className="rounded-[1.5rem] border border-[color:var(--marketplace-line)] bg-slate-950 p-5 text-white">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                  {copy.coverageLabel}
                </p>
                <h3 className="mt-2 text-lg font-bold">
                  {pageData.coverageAreas.length > 0
                    ? pageData.coverageAreas.map((area) => area.label).join(' • ')
                    : pageData.practiceLocationLabel}
                </h3>
                <p className="mt-3 text-sm leading-7 text-white/72">
                  {locale === 'id'
                    ? `Radius home visit: ${pageData.professional.coverage.homeVisitRadiusKm} km`
                    : `Home-visit radius: ${pageData.professional.coverage.homeVisitRadiusKm} km`}
                </p>
              </article>
            </div>
          </section>

          {pageData.professional.portfolioEntries.length > 0 ? (
            <section className="rounded-[1.9rem] border border-[color:var(--marketplace-line)] bg-white p-6 shadow-[0_24px_50px_-40px_rgba(15,23,42,0.24)]">
              <div className="flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-[color:var(--marketplace-primary)]" />
                <h2 className="text-xl font-black tracking-tight text-slate-950">{copy.portfolioSection}</h2>
              </div>
              <div className="mt-5 grid gap-4">
                {pageData.professional.portfolioEntries.map((entry) => (
                  <article
                    key={entry.id}
                    className="overflow-hidden rounded-[1.6rem] border border-[color:var(--marketplace-line)] bg-[linear-gradient(180deg,#ffffff_0%,#f5f9fc_100%)] shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_28px_50px_-34px_rgba(15,23,42,0.24)] motion-reduce:transition-none"
                  >
                    <div className="relative h-56">
                      <Image
                        alt={entry.title}
                        className="object-cover"
                        fill
                        sizes="(min-width: 1024px) 720px, 100vw"
                        src={entry.image}
                      />
                    </div>
                    <div className="p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 shadow-sm">
                          {entry.periodLabel}
                        </span>
                        {entry.outcomes.slice(0, 2).map((outcome) => (
                          <span
                            key={outcome}
                            className="rounded-full border border-[color:var(--marketplace-line)] bg-white px-3 py-1 text-[11px] font-semibold text-slate-500"
                          >
                            {outcome}
                          </span>
                        ))}
                      </div>
                      <h3 className="mt-4 text-lg font-bold text-slate-950">{entry.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-[color:var(--marketplace-ink-muted)]">
                        {entry.summary}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {pageData.professional.gallery.length > 0 ? (
            <section className="rounded-[1.9rem] border border-[color:var(--marketplace-line)] bg-white p-6 shadow-[0_24px_50px_-40px_rgba(15,23,42,0.24)]">
              <div className="flex items-center gap-2">
                <GalleryHorizontal className="h-5 w-5 text-[color:var(--marketplace-primary)]" />
                <h2 className="text-xl font-black tracking-tight text-slate-950">
                  {locale === 'id' ? 'Galeri praktik' : 'Practice gallery'}
                </h2>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3">
                {pageData.professional.gallery.map((item, index) => (
                  <figure
                    key={item.id}
                    className={`relative overflow-hidden rounded-[1.5rem] border border-[color:var(--marketplace-line)] bg-slate-100 ${
                      index === 0 ? 'col-span-2 md:col-span-2' : ''
                    }`}
                  >
                    <div className={index === 0 ? 'relative h-72' : 'relative h-40'}>
                      <Image
                        alt={item.alt}
                        className="object-cover"
                        fill
                        sizes="(min-width: 1024px) 280px, 50vw"
                        src={item.image}
                      />
                    </div>
                    <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent px-4 py-3 text-sm font-semibold text-white">
                      {item.label}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          ) : null}

          {pageData.professional.activityStories.length > 0 ? (
            <section className="rounded-[1.9rem] border border-[color:var(--marketplace-line)] bg-white p-6 shadow-[0_24px_50px_-40px_rgba(15,23,42,0.24)]">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-[color:var(--marketplace-primary)]" />
                <h2 className="text-xl font-black tracking-tight text-slate-950">{copy.storiesSection}</h2>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {pageData.professional.activityStories.map((story) => (
                  <article
                    key={story.title}
                    className="rounded-[1.5rem] border border-[color:var(--marketplace-line)] bg-[color:var(--marketplace-surface-muted)] p-5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-[color:var(--marketplace-line)] bg-slate-200">
                        <Image alt={story.title} className="object-cover" fill sizes="64px" src={story.image} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-slate-950">{story.title}</h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {story.capturedAt} • {story.location}
                        </p>
                        <p className="mt-3 text-sm leading-7 text-[color:var(--marketplace-ink-muted)]">{story.note}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="hidden lg:block">
          <ProfessionalMarketplaceBookingCallout locale={locale} pageData={pageData} />
        </aside>
      </div>

      <ProfessionalMarketplaceMobileStickyCta locale={locale} pageData={pageData} />
    </>
  );
};
