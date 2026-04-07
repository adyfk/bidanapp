import { Clock3, Languages, MapPin, ShieldCheck, Sparkles, Star, Users } from 'lucide-react';
import Image from 'next/image';
import { ProfessionalMarketplaceStatusCard } from '@/features/professional-marketplace/components/ProfessionalMarketplaceStatusCard';
import { ProfessionalProfileActions } from '@/features/professional-marketplace/components/ProfessionalProfileActions';
import type { ProfessionalPublicPageData } from '@/features/professional-marketplace/lib/page-data';
import { getProfessionalMarketplaceCopy } from '@/features/professional-marketplace/lib/page-data';
import { Link } from '@/i18n/routing';
import { APP_ROUTES, type ProfessionalPublicSection, professionalSectionRoute } from '@/lib/routes';

interface ProfessionalMarketplaceShellProps {
  activeSection: ProfessionalPublicSection;
  children: React.ReactNode;
  locale: string;
  pageData: ProfessionalPublicPageData;
  stickyCta?: React.ReactNode;
}

const navItems: Array<{
  id: ProfessionalPublicSection;
  labelKey: keyof ReturnType<typeof getProfessionalMarketplaceCopy>;
}> = [
  { id: 'overview', labelKey: 'overviewNav' },
  { id: 'services', labelKey: 'servicesNav' },
  { id: 'reviews', labelKey: 'reviewsNav' },
  { id: 'about', labelKey: 'aboutNav' },
];

export const ProfessionalMarketplaceShell = ({
  activeSection,
  children,
  locale,
  pageData,
  stickyCta,
}: ProfessionalMarketplaceShellProps) => {
  const copy = getProfessionalMarketplaceCopy(locale);
  const { professional } = pageData;
  const featuredService = pageData.featuredServices[0];
  const heroStats = [
    {
      detail: professional.reviews,
      icon: Star,
      label: locale === 'id' ? 'Rating terverifikasi' : 'Verified rating',
      value: `${professional.rating.toFixed(1)} / 5`,
    },
    {
      detail: professional.experience,
      icon: Users,
      label: locale === 'id' ? 'Klien ditangani' : 'Clients served',
      value: professional.clientsServed,
    },
    {
      detail: professional.availability.isAvailable
        ? locale === 'id'
          ? 'Sedang menerima klien baru'
          : 'Accepting new clients'
        : locale === 'id'
          ? 'Slot terbatas'
          : 'Limited slots',
      icon: Clock3,
      label: copy.responseTime,
      value: professional.responseTime,
    },
  ];
  const trustNotes = [
    {
      icon: ShieldCheck,
      text:
        locale === 'id'
          ? 'Kredensial, ulasan, dan area layanan dipisahkan supaya keluarga lebih cepat menilai trust.'
          : 'Credentials, reviews, and coverage are separated so families can evaluate trust faster.',
    },
    {
      icon: Sparkles,
      text:
        locale === 'id'
          ? 'Flow booking dipusatkan di halaman layanan agar mode dan jadwal yang tampil selalu valid.'
          : 'Booking is centralized on the services page so surfaced modes and schedules stay valid.',
    },
    {
      icon: MapPin,
      text:
        locale === 'id'
          ? 'Titik praktik dan cakupan home visit ditampilkan sebagai bukti operasional, bukan klaim umum.'
          : 'Practice location and home-visit coverage are shown as operational proof, not generic claims.',
    },
  ];
  const specialtyPreview = professional.specialties.slice(0, 3);

  return (
    <>
      <div className="relative isolate overflow-hidden border-b border-[color:var(--marketplace-line)] bg-[linear-gradient(180deg,rgba(224,242,254,0.82)_0%,rgba(255,255,255,0.96)_42%,rgba(255,255,255,1)_100%)]">
        <div className="absolute inset-x-0 top-0 h-[28rem] overflow-hidden">
          <div className="absolute inset-0 bg-slate-950/58" />
          <Image
            alt={professional.name}
            className="object-cover object-center opacity-50"
            fill
            priority
            sizes="100vw"
            src={professional.coverImage || professional.image}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.3),transparent_28%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.22),transparent_26%),linear-gradient(180deg,rgba(15,23,42,0.12)_0%,rgba(15,23,42,0.74)_100%)]" />
        </div>
        <div className="absolute left-[8%] top-24 hidden h-40 w-40 rounded-full bg-white/10 blur-3xl xl:block" />
        <div className="absolute bottom-10 right-[12%] hidden h-44 w-44 rounded-full bg-sky-300/20 blur-3xl xl:block" />

        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8 lg:pb-12">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-white/78">
                <Link className="transition-colors hover:text-white" href={APP_ROUTES.home}>
                  {copy.breadcrumbHome}
                </Link>
                <span>/</span>
                <Link className="transition-colors hover:text-white" href={APP_ROUTES.explore}>
                  {copy.breadcrumbProfessionals}
                </Link>
                <span>/</span>
                <span className="font-semibold text-white">{professional.name}</span>
              </nav>

              <ProfessionalProfileActions
                locale={locale}
                professionalId={professional.id}
                professionalName={professional.name}
              />
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_22rem] xl:items-start">
              <section className="relative overflow-hidden rounded-[2rem] border border-white/35 bg-white/90 p-5 shadow-[0_36px_90px_-46px_rgba(15,23,42,0.5)] backdrop-blur-xl md:p-7">
                <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_65%)]" />
                <div className="relative flex flex-col gap-7">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-4 sm:gap-5">
                      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[1.75rem] border border-white/70 bg-slate-100 shadow-[0_16px_32px_-18px_rgba(15,23,42,0.38)] sm:h-28 sm:w-28">
                        <div className="absolute inset-0 z-10 bg-[linear-gradient(180deg,transparent_55%,rgba(15,23,42,0.16)_100%)]" />
                        <Image
                          alt={professional.name}
                          className="object-cover object-top"
                          fill
                          sizes="112px"
                          src={professional.image}
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[color:var(--marketplace-primary-soft)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[color:var(--marketplace-primary)]">
                            {pageData.proCategory}
                          </span>
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                            {professional.availability.isAvailable
                              ? locale === 'id'
                                ? 'Menerima klien baru'
                                : 'Accepting new clients'
                              : locale === 'id'
                                ? 'Jadwal terbatas'
                                : 'Limited schedule'}
                          </span>
                        </div>

                        <div>
                          <h1 className="max-w-[16ch] text-balance text-3xl font-black tracking-[-0.05em] text-slate-950 sm:text-4xl lg:text-[2.9rem]">
                            {professional.name}
                          </h1>
                          <p className="mt-2 text-base font-semibold text-[color:var(--marketplace-primary)] sm:text-lg">
                            {professional.title}
                          </p>
                          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[color:var(--marketplace-ink-muted)]">
                            {professional.about}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[color:var(--marketplace-ink-muted)]">
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-4 w-4 text-[color:var(--marketplace-primary)]" />
                            {pageData.practiceLocationLabel}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Languages className="h-4 w-4 text-[color:var(--marketplace-primary)]" />
                            {professional.languages.join(' / ')}
                          </span>
                        </div>

                        {specialtyPreview.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {specialtyPreview.map((specialty) => (
                              <span
                                key={specialty}
                                className="rounded-full border border-[color:var(--marketplace-line)] bg-white/90 px-3 py-1.5 text-[12px] font-semibold text-[color:var(--marketplace-ink-muted)] shadow-sm"
                              >
                                {specialty}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:w-[18rem] lg:grid-cols-1">
                      <div className="rounded-[1.5rem] border border-[color:var(--marketplace-line)] bg-[linear-gradient(180deg,#ffffff_0%,#f5f9fc_100%)] p-4 shadow-sm">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          {copy.fromPrice}
                        </p>
                        <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                          {pageData.minimumPriceLabel || 'By request'}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[color:var(--marketplace-ink-muted)]">
                          {featuredService
                            ? locale === 'id'
                              ? `Mulai dari ${featuredService.catalogService.name}.`
                              : `Starts with ${featuredService.catalogService.name}.`
                            : copy.bookingHelper}
                        </p>
                      </div>
                      <div className="rounded-[1.5rem] border border-[color:var(--marketplace-line)] bg-slate-950 p-4 text-white shadow-[0_24px_45px_-30px_rgba(15,23,42,0.7)]">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
                          {locale === 'id' ? 'Storefront summary' : 'Storefront summary'}
                        </p>
                        <p className="mt-2 text-lg font-black tracking-tight">
                          {pageData.coverageAreas.length > 0
                            ? locale === 'id'
                              ? `${pageData.coverageAreas.length} area layanan aktif`
                              : `${pageData.coverageAreas.length} active coverage areas`
                            : locale === 'id'
                              ? 'Coverage berbasis titik praktik'
                              : 'Practice-based coverage'}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-white/72">
                          {featuredService
                            ? `${copy.featuredServices}: ${featuredService.catalogService.name}`
                            : professional.title}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    {heroStats.map((item) => {
                      const Icon = item.icon;

                      return (
                        <article
                          key={item.label}
                          className="rounded-[1.4rem] border border-[color:var(--marketplace-line)] bg-white/90 px-4 py-4 shadow-sm"
                        >
                          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                            <Icon className="h-4 w-4 text-[color:var(--marketplace-primary)]" />
                            {item.label}
                          </p>
                          <p className="mt-3 text-xl font-black tracking-tight text-slate-950">{item.value}</p>
                          <p className="mt-2 text-sm text-[color:var(--marketplace-ink-muted)]">{item.detail}</p>
                        </article>
                      );
                    })}
                  </div>
                </div>
              </section>

              <aside className="grid gap-4">
                <div className="rounded-[1.8rem] border border-[color:var(--marketplace-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(240,249,255,0.96)_100%)] p-5 shadow-[0_24px_50px_-36px_rgba(14,165,233,0.38)] backdrop-blur">
                  <p className="inline-flex items-center gap-2 rounded-full bg-[color:var(--marketplace-primary-soft)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[color:var(--marketplace-primary)]">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {copy.trustSection}
                  </p>
                  <h2 className="mt-4 text-xl font-black tracking-tight text-slate-950">
                    {locale === 'id'
                      ? 'Halaman ini dirancang untuk keputusan cepat, bukan scroll panjang.'
                      : 'This storefront is built for confident decisions, not endless scrolling.'}
                  </h2>
                  <div className="mt-4 space-y-3">
                    {trustNotes.map((note) => {
                      const Icon = note.icon;

                      return (
                        <div
                          key={note.text}
                          className="flex items-start gap-3 rounded-[1.2rem] border border-[color:var(--marketplace-line)] bg-white/90 px-4 py-4 text-sm leading-6 text-[color:var(--marketplace-ink-muted)] shadow-sm"
                        >
                          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--marketplace-primary-soft)] text-[color:var(--marketplace-primary)]">
                            <Icon className="h-4 w-4" />
                          </span>
                          <span>{note.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-[1.8rem] border border-[color:var(--marketplace-line)] bg-white/92 p-5 shadow-[0_24px_50px_-40px_rgba(15,23,42,0.34)] backdrop-blur">
                  <p className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700">
                    <Sparkles className="h-3.5 w-3.5" />
                    {copy.bookNow}
                  </p>
                  <h2 className="mt-4 text-xl font-black tracking-tight text-slate-950">
                    {locale === 'id'
                      ? 'Booking rail tetap terlihat di semua section.'
                      : 'The booking rail stays visible across every section.'}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--marketplace-ink-muted)]">
                    {copy.bookingHelper}
                  </p>
                  <div className="mt-4 rounded-[1.35rem] border border-[color:var(--marketplace-line)] bg-[color:var(--marketplace-surface-muted)] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {copy.coverageLabel}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      {pageData.coverageAreas.length > 0
                        ? pageData.coverageAreas.map((area) => area.label).join(' • ')
                        : pageData.practiceLocationLabel}
                    </p>
                  </div>
                  {pageData.minimumPriceLabel ? (
                    <p className="mt-4 text-sm font-semibold text-slate-500">
                      {copy.fromPrice}{' '}
                      <span className="text-xl font-black tracking-tight text-slate-950">
                        {pageData.minimumPriceLabel}
                      </span>
                    </p>
                  ) : null}
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-30 border-b border-[color:var(--marketplace-line)] bg-white/78 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8 xl:flex-row xl:items-center xl:justify-between">
          <div className="hidden min-w-0 xl:block">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {locale === 'id' ? 'Professional storefront' : 'Professional storefront'}
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-950">{professional.name}</p>
          </div>
          <nav
            aria-label="Profile sections"
            className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {navItems.map((item) => {
              const isActive = item.id === activeSection;

              return (
                <Link
                  key={item.id}
                  aria-current={isActive ? 'page' : undefined}
                  className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-200 motion-reduce:transition-none ${
                    isActive
                      ? 'bg-slate-950 text-white shadow-[0_16px_30px_-22px_rgba(15,23,42,0.8)]'
                      : 'border border-transparent text-slate-600 hover:border-[color:var(--marketplace-line)] hover:bg-white hover:text-slate-950'
                  }`}
                  href={professionalSectionRoute(professional.slug, item.id)}
                >
                  {copy[item.labelKey]}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 pb-40 pt-8 sm:px-6 lg:px-8 lg:pb-24">
        <div className="space-y-6">
          <ProfessionalMarketplaceStatusCard areas={pageData.areas} professional={pageData.professional} />
          {children}
        </div>
      </main>

      {stickyCta}
    </>
  );
};
