'use client';

import { InlineFeedbackNotice } from '@/components/ui/InlineFeedbackNotice';
import { ServiceDetailHeroSection } from '@/features/service-detail/components/ServiceDetailHeroSection';
import { ServiceDetailOverviewSection } from '@/features/service-detail/components/ServiceDetailOverviewSection';
import { ServiceDetailProvidersSection } from '@/features/service-detail/components/ServiceDetailProvidersSection';
import { useServiceDetail } from '@/features/service-detail/hooks/useServiceDetail';
import { usePathname, useRouter } from '@/i18n/routing';
import { APP_CONFIG } from '@/lib/config';
import { customerAccessRoute } from '@/lib/routes';
import { useViewerSession } from '@/lib/use-viewer-session';
import type { Area, Category, GlobalService, Professional } from '@/types/catalog';

export const ServiceDetailScreen = ({
  areas,
  categories,
  professionals,
  serviceId,
  services,
}: {
  areas: Area[];
  categories: Category[];
  professionals: Professional[];
  serviceId: string;
  services: GlobalService[];
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isCustomer } = useViewerSession();
  const { categoryName, notice, providers, requestBooking, service, setNotice } = useServiceDetail({
    areas,
    categories,
    professionals,
    serviceId,
    services,
  });

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
        <ServiceDetailProvidersSection
          onRequestBooking={(provider) => {
            if (!isCustomer) {
              router.push(customerAccessRoute({ intent: 'booking', next: pathname }));
              return;
            }

            const nextRoute = requestBooking(provider);

            if (nextRoute) {
              router.push(nextRoute);
            }
          }}
          providers={providers}
        />
      </div>
    </div>
  );
};
