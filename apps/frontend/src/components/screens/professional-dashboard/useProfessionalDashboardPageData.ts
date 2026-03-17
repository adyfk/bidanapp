'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useProfessionalPortal } from '@/lib/use-professional-portal';
import { useViewerSession } from '@/lib/use-viewer-session';
import type { ServiceDeliveryMode } from '@/types/catalog';

export const useProfessionalDashboardPageData = () => {
  const t = useTranslations('ProfessionalPortal');
  const professionalT = useTranslations('Professional');
  const viewer = useViewerSession();
  const portal = useProfessionalPortal();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

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
    isPreliveProfessional: !portal.isPublishedProfessional,
    hasMounted,
    professionalT,
    t,
  };
};
