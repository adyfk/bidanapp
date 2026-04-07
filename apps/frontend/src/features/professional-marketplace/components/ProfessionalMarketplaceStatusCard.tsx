'use client';

import { CustomerRequestStatusCard } from '@/features/professional-detail/components/CustomerRequestStatusCard';
import { useProfessionalPortal } from '@/lib/use-professional-portal';
import { useViewerSession } from '@/lib/use-viewer-session';
import type { Area, Professional } from '@/types/catalog';

interface ProfessionalMarketplaceStatusCardProps {
  areas: Area[];
  professional: Professional;
}

export const ProfessionalMarketplaceStatusCard = ({ areas, professional }: ProfessionalMarketplaceStatusCardProps) => {
  const { isCustomer } = useViewerSession();
  const { getCustomerRequestForProfessional } = useProfessionalPortal();

  if (!isCustomer) {
    return null;
  }

  const request = getCustomerRequestForProfessional(professional.id);

  if (!request) {
    return null;
  }

  return <CustomerRequestStatusCard areas={areas} professionalName={professional.name} request={request} />;
};
