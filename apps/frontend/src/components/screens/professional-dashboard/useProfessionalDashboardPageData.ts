'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useProfessionalPortal } from '@/lib/use-professional-portal';
import { useViewerSession } from '@/lib/use-viewer-session';
import type { ServiceDeliveryMode } from '@/types/catalog';
import { getNextAvailableSchedule } from './helpers';
import type { ReadinessItem } from './types';

export const useProfessionalDashboardPageData = () => {
  const t = useTranslations('ProfessionalPortal');
  const professionalT = useTranslations('Professional');
  const viewer = useViewerSession();
  const portal = useProfessionalPortal();
  const [hasMounted, setHasMounted] = useState(false);
  const nextSchedule = portal.activeProfessional ? getNextAvailableSchedule(portal.activeProfessional) : null;

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const readinessItems: ReadinessItem[] = [
    {
      id: 'identity',
      label: t('readiness.identity'),
      value: portal.portalState.credentialNumber,
    },
    {
      id: 'practice',
      label: t('readiness.practice'),
      value: `${portal.portalState.practiceModes.length} ${t('readiness.practiceCount')}`,
    },
    {
      id: 'coverage',
      label: t('readiness.coverage'),
      value: `${portal.activeCoverageAreas.length} ${t('readiness.coverageCount')}`,
    },
    {
      id: 'services',
      label: t('readiness.services'),
      value: `${portal.activeServiceConfigurations.length} ${t('services.activeCount')}`,
    },
  ];
  const clampedCompletionScore = Math.max(0, Math.min(portal.profileCompletionScore, 100));
  const dashboardLocationLabel =
    portal.portalState.city.trim() ||
    portal.activeCoverageAreas[0]?.label ||
    portal.activeProfessional?.practiceLocation?.label ||
    portal.activeProfessional?.location ||
    '';
  const getModeLabel = (mode: ServiceDeliveryMode) =>
    mode === 'online'
      ? professionalT('modeOnline')
      : mode === 'home_visit'
        ? professionalT('modeHomeVisit')
        : professionalT('modeOnsite');

  return {
    ...portal,
    ...viewer,
    clampedCompletionScore,
    dashboardLocationLabel,
    getModeLabel,
    hasMounted,
    nextSchedule,
    professionalT,
    readinessItems,
    t,
  };
};
