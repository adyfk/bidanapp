'use client';

import { InlineFeedbackNotice } from '@/components/ui/InlineFeedbackNotice';
import { ServiceDetailHeroSection } from '@/features/service-detail/components/ServiceDetailHeroSection';
import { ServiceDetailOverviewSection } from '@/features/service-detail/components/ServiceDetailOverviewSection';
import { ServiceDetailProvidersSection } from '@/features/service-detail/components/ServiceDetailProvidersSection';
import { useServiceDetail } from '@/features/service-detail/hooks/useServiceDetail';
import { useRouter } from '@/i18n/routing';
import { APP_CONFIG } from '@/lib/config';

export const ServiceDetailScreen = ({ serviceId }: { serviceId: string }) => {
  const router = useRouter();
  const { categoryName, notice, providers, requestBooking, service, setNotice } = useServiceDetail(serviceId);

  if (!service) {
    return null;
  }

  return (
    <div
      className="relative flex h-full flex-col overflow-y-auto pb-10 custom-scrollbar"
      style={{ backgroundColor: APP_CONFIG.colors.bgLight }}
    >
      <ServiceDetailHeroSection categoryName={categoryName} onBack={() => router.back()} service={service} />

      <div className="space-y-8 px-6 py-6">
        {notice ? <InlineFeedbackNotice message={notice} onDismiss={() => setNotice(null)} /> : null}
        <ServiceDetailOverviewSection service={service} />
        <ServiceDetailProvidersSection onRequestBooking={requestBooking} providers={providers} />
      </div>
    </div>
  );
};
