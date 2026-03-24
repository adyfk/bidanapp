'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useProfessionalAuthSession } from '@/lib/use-professional-auth-session';
import { useProfessionalPortal } from '@/lib/use-professional-portal';
import type { ServiceDeliveryMode } from '@/types/catalog';

export const useProfessionalDashboardPageData = () => {
  const t = useTranslations('ProfessionalPortal');
  const professionalT = useTranslations('Professional');
  const professionalAuth = useProfessionalAuthSession();
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
    clampedCompletionScore,
    dashboardLocationLabel,
    getModeLabel,
    hasHydratedAuth: professionalAuth.hasHydrated,
    isProfessional: professionalAuth.isAuthenticated,
    isPreliveProfessional: !portal.isPublishedProfessional,
    hasMounted: hasMounted && professionalAuth.hasHydrated,
    professionalT,
    professionalSession: professionalAuth.session,
    t,
  };
};
