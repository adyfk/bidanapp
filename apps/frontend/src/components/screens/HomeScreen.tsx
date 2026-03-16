'use client';
import {
  Bell,
  Calendar,
  ChevronRight,
  Clock,
  MapPin,
  MessageSquare,
  Navigation,
  Search,
  UserRound,
} from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { IconButton } from '@/components/ui/IconButton';
import { ProfessionalCard } from '@/components/ui/ProfessionalCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { getAppointmentTabForStatus } from '@/features/appointments/lib/status';
import { Link, useRouter } from '@/i18n/routing';
import { APP_CONFIG } from '@/lib/config';
import { getEnabledServiceModes, getProfessionalCategoryLabel, MOCK_CATEGORIES } from '@/lib/mock-db/catalog';
import { ACTIVE_HOME_FEED, APP_SECTION_CONFIG } from '@/lib/mock-db/runtime';
import {
  APP_ROUTES,
  activityRoute,
  appointmentsRoute,
  customerAccessRoute,
  exploreRoute,
  professionalAccessRoute,
  professionalDashboardRoute,
  professionalRoute,
} from '@/lib/routes';
import { useUiText } from '@/lib/ui-text';
import { useProfessionalUserPreferences } from '@/lib/use-professional-user-preferences';
import { useViewerSession } from '@/lib/use-viewer-session';

export const HomeScreen = () => {
  const router = useRouter();
  const t = useTranslations('Home');
  const professionalT = useTranslations('Professional');
  const uiText = useUiText();
  const { isCustomer, isProfessional } = useViewerSession();
  const { isFavorite, selectedAreaId, toggleFavorite, userLocation } = useProfessionalUserPreferences();
  const featuredAppointmentCard = ACTIVE_HOME_FEED.featuredAppointment;
  const featuredProfessional = featuredAppointmentCard?.professional;
  const featuredAppointmentRoute = featuredAppointmentCard
    ? activityRoute(featuredAppointmentCard.appointment.id)
    : null;
  const featuredAppointmentsRoute = featuredAppointmentCard
    ? appointmentsRoute({
        tab: getAppointmentTabForStatus(featuredAppointmentCard.appointment.status),
        status: featuredAppointmentCard.appointment.status,
      })
    : APP_ROUTES.appointments;
  const customerActivityRoute = customerAccessRoute({ intent: 'activity', next: APP_ROUTES.appointments });
  const customerProfileRoute = customerAccessRoute({ intent: 'profile', next: APP_ROUTES.profile });
  const headerProfileRoute = isProfessional
    ? professionalDashboardRoute('overview')
    : isCustomer
      ? APP_ROUTES.profile
      : customerProfileRoute;
  const appointmentSectionRoute = isProfessional
    ? professionalDashboardRoute('requests')
    : isCustomer
      ? featuredAppointmentsRoute
      : customerActivityRoute;
  const homeCategories = (
    APP_SECTION_CONFIG.homeCategoryIds?.length
      ? APP_SECTION_CONFIG.homeCategoryIds
          .map((categoryId) => MOCK_CATEGORIES.find((category) => category.id === categoryId))
          .filter(Boolean)
      : MOCK_CATEGORIES
  ) as typeof MOCK_CATEGORIES;

  return (
    <div
      className="flex flex-col h-full relative pb-24 overflow-y-auto custom-scrollbar"
      style={{ backgroundColor: APP_CONFIG.colors.bgLight }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 pt-14 pb-6 sticky top-0 z-20"
        style={{ backgroundColor: APP_CONFIG.colors.bgLight }}
      >
        <button
          type="button"
          onClick={() => router.push(headerProfileRoute)}
          className="w-11 h-11 relative rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm hover:opacity-80 transition-opacity active:scale-95"
        >
          {isCustomer ? (
            <Image
              src={ACTIVE_HOME_FEED.currentUser.avatar}
              alt={ACTIVE_HOME_FEED.currentUser.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-white/70 text-gray-700">
              <UserRound className="h-5 w-5" />
            </div>
          )}
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[11px] text-gray-400 font-medium tracking-wide">{t('location')}</span>
          <div className="flex items-center text-gray-900 font-bold text-[14px]">
            <MapPin className="w-4 h-4 mr-1" style={{ color: APP_CONFIG.colors.primary }} />
            {ACTIVE_HOME_FEED.sharedContext.currentArea}
          </div>
        </div>
        <div className="relative">
          <IconButton icon={<Bell className="w-6 h-6 text-gray-800" />} />
          <span
            className="absolute top-2 right-2.5 w-2.5 h-2.5 rounded-full border-2"
            style={{ backgroundColor: APP_CONFIG.colors.danger, borderColor: APP_CONFIG.colors.bgLight }}
          ></span>
        </div>
      </div>

      {/* Search Bar - Global Services Entry Point */}
      <div className="px-6 mb-7">
        <Link
          href={APP_ROUTES.services}
          className="bg-white rounded-full flex items-center px-4 py-3.5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
        >
          <Search className="w-5 h-5 text-gray-400 mr-2" />
          <span className="text-sm text-gray-400 font-medium">
            {t('searchPlaceholder', {
              service: uiText.terms.service.toLowerCase(),
              category: uiText.terms.category.toLowerCase(),
            })}
          </span>
        </Link>
      </div>

      <div className="px-6 space-y-7">
        {/* Section: Appointment */}
        <div>
          <SectionHeader title={t('appointment')} onSeeAll={() => router.push(appointmentSectionRoute)} />
          {isProfessional ? (
            <div className="rounded-[28px] border border-blue-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="mb-2 text-[18px] font-bold text-gray-900">{t('professionalActivityTitle')}</h3>
              <p className="mb-5 text-[14px] leading-relaxed text-gray-500">{t('professionalActivityDescription')}</p>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => router.push(professionalDashboardRoute('requests'))}
                  className="w-full rounded-full bg-blue-600 py-3.5 text-[14px] font-bold text-white"
                >
                  {t('professionalActivityPrimaryCta')}
                </button>
                <button
                  type="button"
                  onClick={() => router.push(APP_ROUTES.explore)}
                  className="w-full rounded-full bg-gray-100 py-3.5 text-[14px] font-bold text-gray-700 transition-colors hover:bg-gray-200"
                >
                  {t('professionalActivitySecondaryCta')}
                </button>
              </div>
            </div>
          ) : !isCustomer ? (
            <div className="rounded-[28px] border border-rose-100 bg-white p-6 shadow-sm">
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ backgroundColor: APP_CONFIG.colors.primaryLight, color: APP_CONFIG.colors.primary }}
              >
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="mb-2 text-[18px] font-bold text-gray-900">{t('visitorActivityTitle')}</h3>
              <p className="mb-5 text-[14px] leading-relaxed text-gray-500">{t('visitorActivityDescription')}</p>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => router.push(customerActivityRoute)}
                  className="w-full rounded-full py-3.5 text-[14px] font-bold text-white"
                  style={{ backgroundColor: APP_CONFIG.colors.primary }}
                >
                  {t('visitorActivityPrimaryCta')}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    router.push(isProfessional ? professionalDashboardRoute('overview') : professionalAccessRoute())
                  }
                  className="w-full rounded-full bg-gray-100 py-3.5 text-[14px] font-bold text-gray-700 transition-colors hover:bg-gray-200"
                >
                  {t('visitorActivitySecondaryCta')}
                </button>
              </div>
            </div>
          ) : featuredAppointmentCard && featuredProfessional && featuredAppointmentRoute ? (
            <div
              onClick={() => router.push(featuredAppointmentRoute)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  router.push(featuredAppointmentRoute);
                }
              }}
              className="rounded-[28px] p-5 text-white relative shadow-[0_10px_30px_rgba(233,30,140,0.25)]"
              role="button"
              tabIndex={0}
              style={{
                background: `linear-gradient(135deg, ${APP_CONFIG.colors.primary} 0%, ${APP_CONFIG.colors.secondary} 100%)`,
              }}
            >
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex gap-4 items-center">
                  <div className="flex items-center text-[13px] font-medium bg-white/10 w-fit px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
                    <Calendar className="w-4 h-4 mr-2 opacity-80" />
                    {featuredAppointmentCard.dateLabel}
                  </div>
                  <div className="flex items-center text-[13px] ml-1 font-medium">
                    <Clock className="w-4 h-4 mr-2 opacity-80" />
                    {featuredAppointmentCard.timeLabel}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    router.push(featuredAppointmentRoute);
                  }}
                  className="bg-white p-2.5 rounded-full shadow-md hover:scale-105 transition-transform"
                  style={{ color: APP_CONFIG.colors.primary }}
                >
                  <Navigation className="w-4 h-4 rotate-45" />
                </button>
              </div>

              <div className="bg-white rounded-[20px] p-3 flex justify-between items-center text-gray-800 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 relative rounded-full overflow-hidden bg-gray-100">
                    <Image
                      src={featuredProfessional.image}
                      alt={featuredProfessional.name}
                      fill
                      className="object-cover object-top"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-[15px]">{featuredProfessional.name}</h3>
                    <p className="text-[12px] text-gray-500">
                      {getProfessionalCategoryLabel(featuredProfessional) || uiText.terms.professional}
                    </p>
                  </div>
                </div>
                <IconButton
                  ariaLabel="Open appointment detail"
                  icon={<MessageSquare className="w-5 h-5" />}
                  onClick={() => router.push(featuredAppointmentRoute)}
                />
              </div>
            </div>
          ) : (
            <div className="rounded-[28px] p-6 bg-white border border-gray-100 shadow-sm">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                style={{ backgroundColor: APP_CONFIG.colors.primaryLight, color: APP_CONFIG.colors.primary }}
              >
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-[18px] font-bold text-gray-900 mb-2">{uiText.homeEmptyStateTitle}</h3>
              <p className="text-[14px] text-gray-500 leading-relaxed mb-4">{uiText.homeEmptyStateDescription}</p>
              <button
                type="button"
                onClick={() => router.push(APP_ROUTES.services)}
                className="px-5 py-3 rounded-full text-white font-bold text-[14px]"
                style={{ backgroundColor: APP_CONFIG.colors.primary }}
              >
                {uiText.homeEmptyStateAction}
              </button>
            </div>
          )}
        </div>

        {/* Section: Popular Services */}
        <div>
          <SectionHeader
            title={t('popularServices', { service: uiText.terms.service })}
            onSeeAll={() => router.push(APP_ROUTES.services)}
          />
          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar -mx-6 px-6">
            {ACTIVE_HOME_FEED.popularServices.map((svc) => {
              const catName = MOCK_CATEGORIES.find((cat) => cat.id === svc.categoryId)?.name || '';
              const enabledModes = getEnabledServiceModes(svc.serviceModes);
              const targetRoute = exploreRoute({ category: svc.categoryId, q: svc.name });
              return (
                <div
                  key={svc.id}
                  className="relative overflow-hidden min-w-[200px] p-5 rounded-[24px] cursor-pointer group flex-shrink-0 border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all active:scale-[0.98]"
                  onClick={() => router.push(targetRoute)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      router.push(targetRoute);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  style={{ backgroundColor: APP_CONFIG.colors.bgLight }}
                >
                  <div className="absolute inset-0 bg-white z-0"></div>
                  {/* Decorative Background Element */}
                  <div
                    className="absolute -right-8 -top-8 w-28 h-28 rounded-full opacity-[0.08] transition-transform duration-500 group-hover:scale-[1.5]"
                    style={{ backgroundColor: APP_CONFIG.colors.primary }}
                  ></div>

                  <div className="relative z-10 flex flex-col h-full">
                    <div className="w-12 h-12 rounded-[14px] overflow-hidden mb-4 border border-white/50 shadow-sm relative">
                      <Image src={svc.image} alt={svc.name} fill className="object-cover" />
                    </div>
                    <h4 className="font-bold text-[15px] text-gray-900 leading-tight mb-2 pr-2">{svc.name}</h4>
                    <p className="text-[12px] text-gray-500 line-clamp-2 mb-3">{svc.shortDescription}</p>
                    <div className="mb-3 flex flex-wrap gap-2">
                      {enabledModes.map((mode) => (
                        <span
                          key={`${svc.id}-${mode}`}
                          className="rounded-full bg-gray-50 px-2.5 py-1 text-[10px] font-semibold text-gray-600"
                        >
                          {mode === 'online'
                            ? professionalT('modeOnline')
                            : mode === 'home_visit'
                              ? professionalT('modeHomeVisit')
                              : professionalT('modeOnsite')}
                        </span>
                      ))}
                    </div>

                    <div className="mt-auto pt-2 flex items-center justify-between text-[12px] font-medium text-gray-500">
                      <span>{catName}</span>
                      <span
                        className="flex items-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
                        style={{ color: APP_CONFIG.colors.primary }}
                      >
                        {t('explore')} <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section: Categories */}
        <div>
          <SectionHeader
            title={uiText.terms.category || t('categories')}
            onSeeAll={() => router.push(APP_ROUTES.explore)}
          />
          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar -mx-6 px-6">
            {homeCategories.map((cat) => (
              <div
                key={cat.id}
                className="flex flex-col items-center gap-2 cursor-pointer group flex-shrink-0 w-[84px]"
                onClick={() => router.push(exploreRoute({ category: cat.id }))}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    router.push(exploreRoute({ category: cat.id }));
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="w-[72px] h-[72px] rounded-[22px] shadow-sm overflow-hidden relative group-hover:scale-105 transition-all">
                  <Image src={cat.iconImage || cat.image} alt={cat.name} fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/10" />
                  <div className="absolute inset-x-0 bottom-0 px-2 py-1.5 text-white text-[11px] font-bold text-center leading-tight">
                    {cat.shortLabel}
                  </div>
                </div>
                <span
                  className="text-[11px] font-medium transition-colors text-center w-full leading-tight line-clamp-2"
                  style={{ color: APP_CONFIG.colors.textMuted }}
                >
                  {cat.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Section: Professionals Near You */}
        <div className="pb-4">
          <SectionHeader
            title={t('professionalsNearYou', { professional: uiText.terms.professional })}
            onSeeAll={() => router.push(APP_ROUTES.explore)}
          />
          <div className="space-y-4">
            {ACTIVE_HOME_FEED.nearbyProfessionals.map((prof) => (
              <ProfessionalCard
                key={prof.id}
                professional={prof}
                href={professionalRoute(prof.slug)}
                isFavorite={isFavorite(prof.id)}
                onToggleFavorite={toggleFavorite}
                selectedAreaId={selectedAreaId}
                userLocation={userLocation}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
