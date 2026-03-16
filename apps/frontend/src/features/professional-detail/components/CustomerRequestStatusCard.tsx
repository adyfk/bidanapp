'use client';

import { ArrowUpRight, ClipboardList, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PROFESSIONAL_REQUEST_STATUS_ORDER } from '@/features/professional-portal/lib/request-status';
import { getAreaById, getServiceById } from '@/lib/mock-db/catalog';
import type { ProfessionalManagedRequest } from '@/lib/use-professional-portal';

interface CustomerRequestStatusCardProps {
  professionalName: string;
  request: ProfessionalManagedRequest;
}

export const CustomerRequestStatusCard = ({ professionalName, request }: CustomerRequestStatusCardProps) => {
  const t = useTranslations('Professional');
  const portalT = useTranslations('ProfessionalPortal');
  const latestStatusEvidence = [...request.statusHistory].reverse().find((item) => item.status === request.status);

  return (
    <section className="rounded-[28px] border border-blue-100 bg-white/95 p-5 shadow-[0_20px_45px_-30px_rgba(37,99,235,0.35)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-500">
        {t('requestUpdates.eyebrow')}
      </p>
      <div className="mt-2 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[18px] font-bold leading-tight text-slate-900">
            {t('requestUpdates.title', { professional: professionalName })}
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-500">{t('requestUpdates.description')}</p>
        </div>
        <div className="rounded-full bg-blue-50 px-3 py-1.5 text-[12px] font-semibold text-blue-700">
          {portalT(`requests.status.${request.status}`)}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {PROFESSIONAL_REQUEST_STATUS_ORDER.map((status) => {
          const currentIndex = PROFESSIONAL_REQUEST_STATUS_ORDER.indexOf(request.status);
          const statusIndex = PROFESSIONAL_REQUEST_STATUS_ORDER.indexOf(status);
          const isCurrent = request.status === status;
          const isReached = statusIndex <= currentIndex;

          return (
            <span
              key={status}
              className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                isCurrent
                  ? 'bg-slate-900 text-white'
                  : isReached
                    ? 'bg-blue-50 text-blue-700'
                    : 'bg-slate-100 text-slate-400'
              }`}
            >
              {portalT(`requests.status.${status}`)}
            </span>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            <ClipboardList className="h-4 w-4" />
            <span>{t('requestUpdates.service')}</span>
          </div>
          <p className="mt-2 text-[14px] font-bold text-slate-900">
            {getServiceById(request.serviceId)?.name || request.serviceId}
          </p>
        </div>
        <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            <MapPin className="h-4 w-4" />
            <span>{t('requestUpdates.area')}</span>
          </div>
          <p className="mt-2 text-[14px] font-bold text-slate-900">
            {getAreaById(request.areaId)?.label || request.areaId}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
        <div className="flex flex-wrap items-center gap-3 text-[12px] text-slate-500">
          <span>
            {t('requestUpdates.requestedAt')}: {request.requestedAtLabel}
          </span>
          {latestStatusEvidence?.createdAtLabel ? (
            <span>
              {t('requestUpdates.updatedAt')}: {latestStatusEvidence.createdAtLabel}
            </span>
          ) : null}
        </div>
        <p className="mt-3 text-[14px] leading-relaxed text-slate-700">
          {latestStatusEvidence?.customerSummary ||
            (request.status === 'new' ? t('requestUpdates.submittedSummary') : t('requestUpdates.emptySummary'))}
        </p>
        {latestStatusEvidence?.evidenceUrl ? (
          <a
            href={latestStatusEvidence.evidenceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-[12px] font-semibold text-blue-700"
          >
            {t('requestUpdates.openEvidence')}
            <ArrowUpRight className="h-4 w-4" />
          </a>
        ) : null}
      </div>
    </section>
  );
};
