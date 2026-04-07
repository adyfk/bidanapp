'use client';

import { CalendarDays, Clock3, MapPin, Sparkles } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { InlineFeedbackNotice } from '@/components/ui/InlineFeedbackNotice';
import { ProfessionalServicesSection } from '@/features/professional-detail/components/ProfessionalServicesSection';
import { useProfessionalDetail } from '@/features/professional-detail/hooks/useProfessionalDetail';
import { usePathname, useRouter } from '@/i18n/routing';
import { customerAccessRoute } from '@/lib/routes';
import { useUiText } from '@/lib/ui-text';
import { useViewerSession } from '@/lib/use-viewer-session';
import type { Area, Category, GlobalService, Professional, ServiceDeliveryMode } from '@/types/catalog';

interface ProfessionalServicesExperienceProps {
  areas: Area[];
  categories: Category[];
  initialProfessional: Professional;
  professionalSlug: string;
  services: GlobalService[];
}

interface BookingSurfaceCardProps {
  canRequestBooking: boolean;
  compact?: boolean;
  ctaLabel: string;
  locale: string;
  notice: string | null;
  onDismissNotice: () => void;
  onRequestBooking: () => void;
  priceLabel: string | null;
  requiresOfflineScheduleSelection: boolean;
  selectedBookingMode: ServiceDeliveryMode | null;
  selectedScheduleDayLabel: string | null;
  selectedServiceLabel: string | null;
  selectedSummary: string | null;
  selectedTimeLabel: string | null;
}

interface MobileBookingBarProps {
  canRequestBooking: boolean;
  ctaLabel: string;
  locale: string;
  notice: string | null;
  onDismissNotice: () => void;
  onRequestBooking: () => void;
  priceLabel: string | null;
  selectedBookingMode: ServiceDeliveryMode | null;
  selectedScheduleDayLabel: string | null;
  selectedServiceLabel: string | null;
  selectedTimeLabel: string | null;
}

const getModeLabel = (locale: string, mode: ServiceDeliveryMode) => {
  if (locale === 'id') {
    if (mode === 'online') {
      return 'Online';
    }

    if (mode === 'home_visit') {
      return 'Home visit';
    }

    return 'Onsite';
  }

  if (mode === 'online') {
    return 'Online';
  }

  if (mode === 'home_visit') {
    return 'Home visit';
  }

  return 'Onsite';
};

const BookingSurfaceCard = ({
  canRequestBooking,
  compact = false,
  ctaLabel,
  locale,
  notice,
  onDismissNotice,
  onRequestBooking,
  priceLabel,
  requiresOfflineScheduleSelection,
  selectedBookingMode,
  selectedScheduleDayLabel,
  selectedServiceLabel,
  selectedSummary,
  selectedTimeLabel,
}: BookingSurfaceCardProps) => (
  <div
    className={`border border-[color:var(--marketplace-line)] bg-white shadow-[0_24px_50px_-38px_rgba(14,165,233,0.4)] ${
      compact ? 'rounded-[1.25rem] p-4' : 'rounded-[1.75rem] p-5'
    }`}
  >
    {notice ? (
      <div className="mb-4">
        <InlineFeedbackNotice message={notice} onDismiss={onDismissNotice} />
      </div>
    ) : null}

    <p className="inline-flex items-center gap-2 rounded-full bg-[color:var(--marketplace-primary-soft)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[color:var(--marketplace-primary)]">
      <Sparkles className="h-3.5 w-3.5" />
      {locale === 'id' ? 'Booking composer' : 'Booking composer'}
    </p>

    <div
      className={`mt-4 border border-[color:var(--marketplace-line)] bg-[color:var(--marketplace-surface-muted)] ${
        compact ? 'rounded-[1.25rem] p-3' : 'rounded-[1.5rem] p-4'
      }`}
    >
      <p className="text-sm font-semibold text-slate-500">{locale === 'id' ? 'Pilihan aktif' : 'Active selection'}</p>
      <h2 className={`mt-2 font-black tracking-tight text-slate-950 ${compact ? 'text-lg' : 'text-xl'}`}>
        {selectedServiceLabel || (locale === 'id' ? 'Pilih satu layanan dulu' : 'Choose a service first')}
      </h2>
      <p className={`mt-2 text-sm text-slate-600 ${compact ? 'leading-6' : 'leading-7'}`}>
        {selectedSummary ||
          (locale === 'id'
            ? 'Buka salah satu layanan di daftar kiri untuk memilih mode dan jadwal.'
            : 'Open one of the services on the left to choose a delivery mode and schedule.')}
      </p>

      <div className={`mt-4 text-sm text-slate-600 ${compact ? 'space-y-2' : 'space-y-3'}`}>
        <div className="flex items-center justify-between gap-3 rounded-[1rem] bg-white px-3 py-3 shadow-sm">
          <span className="font-semibold text-slate-500">{locale === 'id' ? 'Mode' : 'Mode'}</span>
          <span className="font-semibold text-slate-950">
            {selectedBookingMode
              ? getModeLabel(locale, selectedBookingMode)
              : locale === 'id'
                ? 'Belum dipilih'
                : 'Pending'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-[1rem] bg-white px-3 py-3 shadow-sm">
          <span className="font-semibold text-slate-500">{locale === 'id' ? 'Harga' : 'Price'}</span>
          <span className="font-semibold text-slate-950">{priceLabel || '-'}</span>
        </div>
        {compact && (selectedScheduleDayLabel || selectedTimeLabel) ? (
          <div className="rounded-[1rem] bg-white px-3 py-3 shadow-sm">
            <p className="font-semibold text-slate-500">{locale === 'id' ? 'Ringkasan jadwal' : 'Schedule summary'}</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">
              {[selectedScheduleDayLabel, selectedTimeLabel].filter(Boolean).join(' • ')}
            </p>
          </div>
        ) : null}
        {!compact ? (
          <div className="rounded-[1rem] bg-white px-3 py-3 shadow-sm">
            <p className="font-semibold text-slate-500">{locale === 'id' ? 'Jadwal' : 'Schedule'}</p>
            {requiresOfflineScheduleSelection ? (
              <div className="mt-2 space-y-2">
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <CalendarDays className="h-4 w-4 text-sky-600" />
                  {selectedScheduleDayLabel || (locale === 'id' ? 'Tanggal belum dipilih' : 'Date pending')}
                </p>
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <Clock3 className="h-4 w-4 text-sky-600" />
                  {selectedTimeLabel || (locale === 'id' ? 'Jam belum dipilih' : 'Time pending')}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm font-semibold text-slate-950">
                {selectedBookingMode === 'online'
                  ? locale === 'id'
                    ? 'Tidak perlu pilih slot offline'
                    : 'No offline slot required'
                  : locale === 'id'
                    ? 'Tentukan mode dulu'
                    : 'Choose a mode first'}
              </p>
            )}
          </div>
        ) : null}
      </div>
    </div>

    <button
      className={`inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 ${
        compact ? 'mt-4' : 'mt-5'
      }`}
      disabled={!canRequestBooking}
      type="button"
      onClick={onRequestBooking}
    >
      {ctaLabel}
    </button>
  </div>
);

const MobileBookingBar = ({
  canRequestBooking,
  ctaLabel,
  locale,
  notice,
  onDismissNotice,
  onRequestBooking,
  priceLabel,
  selectedBookingMode,
  selectedScheduleDayLabel,
  selectedServiceLabel,
  selectedTimeLabel,
}: MobileBookingBarProps) => {
  const summaryParts = [
    selectedBookingMode ? getModeLabel(locale, selectedBookingMode) : null,
    priceLabel,
    selectedScheduleDayLabel,
    selectedTimeLabel,
  ].filter(Boolean);

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[color:var(--marketplace-line)] bg-white/96 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_40px_rgba(15,23,42,0.12)] backdrop-blur lg:hidden">
      <div className="mx-auto max-w-7xl">
        {notice ? (
          <div className="mb-3">
            <InlineFeedbackNotice message={notice} onDismiss={onDismissNotice} />
          </div>
        ) : null}

        <div className="flex items-center gap-3 rounded-[1.4rem] border border-[color:var(--marketplace-line)] bg-white px-3 py-3 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.25)]">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--marketplace-primary)]">
              {locale === 'id' ? 'Booking composer' : 'Booking composer'}
            </p>
            <p className="mt-1 truncate text-sm font-bold text-slate-950">
              {selectedServiceLabel || (locale === 'id' ? 'Pilih layanan terlebih dulu' : 'Choose a service first')}
            </p>
            <p className="mt-1 truncate text-xs text-slate-500">
              {summaryParts.length > 0
                ? summaryParts.join(' • ')
                : locale === 'id'
                  ? 'Mode, harga, dan jadwal akan muncul di sini'
                  : 'Mode, price, and schedule will appear here'}
            </p>
          </div>

          <button
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-slate-950 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={!canRequestBooking}
            type="button"
            onClick={onRequestBooking}
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export const ProfessionalServicesExperience = ({
  areas,
  categories,
  initialProfessional,
  professionalSlug,
  services,
}: ProfessionalServicesExperienceProps) => {
  const locale = useLocale();
  const t = useTranslations('Professional');
  const uiText = useUiText();
  const router = useRouter();
  const pathname = usePathname();
  const { isCustomer } = useViewerSession();
  const {
    canRequestBooking,
    coverageStatus,
    notice,
    offeredServices,
    professional,
    requestBooking,
    requiresOfflineScheduleSelection,
    scheduleDaysByMode,
    selectedBookingMode,
    selectedScheduleDay,
    selectedScheduleDayId,
    selectedScheduleDays,
    selectedService,
    selectedServiceEntry,
    selectedTimeSlot,
    selectedTimeSlotId,
    setNotice,
    setSelectedBookingMode,
    setSelectedScheduleDayId,
    setSelectedService,
    setSelectedTimeSlotId,
  } = useProfessionalDetail({
    allowProfessionalPreview: false,
    areas,
    categories,
    initialProfessional,
    professionalSlug,
    services,
  });

  if (!professional) {
    return null;
  }

  const dateFormatter = new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
  });
  const selectedScheduleDayLabel = selectedScheduleDay
    ? dateFormatter.format(new Date(`${selectedScheduleDay.dateIso}T00:00:00`))
    : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-6">
        <section className="rounded-[1.9rem] border border-[color:var(--marketplace-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,249,252,0.96)_100%)] p-5 shadow-[0_24px_50px_-40px_rgba(15,23,42,0.24)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full bg-[color:var(--marketplace-primary-soft)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[color:var(--marketplace-primary)]">
                <Sparkles className="h-3.5 w-3.5" />
                {locale === 'id' ? 'Marketplace booking' : 'Marketplace booking'}
              </p>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                {locale === 'id'
                  ? 'Pilih layanan, atur mode, lalu lanjut booking'
                  : 'Choose a service, configure the mode, then continue to booking'}
              </h2>
              <p className="mt-3 text-[15px] leading-7 text-slate-600">
                {locale === 'id'
                  ? 'Halaman ini menjadi surface transaksi utama untuk profesional ini. Semua flow booking, mode layanan, dan jadwal yang valid dikumpulkan di sini.'
                  : 'This page is the main transactional surface for this professional. Booking flow, delivery mode, and valid scheduling logic are consolidated here.'}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 md:w-[18rem] md:grid-cols-1">
              <div className="rounded-[1.25rem] border border-[color:var(--marketplace-line)] bg-white px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {locale === 'id' ? 'Area praktik' : 'Practice'}
                </p>
                <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <MapPin className="h-4 w-4 text-[color:var(--marketplace-primary)]" />
                  {professional.practiceLocation?.label || professional.location}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-[color:var(--marketplace-line)] bg-white px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {locale === 'id' ? 'Status booking' : 'Booking status'}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {professional.availability.isAvailable
                    ? locale === 'id'
                      ? 'Menerima klien baru'
                      : 'Accepting new clients'
                    : locale === 'id'
                      ? 'Ketersediaan terbatas'
                      : 'Limited availability'}
                </p>
              </div>
            </div>
          </div>
        </section>

        <ProfessionalServicesSection
          availabilityRulesByMode={professional.availabilityRulesByMode}
          categories={categories}
          coverageStatus={coverageStatus}
          isProfessionalAvailable={professional.availability.isAvailable}
          offeredServices={offeredServices}
          onSelectBookingMode={setSelectedBookingMode}
          onSelectScheduleDay={setSelectedScheduleDayId}
          onSelectService={setSelectedService}
          onSelectTimeSlot={setSelectedTimeSlotId}
          profileCopy={uiText.professionalProfile}
          scheduleDaysByMode={scheduleDaysByMode}
          selectedBookingMode={selectedBookingMode}
          selectedScheduleDayId={selectedScheduleDayId}
          selectedScheduleDays={selectedScheduleDays}
          selectedService={selectedService}
          selectedServiceEntry={selectedServiceEntry}
          selectedTimeSlotId={selectedTimeSlotId}
        />
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <BookingSurfaceCard
            canRequestBooking={canRequestBooking}
            compact
            ctaLabel={t('makeAppointment')}
            locale={locale}
            notice={notice}
            onDismissNotice={() => setNotice(null)}
            onRequestBooking={() => {
              if (!isCustomer) {
                router.push(customerAccessRoute({ intent: 'booking', next: pathname }));
                return;
              }

              requestBooking();
            }}
            priceLabel={selectedServiceEntry?.serviceMapping.price || null}
            requiresOfflineScheduleSelection={requiresOfflineScheduleSelection}
            selectedBookingMode={selectedBookingMode}
            selectedScheduleDayLabel={selectedScheduleDayLabel}
            selectedServiceLabel={selectedServiceEntry?.catalogService.name || null}
            selectedSummary={
              selectedServiceEntry?.serviceMapping.summary ||
              selectedServiceEntry?.catalogService.shortDescription ||
              null
            }
            selectedTimeLabel={selectedTimeSlot?.label || null}
          />
        </div>
      </aside>

      <MobileBookingBar
        canRequestBooking={canRequestBooking}
        ctaLabel={t('makeAppointment')}
        locale={locale}
        notice={notice}
        onDismissNotice={() => setNotice(null)}
        onRequestBooking={() => {
          if (!isCustomer) {
            router.push(customerAccessRoute({ intent: 'booking', next: pathname }));
            return;
          }

          requestBooking();
        }}
        priceLabel={selectedServiceEntry?.serviceMapping.price || null}
        selectedBookingMode={selectedBookingMode}
        selectedScheduleDayLabel={selectedScheduleDayLabel}
        selectedServiceLabel={selectedServiceEntry?.catalogService.name || null}
        selectedTimeLabel={selectedTimeSlot?.label || null}
      />
    </div>
  );
};
