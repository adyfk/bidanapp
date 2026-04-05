'use client';

import { ArrowRight, BadgeCheck, ClipboardList, MapPin, Star, Wallet, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { standardFieldLabelClass } from '@/components/ui/form-styles';
import {
  blushPanelClass,
  filterChipClass,
  insetSurfaceClass,
  neutralSoftPillClass,
  segmentedButtonClass,
  softMetricTileClass,
  softWhitePanelClass,
  surfaceCardPaddedClass,
} from '@/components/ui/tokens';
import { getNextProfessionalRequestStatus } from '@/features/professional-portal/lib/request-status';
import type { ProfessionalManagedRequest, ProfessionalRequestStatus } from '@/lib/use-professional-portal';

export const DashboardDialog = ({
  badges,
  children,
  closeLabel,
  description,
  eyebrow,
  footer,
  onClose,
  title,
}: {
  badges?: ReactNode;
  children: ReactNode;
  closeLabel: string;
  description?: string;
  eyebrow: string;
  footer?: ReactNode;
  onClose: () => void;
  title: string;
}) => {
  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center p-2">
      <button
        type="button"
        aria-label={closeLabel}
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 pointer-events-auto bg-slate-950/55 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="pointer-events-auto relative z-10 flex max-h-[94vh] w-full max-w-md flex-col overflow-hidden rounded-[32px] border border-pink-100/80 bg-[linear-gradient(180deg,#FFF9FC_0%,#FFFFFF_100%)] shadow-[0_32px_100px_-32px_rgba(15,23,42,0.45)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-pink-100/80 px-5 py-5">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-400">{eyebrow}</p>
            <h2 className="mt-2 text-[20px] font-bold leading-tight text-slate-900">{title}</h2>
            {description ? (
              <p className="mt-2 max-w-[42rem] text-[13px] leading-relaxed text-slate-500">{description}</p>
            ) : null}
          </div>

          <div className="flex items-start gap-2">
            {badges ? <div className="flex flex-wrap justify-end gap-2">{badges}</div> : null}
            <button
              type="button"
              aria-label={closeLabel}
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-5 py-5">{children}</div>

        {footer ? (
          <div className="border-t border-pink-100/80 bg-white px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
};

export const SectionHeading = ({
  action,
  description,
  eyebrow,
  icon,
  title,
}: {
  action?: ReactNode;
  description?: string;
  eyebrow?: string;
  icon?: ReactNode;
  title: string;
}) => (
  <div className="flex items-start justify-between gap-3">
    <div className="flex min-w-0 items-start gap-3">
      {icon ? (
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[16px] border border-pink-100/70 bg-white text-pink-500 shadow-[0_10px_26px_-22px_rgba(17,24,39,0.35)]">
          {icon}
        </div>
      ) : null}
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-400">{eyebrow}</p>
        ) : null}
        <h2 className={`${eyebrow ? 'mt-1' : ''} text-[18px] font-bold leading-tight text-slate-900`}>{title}</h2>
        {description ? <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{description}</p> : null}
      </div>
    </div>
    {action ? <div className="flex-shrink-0">{action}</div> : null}
  </div>
);

export const StackedSectionHeading = ({
  action,
  description,
  eyebrow,
  icon,
  title,
}: {
  action?: ReactNode;
  description?: string;
  eyebrow?: string;
  icon?: ReactNode;
  title: string;
}) => (
  <div className="space-y-4">
    <SectionHeading description={description} eyebrow={eyebrow} icon={icon} title={title} />
    {action ? <div>{action}</div> : null}
  </div>
);

export const DashboardHeroPanel = ({
  action,
  children,
  description,
  eyebrow,
  icon,
  title,
}: {
  action?: ReactNode;
  children?: ReactNode;
  description?: string;
  eyebrow?: string;
  icon?: ReactNode;
  title: string;
}) => (
  <div className={`${blushPanelClass} space-y-4 p-4`}>
    <StackedSectionHeading action={action} description={description} eyebrow={eyebrow} icon={icon} title={title} />
    {children ? <div className="space-y-4">{children}</div> : null}
  </div>
);

export const MiniStatCard = ({ label, value }: { label: string; value: string }) => (
  <div className={`${softMetricTileClass} flex min-h-[80px] flex-col justify-between`}>
    <p className="text-[12px] text-slate-500">{label}</p>
    <p className="mt-3 break-words text-[17px] font-bold leading-tight text-slate-900">{value}</p>
  </div>
);

export const ServiceMetaChip = ({ label, value }: { label: string; value: string }) => (
  <div className={`${neutralSoftPillClass} max-w-full`}>
    <span className="text-[11px] font-medium text-slate-500">{label}</span>
    <span className="truncate text-[12px] font-bold text-slate-900">{value}</span>
  </div>
);

export const ServiceMetricTile = ({ label, value }: { label: string; value: string }) => (
  <div className={`${softMetricTileClass} px-3.5 py-3`}>
    <p className="text-[11px] font-medium text-slate-500">{label}</p>
    <p className="mt-2 text-[14px] font-bold leading-snug text-slate-900">{value}</p>
  </div>
);

export const ServiceModeBadge = ({
  isActive,
  isDefault,
  label,
}: {
  isActive: boolean;
  isDefault: boolean;
  label: string;
}) => (
  <span
    className={`inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-semibold ${
      isActive ? 'border-pink-100 bg-pink-50 text-pink-600' : 'border-slate-200 bg-white text-slate-400'
    }`}
  >
    <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-current opacity-80' : 'bg-slate-300'}`} />
    <span className="whitespace-normal leading-5">{label}</span>
    {isDefault && isActive ? <Star className="h-3 w-3" /> : null}
  </span>
);

export const SwitchStatusRow = ({
  checked,
  description,
  label,
  offLabel,
  onLabel,
}: {
  checked: boolean;
  description: string;
  label: string;
  offLabel: string;
  onLabel: string;
}) => (
  <div className={`${softWhitePanelClass} px-4 py-3`}>
    <div className="flex items-start justify-between gap-4">
      <div className="pr-4">
        <p className="text-[14px] font-bold text-slate-900">{label}</p>
        <p className="mt-1 text-[12px] leading-relaxed text-slate-500">{description}</p>
      </div>
      <span
        className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${
          checked ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
        }`}
      >
        {checked ? onLabel : offLabel}
      </span>
    </div>
  </div>
);

export const ChecklistRow = ({ title, value }: { title: string; value: string }) => (
  <div className={`${softWhitePanelClass} flex min-h-[128px] flex-col justify-between px-4 py-4`}>
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <BadgeCheck className="h-4 w-4" />
      </div>
      <p className="text-[13px] font-semibold leading-snug text-slate-700">{title}</p>
    </div>
    <p className="text-[16px] font-bold leading-snug text-slate-900">{value}</p>
  </div>
);

export const RequestFilterChip = ({
  isActive,
  label,
  onClick,
}: {
  isActive: boolean;
  label: string;
  onClick: () => void;
}) => (
  <button type="button" onClick={onClick} className={`${filterChipClass(isActive)} whitespace-nowrap`}>
    {label}
  </button>
);

export const RequestCard = ({
  closeActionLabel,
  customerStatusLabel,
  evidenceLabels,
  fieldLabels,
  getAreaLabel,
  getBookingFlowLabel,
  getModeLabel,
  getServiceLabel,
  htmlId,
  isHighlighted,
  moveToLabel,
  homeVisitTravel,
  onCloseRequest,
  onChangeStatus,
  onDepartRequest,
  priorityLabel,
  request,
  requestStatuses,
  statusLabel,
  updateActionLabel,
}: {
  closeActionLabel?: string;
  customerStatusLabel: (status: ProfessionalManagedRequest['customerStatus']) => string;
  evidenceLabels: {
    customerSummary: string;
    empty: string;
    historyEmpty: string;
    internalNote: string;
    link: string;
    timeline: string;
    title: string;
    updatedAt: string;
  };
  fieldLabels: {
    area: string;
    budget: string;
    bookingFlow: string;
    currentStatus: string;
    customerStatus: string;
    note: string;
    requestedMode: string;
    service: string;
  };
  getAreaLabel: (areaId: string) => string;
  getBookingFlowLabel: (flow: ProfessionalManagedRequest['bookingFlow']) => string;
  getModeLabel: (mode: ProfessionalManagedRequest['requestedMode']) => string;
  getServiceLabel: (serviceId: string) => string;
  htmlId?: string;
  homeVisitTravel?: {
    actionLabel: string;
    description: string;
    isDeparting?: boolean;
    pendingLabel: string;
    title: string;
  };
  isHighlighted?: boolean;
  moveToLabel: string;
  onCloseRequest?: () => void;
  onChangeStatus: (status: ProfessionalRequestStatus) => void;
  onDepartRequest?: () => void;
  priorityLabel: string;
  request: ProfessionalManagedRequest;
  requestStatuses: ProfessionalRequestStatus[];
  statusLabel: (status: ProfessionalRequestStatus) => string;
  updateActionLabel: (status: ProfessionalRequestStatus) => string;
}) => {
  const historyEntries = [...request.statusHistory].sort(
    (leftEntry, rightEntry) => new Date(leftEntry.createdAt).getTime() - new Date(rightEntry.createdAt).getTime(),
  );
  const nextStatus = getNextProfessionalRequestStatus(request.status);

  return (
    <div
      id={htmlId}
      className={`${surfaceCardPaddedClass} scroll-mt-28 ${
        isHighlighted ? 'border-blue-200 shadow-[0_24px_70px_-42px_rgba(37,99,235,0.45)]' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[16px] font-bold text-slate-900">{request.clientName}</p>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                request.priority === 'high'
                  ? 'bg-red-100 text-red-600'
                  : request.priority === 'medium'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-gray-200 text-gray-600'
              }`}
            >
              {priorityLabel}
            </span>
          </div>
          <p className="mt-1 text-[12px] text-slate-500">{request.requestedAtLabel}</p>
        </div>
        <div className="rounded-full bg-blue-50 px-3 py-1.5 text-right text-[11px] font-semibold text-blue-700">
          <p className="text-[10px] uppercase tracking-[0.14em] text-blue-500">{fieldLabels.currentStatus}</p>
          <p className="mt-1">{statusLabel(request.status)}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <ServiceMetaChip label={fieldLabels.requestedMode} value={getModeLabel(request.requestedMode)} />
        <ServiceMetaChip label={fieldLabels.bookingFlow} value={getBookingFlowLabel(request.bookingFlow)} />
        <ServiceMetaChip label={fieldLabels.customerStatus} value={customerStatusLabel(request.customerStatus)} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className={`${insetSurfaceClass} px-3.5 py-3`}>
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
            <ClipboardList className="h-4 w-4 text-slate-400" />
            <span>{fieldLabels.service}</span>
          </div>
          <p className="mt-2 text-[13px] font-bold leading-snug text-slate-900">
            {request.serviceName || getServiceLabel(request.serviceId)}
          </p>
          {request.serviceSummary ? (
            <p className="mt-1 text-[12px] leading-relaxed text-slate-500">{request.serviceSummary}</p>
          ) : null}
        </div>
        <div className={`${insetSurfaceClass} px-3.5 py-3`}>
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
            <MapPin className="h-4 w-4 text-slate-400" />
            <span>{fieldLabels.area}</span>
          </div>
          <p className="mt-2 text-[13px] font-bold leading-snug text-slate-900">{getAreaLabel(request.areaId)}</p>
        </div>
        <div className={`${insetSurfaceClass} col-span-2 px-3.5 py-3`}>
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
            <Wallet className="h-4 w-4 text-slate-400" />
            <span>{fieldLabels.budget}</span>
          </div>
          <p className="mt-2 text-[13px] font-bold leading-snug text-slate-900">{request.budgetLabel}</p>
        </div>
      </div>

      <div className={`${insetSurfaceClass} mt-4 px-4 py-3.5`}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{fieldLabels.note}</p>
        <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-slate-600">{request.note}</p>
      </div>

      {homeVisitTravel ? (
        <div className={`${insetSurfaceClass} mt-4 px-4 py-3.5`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            {homeVisitTravel.title}
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{homeVisitTravel.description}</p>
          {onDepartRequest ? (
            <button
              type="button"
              onClick={onDepartRequest}
              disabled={homeVisitTravel.isDeparting}
              className="mt-3 inline-flex w-full items-center justify-center rounded-[16px] bg-pink-600 px-4 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-pink-500 disabled:cursor-wait disabled:bg-pink-300"
            >
              {homeVisitTravel.isDeparting ? homeVisitTravel.pendingLabel : homeVisitTravel.actionLabel}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className={`${insetSurfaceClass} mt-4 px-4 py-3.5`}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          {evidenceLabels.timeline}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {requestStatuses.map((status) => {
            const currentIndex = requestStatuses.indexOf(request.status);
            const statusIndex = requestStatuses.indexOf(status);
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
                {statusLabel(status)}
              </span>
            );
          })}
        </div>
      </div>

      <div className={`${insetSurfaceClass} mt-4 px-4 py-3.5`}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{evidenceLabels.title}</p>
        {historyEntries.length > 0 ? (
          <div className="mt-3 space-y-3">
            {historyEntries.map((entry, index) => (
              <div key={entry.id} className={index > 0 ? 'border-t border-slate-200 pt-3' : ''}>
                <div className="flex items-start justify-between gap-3">
                  <div className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white">
                    {statusLabel(entry.status)}
                  </div>
                  <p className="text-right text-[11px] text-slate-500">
                    {evidenceLabels.updatedAt}: {entry.createdAtLabel}
                  </p>
                </div>
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  {statusLabel(entry.fromStatus)} {'->'} {statusLabel(entry.status)}
                </p>
                <div className="mt-2 space-y-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      {evidenceLabels.customerSummary}
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-slate-600">
                      {entry.customerSummary || evidenceLabels.empty}
                    </p>
                  </div>
                  {entry.evidenceNote ? (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                        {evidenceLabels.internalNote}
                      </p>
                      <p className="mt-1 text-[13px] leading-relaxed text-slate-600">{entry.evidenceNote}</p>
                    </div>
                  ) : null}
                  {entry.evidenceUrl ? (
                    <a
                      href={entry.evidenceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-[12px] font-semibold text-blue-700"
                    >
                      {evidenceLabels.link}
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-[13px] leading-relaxed text-slate-500">{evidenceLabels.historyEmpty}</p>
        )}
      </div>

      <div className="mt-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{moveToLabel}</p>
        {nextStatus ? (
          <div className="flex gap-3">
            {onCloseRequest && closeActionLabel ? (
              <button
                type="button"
                onClick={onCloseRequest}
                className="inline-flex flex-1 items-center justify-center rounded-[16px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-700 transition-colors hover:bg-red-100"
              >
                {closeActionLabel}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onChangeStatus(nextStatus)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-[16px] bg-slate-900 px-4 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-slate-800"
            >
              <span>{updateActionLabel(nextStatus)}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="rounded-[16px] bg-emerald-50 px-4 py-3 text-[13px] font-semibold text-emerald-700">
            {statusLabel(request.status)}
          </div>
        )}
      </div>
    </div>
  );
};

export const LabeledField = ({ children, label }: { children: ReactNode; label: string }) => (
  <div className="block">
    <span className={standardFieldLabelClass}>{label}</span>
    {children}
  </div>
);

export const SegmentButton = ({
  isActive,
  label,
  onClick,
}: {
  isActive: boolean;
  label: string;
  onClick: () => void;
}) => (
  <button type="button" onClick={onClick} className={segmentedButtonClass(isActive)}>
    {label}
  </button>
);

export const SelectableChip = ({
  isActive,
  label,
  onClick,
}: {
  isActive: boolean;
  label: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full px-4 py-2 text-[13px] font-semibold leading-5 transition-all ${
      isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
    }`}
  >
    {label}
  </button>
);

export const SwitchRow = ({
  checked,
  description,
  label,
  onChange,
}: {
  checked: boolean;
  description: string;
  label: string;
  onChange: (checked: boolean) => void;
}) => (
  <label className="flex items-center justify-between rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
    <div className="pr-4">
      <p className="text-[14px] font-bold text-slate-900">{label}</p>
      <p className="mt-1 text-[12px] leading-relaxed text-slate-500">{description}</p>
    </div>
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
    />
  </label>
);
