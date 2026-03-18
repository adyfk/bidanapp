'use client';

import { ClipboardList } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { surfaceCardPaddedClass } from '@/components/ui/tokens';
import { isProfessionalCloseAllowed } from '@/features/appointments/lib/cancellation';
import type { ProfessionalManagedRequest, ProfessionalRequestStatus } from '@/lib/use-professional-portal';
import type { ServiceDeliveryMode } from '@/types/catalog';
import { requestStatuses } from './helpers';
import { MiniStatCard, RequestCard, RequestFilterChip, SectionHeading } from './ProfessionalDashboardShared';
import type { RequestFilter } from './types';

interface ProfessionalDashboardRequestsTabProps {
  filteredRequests: ProfessionalManagedRequest[];
  getAreaLabel: (areaId: string) => string;
  getModeLabel: (mode: ServiceDeliveryMode) => string;
  getServiceLabel: (serviceId: string) => string;
  isPublishedProfessional: boolean;
  onCloseRequest: (requestId: string) => void;
  onChangeStatus: (requestId: string, status: ProfessionalRequestStatus) => void;
  requestFilter: RequestFilter;
  requestStatusCounts: Record<ProfessionalRequestStatus, number>;
  selectedRequestId?: string;
  setRequestFilter: (filter: RequestFilter) => void;
}

export const ProfessionalDashboardRequestsTab = ({
  filteredRequests,
  getAreaLabel,
  getModeLabel,
  getServiceLabel,
  isPublishedProfessional,
  onCloseRequest,
  onChangeStatus,
  requestFilter,
  requestStatusCounts,
  selectedRequestId,
  setRequestFilter,
}: ProfessionalDashboardRequestsTabProps) => {
  const t = useTranslations('ProfessionalPortal');
  const professionalT = useTranslations('Professional');
  const appointmentsT = useTranslations('Appointments');

  if (!isPublishedProfessional) {
    return (
      <section className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {requestStatuses.map((status) => (
            <MiniStatCard key={status} label={t(`requests.status.${status}`)} value="0" />
          ))}
        </div>

        <div className={surfaceCardPaddedClass}>
          <SectionHeading
            icon={<ClipboardList className="h-5 w-5" />}
            title={t('requests.preliveTitle')}
            description={t('requests.preliveDescription')}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {requestStatuses.map((status) => (
          <MiniStatCard
            key={status}
            label={t(`requests.status.${status}`)}
            value={String(requestStatusCounts[status])}
          />
        ))}
      </div>

      <div className={surfaceCardPaddedClass}>
        <SectionHeading
          icon={<ClipboardList className="h-5 w-5" />}
          title={t('requests.visibleCount', {
            count: filteredRequests.length,
            status: t(`requests.status.${requestFilter}`),
          })}
          description={t('requests.summaryDescription')}
        />

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 pr-4 custom-scrollbar">
          {requestStatuses.map((status) => (
            <RequestFilterChip
              key={status}
              isActive={requestFilter === status}
              label={t(`requests.status.${status}`)}
              onClick={() => setRequestFilter(status)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredRequests.length > 0 ? (
          filteredRequests.map((request) => (
            <RequestCard
              key={request.id}
              evidenceLabels={{
                customerSummary: t('requests.evidence.customerSummary'),
                empty: t('requests.evidence.empty'),
                historyEmpty: t('requests.evidence.historyEmpty'),
                internalNote: t('requests.evidence.internalNote'),
                link: t('requests.evidence.openLink'),
                timeline: t('requests.timelineTitle'),
                title: t('requests.evidence.title'),
                updatedAt: t('requests.evidence.updatedAt'),
              }}
              fieldLabels={{
                area: t('requests.fields.area'),
                budget: t('requests.fields.budget'),
                bookingFlow: t('services.fields.bookingFlow'),
                currentStatus: t('requests.fields.currentStatus'),
                customerStatus: t('requests.fields.customerStatus'),
                note: t('requests.fields.note'),
                requestedMode: t('requests.fields.requestedMode'),
                service: t('requests.fields.service'),
              }}
              closeActionLabel={
                isProfessionalCloseAllowed(request.customerStatus)
                  ? request.customerStatus === 'requested'
                    ? t('requests.declineAction')
                    : t('requests.cancelAction')
                  : undefined
              }
              customerStatusLabel={(status) => appointmentsT(`status.${status}`)}
              getAreaLabel={getAreaLabel}
              getBookingFlowLabel={(flow) =>
                flow === 'instant' ? professionalT('bookingFlowInstant') : professionalT('bookingFlowRequest')
              }
              getModeLabel={getModeLabel}
              getServiceLabel={getServiceLabel}
              htmlId={`professional-request-card-${request.id}`}
              isHighlighted={selectedRequestId === request.id}
              moveToLabel={t('requests.moveTo')}
              priorityLabel={t(`requests.priority.${request.priority}`)}
              request={request}
              requestStatuses={requestStatuses}
              statusLabel={(status) => t(`requests.status.${status}`)}
              updateActionLabel={(status) => t('requests.updateAction', { status: t(`requests.status.${status}`) })}
              onCloseRequest={
                isProfessionalCloseAllowed(request.customerStatus) ? () => onCloseRequest(request.id) : undefined
              }
              onChangeStatus={(status) => onChangeStatus(request.id, status)}
            />
          ))
        ) : (
          <div className={surfaceCardPaddedClass}>
            <SectionHeading
              icon={<ClipboardList className="h-5 w-5" />}
              title={t('requests.emptyTitle')}
              description={t('requests.emptyDescription')}
            />
          </div>
        )}
      </div>
    </section>
  );
};
