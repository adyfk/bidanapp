import { ArrowRight, CheckCircle2, MapPin, MessageSquareQuote, ShieldCheck, Star } from 'lucide-react';
import Image from 'next/image';
import {
  ProfessionalMarketplaceBookingCallout,
  ProfessionalMarketplaceMobileStickyCta,
} from '@/features/professional-marketplace/components/ProfessionalMarketplaceBookingCallout';
import {
  getProfessionalMarketplaceCopy,
  type ProfessionalPublicPageData,
} from '@/features/professional-marketplace/lib/page-data';
import { Link } from '@/i18n/routing';
import { getEnabledServiceModes } from '@/lib/catalog-selectors';
import { professionalSectionRoute } from '@/lib/routes';

interface ProfessionalOverviewContentProps {
  locale: string;
  pageData: ProfessionalPublicPageData;
}

export const ProfessionalOverviewContent = ({ locale, pageData }: ProfessionalOverviewContentProps) => {
  const copy = getProfessionalMarketplaceCopy(locale);
  const trustSignals = [
    locale === 'id'
      ? 'Rating, rekomendasi, dan repeat client ditaruh di atas supaya trust terbaca dalam hitungan detik.'
      : 'Rating, recommendations, and repeat-client signals are surfaced first so trust reads in seconds.',
    locale === 'id'
      ? 'Layanan unggulan dipilih dari offering aktual profesional, bukan template generik.'
      : 'Featured services come from the professional’s actual offering, not a generic template.',
    locale === 'id'
      ? 'FAQ dan coverage membantu keluarga memahami kecocokan sebelum masuk ke flow booking.'
      : 'FAQ and coverage help families assess fit before entering the booking flow.',
  ];

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-[1.9rem] border border-[color:var(--marketplace-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,249,252,0.96)_100%)] p-6 shadow-[0_24px_50px_-40px_rgba(15,23,42,0.24)]">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[color:var(--marketplace-primary)]" />
                  <h2 className="text-xl font-black tracking-tight text-slate-950">{copy.trustSection}</h2>
                </div>
                <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[color:var(--marketplace-ink-muted)]">
                  {locale === 'id'
                    ? 'Overview ini merangkum alasan utama keluarga memilih profesional ini sebelum masuk lebih dalam ke tab layanan, review, dan tentang.'
                    : 'This overview condenses the main reasons families choose this professional before going deeper into services, reviews, and about.'}
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[1.35rem] border border-[color:var(--marketplace-line)] bg-white px-4 py-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {locale === 'id' ? 'Rating' : 'Rating'}
                    </p>
                    <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                      {pageData.professional.rating.toFixed(1)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{pageData.professional.reviews}</p>
                  </div>
                  <div className="rounded-[1.35rem] border border-[color:var(--marketplace-line)] bg-white px-4 py-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {locale === 'id' ? 'Rekomendasi' : 'Recommendations'}
                    </p>
                    <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                      {pageData.professional.feedbackSummary.recommendationRate}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {locale === 'id' ? 'dari feedback klien' : 'from client feedback'}
                    </p>
                  </div>
                  <div className="rounded-[1.35rem] border border-[color:var(--marketplace-line)] bg-white px-4 py-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {locale === 'id' ? 'Klien kembali' : 'Repeat clients'}
                    </p>
                    <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                      {pageData.professional.feedbackSummary.repeatClientRate}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {locale === 'id' ? 'indikasi retensi' : 'retention signal'}
                    </p>
                  </div>
                </div>
              </div>

              <aside className="rounded-[1.5rem] border border-[color:var(--marketplace-line)] bg-slate-950 p-5 text-white shadow-[0_26px_46px_-32px_rgba(15,23,42,0.72)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
                  {locale === 'id' ? 'Kenapa section ini penting' : 'Why this section matters'}
                </p>
                <div className="mt-4 space-y-3">
                  {trustSignals.map((signal) => (
                    <div
                      key={signal}
                      className="rounded-[1.1rem] border border-white/10 bg-white/5 px-4 py-4 text-sm leading-6 text-white/78"
                    >
                      {signal}
                    </div>
                  ))}
                </div>
              </aside>
            </div>

            {pageData.featuredMetrics.length > 0 ? (
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {pageData.featuredMetrics.map((metric) => (
                  <article
                    key={metric.label}
                    className="rounded-[1.35rem] border border-[color:var(--marketplace-line)] bg-white px-4 py-4 shadow-sm"
                  >
                    <p className="text-sm font-semibold text-slate-950">{metric.label}</p>
                    <p className="mt-2 text-xl font-black tracking-tight text-slate-950">{metric.value}</p>
                    <p className="mt-2 text-sm leading-7 text-[color:var(--marketplace-ink-muted)]">{metric.detail}</p>
                  </article>
                ))}
              </div>
            ) : null}
          </section>

          <section className="rounded-[1.9rem] border border-[color:var(--marketplace-line)] bg-white p-6 shadow-[0_24px_50px_-40px_rgba(15,23,42,0.24)]">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-[color:var(--marketplace-primary)]" />
                  <h2 className="text-xl font-black tracking-tight text-slate-950">{copy.featuredServices}</h2>
                </div>
                <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[color:var(--marketplace-ink-muted)]">
                  {locale === 'id'
                    ? 'Pilihannya dipersempit ke layanan yang paling sering dijadikan pintu masuk keluarga untuk konsultasi atau booking.'
                    : 'The assortment is narrowed down to services families most commonly use as their first consultation or booking entry point.'}
                </p>
              </div>
              <Link
                className="text-sm font-semibold text-[color:var(--marketplace-primary)] transition-colors hover:text-sky-800"
                href={professionalSectionRoute(pageData.professional.slug, 'services')}
              >
                {copy.servicesSection}
              </Link>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              {pageData.featuredServices.map((entry) => (
                <article
                  key={entry.serviceMapping.id}
                  className="overflow-hidden rounded-[1.6rem] border border-[color:var(--marketplace-line)] bg-[linear-gradient(180deg,#ffffff_0%,#f5f9fc_100%)] shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_28px_50px_-34px_rgba(15,23,42,0.26)] motion-reduce:transition-none"
                >
                  <div className="grid gap-0 md:grid-cols-[10rem_minmax(0,1fr)]">
                    <div className="relative h-44 md:h-full">
                      <Image
                        alt={entry.catalogService.name}
                        className="object-cover"
                        fill
                        sizes="(min-width: 768px) 160px, 100vw"
                        src={entry.catalogService.coverImage || entry.catalogService.image}
                      />
                    </div>
                    <div className="p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 shadow-sm">
                          {entry.catalogService.name}
                        </span>
                        {getEnabledServiceModes(entry.serviceMapping.serviceModes).map((mode) => (
                          <span
                            key={`${entry.serviceMapping.id}-${mode}`}
                            className="rounded-full border border-[color:var(--marketplace-line)] bg-white px-3 py-1 text-[11px] font-semibold text-slate-500"
                          >
                            {mode}
                          </span>
                        ))}
                      </div>
                      <p className="mt-4 text-[15px] leading-7 text-[color:var(--marketplace-ink-muted)]">
                        {entry.serviceMapping.summary || entry.catalogService.shortDescription}
                      </p>
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                            {copy.fromPrice}
                          </p>
                          <p className="mt-1 text-xl font-black tracking-tight text-slate-950">
                            {entry.serviceMapping.price}
                          </p>
                        </div>
                        <Link
                          className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 motion-reduce:transition-none"
                          href={professionalSectionRoute(pageData.professional.slug, 'services', {
                            mode: entry.serviceMapping.defaultMode,
                            serviceId: entry.serviceMapping.serviceId,
                          })}
                        >
                          {copy.bookService}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[1.9rem] border border-[color:var(--marketplace-line)] bg-white p-6 shadow-[0_24px_50px_-40px_rgba(15,23,42,0.24)]">
            <div className="grid gap-5 lg:grid-cols-[17rem_minmax(0,1fr)]">
              <div className="rounded-[1.6rem] border border-[color:var(--marketplace-line)] bg-[linear-gradient(180deg,rgba(224,242,254,0.8)_0%,rgba(255,255,255,1)_100%)] p-5">
                <div className="flex items-center gap-2">
                  <MessageSquareQuote className="h-5 w-5 text-[color:var(--marketplace-primary)]" />
                  <h2 className="text-xl font-black tracking-tight text-slate-950">{copy.reviewsSection}</h2>
                </div>
                <p className="mt-4 text-4xl font-black tracking-[-0.05em] text-slate-950">
                  {pageData.professional.rating.toFixed(1)}
                </p>
                <p className="mt-2 text-sm text-[color:var(--marketplace-ink-muted)]">
                  {pageData.professional.reviews}
                </p>
                <p className="mt-4 text-sm leading-7 text-[color:var(--marketplace-ink-muted)]">
                  {locale === 'id'
                    ? 'Social proof paling kuat diletakkan di overview, sedangkan breakdown lengkap tersedia di tab Review.'
                    : 'The strongest social proof stays on the overview, while the full breakdown lives on the Reviews tab.'}
                </p>
                <Link
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--marketplace-primary)] transition-colors hover:text-sky-800"
                  href={professionalSectionRoute(pageData.professional.slug, 'reviews')}
                >
                  {copy.reviewsNav}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {pageData.featuredTestimonials.map((testimonial) => (
                  <article
                    key={`${testimonial.author}-${testimonial.dateLabel}`}
                    className="rounded-[1.5rem] border border-[color:var(--marketplace-line)] bg-[color:var(--marketplace-surface-muted)] p-5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 overflow-hidden rounded-full bg-slate-200">
                        <Image
                          alt={testimonial.author}
                          className="object-cover"
                          fill
                          sizes="48px"
                          src={testimonial.image}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{testimonial.author}</p>
                        <p className="text-xs text-slate-500">{testimonial.role}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-amber-500">
                      <Star className="h-4 w-4 fill-current" />
                      {testimonial.rating.toFixed(1)}
                      <span className="text-slate-400">{testimonial.dateLabel}</span>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-[color:var(--marketplace-ink-muted)]">
                      {testimonial.quote}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-[1.9rem] border border-[color:var(--marketplace-line)] bg-white p-6 shadow-[0_24px_50px_-40px_rgba(15,23,42,0.24)]">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[color:var(--marketplace-primary)]" />
                  <h2 className="text-xl font-black tracking-tight text-slate-950">
                    {locale === 'id' ? 'Pertanyaan yang sering dibutuhkan keluarga' : 'Questions families usually ask'}
                  </h2>
                </div>
                <div className="mt-5 grid gap-4">
                  {pageData.faqEntries.map((entry) => (
                    <article
                      key={entry.question}
                      className="rounded-[1.5rem] border border-[color:var(--marketplace-line)] bg-[color:var(--marketplace-surface-muted)] p-5"
                    >
                      <h3 className="text-base font-bold text-slate-950">{entry.question}</h3>
                      <p className="mt-3 text-sm leading-7 text-[color:var(--marketplace-ink-muted)]">{entry.answer}</p>
                    </article>
                  ))}
                </div>
              </div>

              <aside className="rounded-[1.6rem] border border-[color:var(--marketplace-line)] bg-slate-950 p-5 text-white">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-sky-300" />
                  <h2 className="text-xl font-black tracking-tight">{copy.practiceSection}</h2>
                </div>
                <div className="mt-5 space-y-4">
                  <article className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                      {locale === 'id' ? 'Titik praktik' : 'Practice point'}
                    </p>
                    <h3 className="mt-2 text-lg font-bold">{pageData.practiceLocationLabel}</h3>
                    <p className="mt-3 text-sm leading-7 text-white/72">
                      {pageData.professional.practiceLocation?.address || pageData.professional.location}
                    </p>
                  </article>
                  <article className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
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
                        ? 'Detail radius home visit, portfolio, dan bukti operasional lengkap ada di tab Tentang.'
                        : 'The About tab contains the full home-visit radius, portfolio, and operational proof.'}
                    </p>
                  </article>
                </div>
              </aside>
            </div>
          </section>
        </div>

        <aside className="hidden lg:block">
          <ProfessionalMarketplaceBookingCallout locale={locale} pageData={pageData} />
        </aside>
      </div>

      <ProfessionalMarketplaceMobileStickyCta locale={locale} pageData={pageData} />
    </>
  );
};
