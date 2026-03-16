'use client';

import { ArrowRight, ChevronLeft, MapPin, ShieldCheck } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { ProfessionalAccessScreen } from '@/components/screens/ProfessionalAccessScreen';
import { ProfessionalPageSkeleton } from '@/components/screens/ProfessionalPageSkeleton';
import { AppAvatar } from '@/components/ui/AppAvatar';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useRouter } from '@/i18n/routing';
import { APP_CONFIG } from '@/lib/config';
import {
  getAreaById,
  getEnabledServiceModes,
  getProfessionalCategoryLabel,
  getProfessionalServiceModes,
} from '@/lib/mock-db/catalog';
import { APP_ROUTES, professionalRoute } from '@/lib/routes';
import { useProfessionalPortal } from '@/lib/use-professional-portal';
import { useViewerSession } from '@/lib/use-viewer-session';
import type { ServiceDeliveryMode } from '@/types/catalog';

type SetupErrorKey = 'coverageRequired' | 'practiceModesRequired' | 'yearsExperienceRequired' | null;

const practiceModeOrder: ServiceDeliveryMode[] = ['online', 'home_visit', 'onsite'];
const fieldClass =
  'w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-[14px] text-gray-800 outline-none transition-all focus:border-pink-300 focus:ring-2 focus:ring-pink-100';

const getLocalizedProfessionalTitle = (title: string, locale: string) => {
  if (!locale.startsWith('id')) {
    return title;
  }

  const replacements: Array<[string, string]> = [
    ['Professional Newborn Care', 'Perawatan Bayi Baru Lahir'],
    ['Professional Postpartum Recovery', 'Pemulihan Pascapersalinan'],
    ['Newborn', 'Bayi Baru Lahir'],
    ['Postpartum', 'Pascapersalinan'],
  ];

  return replacements.reduce((localizedTitle, [source, target]) => localizedTitle.replaceAll(source, target), title);
};

export const ProfessionalSetupScreen = () => {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('ProfessionalSetup');
  const professionalT = useTranslations('Professional');
  const { isProfessional } = useViewerSession();
  const { activeCoverageAreas, activeProfessional, portalState, profileCompletionScore, completeProfessionalSetup } =
    useProfessionalPortal();
  const [errorKey, setErrorKey] = useState<SetupErrorKey>(null);
  const [yearsExperience, setYearsExperience] = useState(portalState.yearsExperience);
  const [selectedCoverageAreaIds, setSelectedCoverageAreaIds] = useState(
    portalState.coverageAreaIds.length > 0
      ? portalState.coverageAreaIds
      : activeProfessional?.coverage.areaIds.slice(0, 3) || [],
  );
  const [selectedPracticeModes, setSelectedPracticeModes] = useState<ServiceDeliveryMode[]>(
    portalState.practiceModes.length > 0
      ? portalState.practiceModes
      : activeProfessional
        ? getEnabledServiceModes(getProfessionalServiceModes(activeProfessional))
        : [],
  );
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <ProfessionalPageSkeleton />;
  }

  if (!isProfessional || !activeProfessional) {
    return <ProfessionalAccessScreen defaultTab="register" />;
  }

  const recommendedCoverageAreas = activeProfessional.coverage.areaIds
    .map((areaId) => getAreaById(areaId))
    .filter((area): area is NonNullable<ReturnType<typeof getAreaById>> => Boolean(area));
  const availablePracticeModes = getEnabledServiceModes(getProfessionalServiceModes(activeProfessional));
  const professionalTitle = getLocalizedProfessionalTitle(
    getProfessionalCategoryLabel(activeProfessional) || activeProfessional.title,
    locale,
  );

  const togglePracticeMode = (mode: ServiceDeliveryMode) => {
    setSelectedPracticeModes((currentModes) =>
      currentModes.includes(mode)
        ? currentModes.filter((currentMode) => currentMode !== mode)
        : [...currentModes, mode],
    );
  };

  const toggleCoverageArea = (areaId: string) => {
    setSelectedCoverageAreaIds((currentAreaIds) =>
      currentAreaIds.includes(areaId)
        ? currentAreaIds.filter((currentAreaId) => currentAreaId !== areaId)
        : [...currentAreaIds, areaId],
    );
  };

  const handleCompleteSetup = () => {
    if (!yearsExperience.trim()) {
      setErrorKey('yearsExperienceRequired');
      return;
    }

    if (selectedPracticeModes.length === 0) {
      setErrorKey('practiceModesRequired');
      return;
    }

    if (selectedCoverageAreaIds.length === 0) {
      setErrorKey('coverageRequired');
      return;
    }

    setErrorKey(null);
    completeProfessionalSetup({
      coverageAreaIds: selectedCoverageAreaIds,
      practiceModes: selectedPracticeModes,
      yearsExperience: yearsExperience.trim(),
    });
    router.push(APP_ROUTES.professionalDashboard);
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-gray-50 pb-10 custom-scrollbar">
      <div className="sticky top-0 z-20 border-b border-gray-100 bg-white px-4 pb-4 pt-14 shadow-sm">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.push(APP_ROUTES.professionalAccess)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <p className="flex-1 text-center text-[15px] font-bold text-gray-900">{t('navTitle')}</p>
          <LanguageSwitcher variant="light" />
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl space-y-5 px-4 py-5 sm:px-5">
        <section className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <AppAvatar
              name={activeProfessional.name}
              src={activeProfessional.image}
              className="h-16 w-16 flex-shrink-0 rounded-full border-2 border-white shadow-sm"
              fallbackClassName="text-[18px] font-bold"
            />

            <div className="min-w-0 flex-1">
              <span className="rounded-full bg-pink-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-pink-600">
                {t('eyebrow')}
              </span>
              <h1 className="mt-3 text-[24px] font-bold leading-tight text-gray-900">{t('title')}</h1>
              <p className="mt-1 text-[13px] text-gray-500">{professionalTitle}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <HeroPill label={t('identityLabel')} value={portalState.displayName || activeProfessional.name} />
            <HeroPill label={t('completionLabel')} value={`${profileCompletionScore}%`} />
            <HeroPill label={t('practiceModesLabel')} value={`${selectedPracticeModes.length}`} />
            <HeroPill label={t('coverageLabel')} value={`${selectedCoverageAreaIds.length}`} />
          </div>
        </section>

        {errorKey ? (
          <div className="rounded-[18px] border border-red-100 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600">
            {t(`errors.${errorKey}`)}
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="space-y-4">
            <section className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                {t('identityLabel')}
              </p>
              <h2 className="mt-3 text-[20px] font-bold text-gray-900">
                {portalState.displayName || activeProfessional.name}
              </h2>
              <p className="mt-1 text-[13px] text-gray-500">{professionalTitle}</p>

              <div className="mt-4 grid gap-2.5">
                <ChecklistRow title={t('identityRows.phone')} value={portalState.phone} />
                <ChecklistRow title={t('identityRows.city')} value={portalState.city} />
                <ChecklistRow title={t('identityRows.credential')} value={portalState.credentialNumber} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => router.push(professionalRoute(activeProfessional.slug))}
                  className="inline-flex items-center gap-2 rounded-full bg-pink-50 px-4 py-2.5 text-[13px] font-bold text-pink-600"
                >
                  <ShieldCheck className="h-4 w-4" />
                  {t('actions.viewPublicProfile')}
                </button>
                <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2.5 text-[12px] font-semibold text-gray-600">
                  {activeCoverageAreas.length > 0 ? activeCoverageAreas[0]?.city : portalState.city}
                </span>
              </div>
            </section>

            <section className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                {t('experienceLabel')}
              </p>
              <div className="mt-4">
                <label
                  htmlFor="professional-years-experience"
                  className="mb-2 block text-[12px] font-semibold text-gray-500"
                >
                  {t('fields.yearsExperience')}
                </label>
                <input
                  id="professional-years-experience"
                  type="text"
                  value={yearsExperience}
                  onChange={(event) => setYearsExperience(event.target.value)}
                  placeholder={t('placeholders.yearsExperience')}
                  className={fieldClass}
                />
              </div>
            </section>
          </div>

          <div className="space-y-4">
            <section className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                <ShieldCheck className="h-4 w-4" />
                {t('practiceModesLabel')}
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{t('practiceModeHints.online')}</p>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {practiceModeOrder
                  .filter((mode) => availablePracticeModes.includes(mode))
                  .map((mode) => {
                    const isSelected = selectedPracticeModes.includes(mode);
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => togglePracticeMode(mode)}
                        className={`rounded-[18px] border px-4 py-4 text-left transition-all ${
                          isSelected
                            ? 'border-pink-200 bg-pink-50 shadow-sm'
                            : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        <p className="text-[13px] font-bold text-gray-900">
                          {mode === 'online'
                            ? professionalT('modeOnline')
                            : mode === 'home_visit'
                              ? professionalT('modeHomeVisit')
                              : professionalT('modeOnsite')}
                        </p>
                        <p className="mt-1 text-[12px] leading-relaxed text-gray-500">
                          {t(`practiceModeHints.${mode}`)}
                        </p>
                      </button>
                    );
                  })}
              </div>
            </section>

            <section className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                <MapPin className="h-4 w-4" />
                {t('coverageLabel')}
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{t('coverageHint')}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {recommendedCoverageAreas.map((area) => {
                  const isSelected = selectedCoverageAreaIds.includes(area.id);
                  return (
                    <button
                      key={area.id}
                      type="button"
                      onClick={() => toggleCoverageArea(area.id)}
                      className={`rounded-full border px-4 py-2.5 text-[13px] font-semibold transition-all ${
                        isSelected
                          ? 'border-pink-200 bg-pink-50 text-pink-600'
                          : 'border-gray-200 bg-white text-gray-600'
                      }`}
                    >
                      {area.label}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div>
                  <p className="text-[15px] font-bold text-gray-900">{t('actions.complete')}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-gray-500">
                    {t('selectionSummary', {
                      areaCount: selectedCoverageAreaIds.length,
                      modeCount: selectedPracticeModes.length,
                    })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCompleteSetup}
                  className="flex w-full items-center justify-center gap-2 rounded-full px-5 py-4 text-[14px] font-bold text-white shadow-lg shadow-pink-500/20 transition-transform active:scale-[0.99] lg:w-auto"
                  style={{ backgroundColor: APP_CONFIG.colors.primary }}
                >
                  {t('actions.complete')}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChecklistRow = ({ title, value }: { title: string; value: string }) => (
  <div className="flex items-center justify-between rounded-[18px] bg-gray-50 px-4 py-3">
    <p className="text-[13px] font-medium text-gray-500">{title}</p>
    <p className="text-[13px] font-bold text-gray-900">{value}</p>
  </div>
);

const HeroPill = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="rounded-[20px] border border-gray-200 bg-gray-50 px-4 py-3">
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">{label}</p>
    <p className="mt-2 text-[15px] font-bold text-gray-900">{value}</p>
  </div>
);
