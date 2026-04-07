import { BarChart3, MessageSquareQuote, Star } from 'lucide-react';
import Image from 'next/image';
import {
  ProfessionalMarketplaceBookingCallout,
  ProfessionalMarketplaceMobileStickyCta,
} from '@/features/professional-marketplace/components/ProfessionalMarketplaceBookingCallout';
import {
  getProfessionalMarketplaceCopy,
  type ProfessionalPublicPageData,
} from '@/features/professional-marketplace/lib/page-data';

interface ProfessionalReviewsContentProps {
  locale: string;
  pageData: ProfessionalPublicPageData;
}

export const ProfessionalReviewsContent = ({ locale, pageData }: ProfessionalReviewsContentProps) => {
  const copy = getProfessionalMarketplaceCopy(locale);

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <section className="rounded-[1.9rem] border border-[color:var(--marketplace-line)] bg-white p-6 shadow-[0_24px_50px_-40px_rgba(15,23,42,0.24)]">
            <div className="grid gap-5 lg:grid-cols-[17rem_minmax(0,1fr)]">
              <div className="rounded-[1.6rem] border border-[color:var(--marketplace-line)] bg-[linear-gradient(180deg,rgba(224,242,254,0.82)_0%,rgba(255,255,255,1)_100%)] p-5">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[color:var(--marketplace-primary)]" />
                  <h2 className="text-xl font-black tracking-tight text-slate-950">
                    {locale === 'id' ? 'Ringkasan rating dan feedback' : 'Ratings and feedback summary'}
                  </h2>
                </div>
                <p className="mt-4 text-5xl font-black tracking-[-0.05em] text-slate-950">
                  {pageData.professional.rating.toFixed(1)}
                </p>
                <p className="mt-2 text-sm text-[color:var(--marketplace-ink-muted)]">
                  {pageData.professional.reviews}
                </p>
                <div className="mt-5 grid gap-3">
                  <div className="rounded-[1.1rem] border border-[color:var(--marketplace-line)] bg-white px-4 py-4 shadow-sm">
                    <p className="text-sm font-semibold text-slate-950">
                      {pageData.professional.feedbackSummary.recommendationRate}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {locale === 'id' ? 'merekomendasikan' : 'would recommend'}
                    </p>
                  </div>
                  <div className="rounded-[1.1rem] border border-[color:var(--marketplace-line)] bg-white px-4 py-4 shadow-sm">
                    <p className="text-sm font-semibold text-slate-950">
                      {pageData.professional.feedbackSummary.repeatClientRate}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {locale === 'id' ? 'klien kembali' : 'repeat clients'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-[color:var(--marketplace-line)] bg-[color:var(--marketplace-surface-muted)] p-5">
                <h3 className="text-lg font-bold text-slate-950">
                  {locale === 'id' ? 'Breakdown feedback' : 'Feedback breakdown'}
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--marketplace-ink-muted)]">
                  {locale === 'id'
                    ? 'Sinyal kualitas ini membantu calon klien memahami aspek mana yang paling konsisten disebut dalam ulasan.'
                    : 'These quality signals help prospective clients see which aspects are consistently mentioned in reviews.'}
                </p>
                <div className="mt-5 space-y-4">
                  {pageData.professional.feedbackBreakdown.map((entry) => (
                    <div
                      key={entry.label}
                      className="rounded-[1.2rem] border border-[color:var(--marketplace-line)] bg-white px-4 py-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-semibold text-slate-700">{entry.label}</span>
                        <span className="text-slate-500">{entry.total}</span>
                      </div>
                      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,#0ea5e9_0%,#38bdf8_100%)]"
                          style={{ width: `${entry.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {pageData.professional.feedbackMetrics.length > 0 ? (
            <section className="rounded-[1.9rem] border border-[color:var(--marketplace-line)] bg-white p-6 shadow-[0_24px_50px_-40px_rgba(15,23,42,0.24)]">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-[color:var(--marketplace-primary)]" />
                <h2 className="text-xl font-black tracking-tight text-slate-950">
                  {locale === 'id' ? 'Sinyal kualitas yang sering dicari' : 'Quality signals clients keep checking'}
                </h2>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {pageData.professional.feedbackMetrics.map((metric) => (
                  <article
                    key={metric.label}
                    className="rounded-[1.5rem] border border-[color:var(--marketplace-line)] bg-[color:var(--marketplace-surface-muted)] p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_28px_50px_-34px_rgba(15,23,42,0.2)] motion-reduce:transition-none"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-bold text-slate-950">{metric.label}</h3>
                      <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-[color:var(--marketplace-primary)] shadow-sm">
                        {metric.value}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[color:var(--marketplace-ink-muted)]">{metric.detail}</p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-[1.9rem] border border-[color:var(--marketplace-line)] bg-white p-6 shadow-[0_24px_50px_-40px_rgba(15,23,42,0.24)]">
            <div className="flex items-center gap-2">
              <MessageSquareQuote className="h-5 w-5 text-[color:var(--marketplace-primary)]" />
              <h2 className="text-xl font-black tracking-tight text-slate-950">{copy.reviewsSection}</h2>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {pageData.professional.testimonials.map((testimonial) => (
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
                      <h3 className="text-sm font-semibold text-slate-950">{testimonial.author}</h3>
                      <p className="text-xs text-slate-500">{testimonial.role}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-sm font-semibold">
                    <span className="inline-flex items-center gap-1 text-amber-500">
                      <Star className="h-4 w-4 fill-current" />
                      {testimonial.rating.toFixed(1)}
                    </span>
                    <span className="text-slate-400">{testimonial.dateLabel}</span>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-[color:var(--marketplace-ink-muted)]">
                    {testimonial.quote}
                  </p>
                </article>
              ))}
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
