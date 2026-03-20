'use client';

import {
  Activity,
  ArrowUpRight,
  CircleAlert,
  Database,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Stethoscope,
  Trash2,
  UsersRound,
  Workflow,
} from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { type ReactNode, useEffect, useState } from 'react';
import {
  ADMIN_CONSOLE_TABLE_NAMES,
  type AdminConsoleTableName,
  useAdminConsoleData,
} from '@/features/admin/hooks/useAdminConsoleData';
import { useAdminSession } from '@/features/admin/hooks/useAdminSession';
import { useSupportDesk } from '@/features/admin/hooks/useSupportDesk';
import { ADMIN_ROUTES } from '@/features/admin/lib/routes';
import { useProfessionalPortal } from '@/lib/use-professional-portal';
import type { SupportCategoryId } from '@/types/admin';
import type { AppointmentStatus } from '@/types/appointments';

const panelClass = 'rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_22px_50px_-38px_rgba(15,23,42,0.35)]';
const inputClass =
  'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:bg-white';
const textareaClass = `${inputClass} min-h-[130px] resize-y`;
const labelClass = 'text-[12px] font-semibold text-slate-500';
const buttonPrimaryClass =
  'inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800';
const buttonSecondaryClass =
  'inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50';
const compactSelectClass =
  'rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none transition focus:border-slate-400';
const checkboxClass = 'mt-1 h-4 w-4 rounded border border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-300';

const customerSupportCategoryOptions: SupportCategoryId[] = [
  'accountAccess',
  'paymentIssue',
  'refundRequest',
  'reportProfessional',
  'serviceComplaint',
  'other',
];

const professionalSupportCategoryOptions: SupportCategoryId[] = [
  'accountAccess',
  'technicalIssue',
  'serviceDispute',
  'refundClarification',
  'reportCustomer',
  'other',
];

const formatDateTime = (value?: string) => {
  if (!value) {
    return 'Belum tersedia';
  }

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const formatInteger = (value: number) => new Intl.NumberFormat('id-ID').format(value);

const approvalStatusRank: Record<string, number> = {
  submitted: 0,
  verified: 1,
  changes_requested: 2,
  ready_for_review: 3,
  draft: 4,
  published: 5,
};

const getReviewStateSortTimestamp = (reviewState: {
  publishedAt?: string;
  reviewedAt?: string;
  submittedAt?: string;
}) => {
  const timestamp = reviewState.submittedAt || reviewState.reviewedAt || reviewState.publishedAt;

  if (!timestamp) {
    return Number.MAX_SAFE_INTEGER;
  }

  return new Date(timestamp).getTime();
};

const formatQueueAge = (value?: string) => {
  if (!value) {
    return 'Tanpa timestamp';
  }

  const diffMs = Date.now() - new Date(value).getTime();
  const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));

  if (diffHours < 24) {
    return `${diffHours} jam`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} hari`;
};

const parsePriceAmount = (value: string) => Number.parseInt(value.replace(/[^\d]/g, ''), 10) || 0;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    currency: 'IDR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value);

const appointmentPhaseLabels: Record<string, string> = {
  closed: 'Closed',
  payment: 'Payment',
  post_service: 'Pasca layanan',
  pre_service: 'Pra layanan',
  service_delivery: 'Sedang berjalan',
};

const reviewStatusLabels: Record<string, string> = {
  changes_requested: 'Butuh revisi',
  draft: 'Draft',
  published: 'Published',
  ready_for_review: 'Ready for review',
  submitted: 'Menunggu review',
  verified: 'Siap publish',
};

const serviceModeLabels: Record<string, string> = {
  home_visit: 'Home visit',
  online: 'Online',
  onsite: 'Onsite',
};

const overviewFocusDescriptions: Record<string, string> = {
  all: 'Pantau support, review, appointment, dan katalog sekaligus dari satu panel kontrol.',
  appointments: 'Sorot booking yang tertahan di pembayaran, konfirmasi, atau sedang berjalan.',
  catalog: 'Lihat layanan yang masih kurang provider atau butuh penataan mode delivery.',
  reviews: 'Fokus pada profesional yang menunggu review, verifikasi, atau publish.',
  support: 'Prioritaskan ticket aktif, assignment PIC, dan kasus refund atau eskalasi.',
};

const getAppointmentStatusMeta = (
  statusOptions: Array<{ code: string; isTerminal: boolean; phase: string }>,
  statusCode: string,
) => statusOptions.find((status) => status.code === statusCode);

const getAppointmentPhase = (
  statusOptions: Array<{ code: string; isTerminal: boolean; phase: string }>,
  statusCode: string,
) => getAppointmentStatusMeta(statusOptions, statusCode)?.phase || 'unknown';

const isServiceModeEnabled = (
  service: {
    defaultMode: string;
    serviceModes: {
      homeVisit: boolean;
      online: boolean;
      onsite: boolean;
    };
  },
  mode: string,
) => {
  if (mode === 'online') {
    return service.defaultMode === 'online' || service.serviceModes.online;
  }

  if (mode === 'home_visit') {
    return service.defaultMode === 'home_visit' || service.serviceModes.homeVisit;
  }

  if (mode === 'onsite') {
    return service.defaultMode === 'onsite' || service.serviceModes.onsite;
  }

  return true;
};

const getTicketAgeHours = (value?: string) => {
  if (!value) {
    return 0;
  }

  return Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / (1000 * 60 * 60)));
};

const getTicketPriorityWeight = (urgency: string) => {
  if (urgency === 'urgent') {
    return 3;
  }

  if (urgency === 'high') {
    return 2;
  }

  return 1;
};

const sumPriceLabels = (values: string[]) => values.reduce((total, value) => total + parsePriceAmount(value), 0);

const readStoredView = <T,>(storageKey: string, fallback: T): T => {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey);

    if (!rawValue) {
      return fallback;
    }

    const parsedValue = JSON.parse(rawValue) as T;

    if (
      typeof fallback === 'object' &&
      fallback !== null &&
      typeof parsedValue === 'object' &&
      parsedValue !== null &&
      !Array.isArray(fallback) &&
      !Array.isArray(parsedValue)
    ) {
      return {
        ...(fallback as Record<string, unknown>),
        ...(parsedValue as Record<string, unknown>),
      } as T;
    }

    return parsedValue;
  } catch {
    return fallback;
  }
};

const useStoredView = <T,>(storageKey: string, fallback: T) => {
  const [value, setValue] = useState<T>(() => readStoredView(storageKey, fallback));

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(value));
  }, [storageKey, value]);

  return [value, setValue] as const;
};

const FilterPillGroup = ({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<{
    label: string;
    meta?: string;
    value: string;
  }>;
  value: string;
}) => (
  <div className="space-y-3">
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
              isActive
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
            }`}
          >
            <span>{option.label}</span>
            {option.meta ? (
              <span className={`ml-2 ${isActive ? 'text-slate-200' : 'text-slate-400'}`}>{option.meta}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  </div>
);

const CompactInsightCard = ({ detail, label, value }: { detail: string; label: string; value: string }) => (
  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
    <p className="mt-2 text-[24px] font-black tracking-[-0.03em] text-slate-950">{value}</p>
    <p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p>
  </div>
);

const SectionHeader = ({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) => (
  <div className="mb-5">
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{eyebrow}</p>
    <h2 className="mt-2 text-[26px] font-black tracking-[-0.03em] text-slate-950">{title}</h2>
    <p className="mt-2 max-w-[68ch] text-sm leading-7 text-slate-500">{description}</p>
  </div>
);

const CountBadge = ({ value }: { value: string }) => (
  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
    {value}
  </span>
);

const PanelHeader = ({
  eyebrow,
  title,
  description,
  meta,
  action,
}: {
  action?: ReactNode;
  description?: string;
  eyebrow?: string;
  meta?: string[];
  title: string;
}) => (
  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
    <div className="max-w-[72ch]">
      {eyebrow ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{eyebrow}</p>
      ) : null}
      <h3 className={`${eyebrow ? 'mt-2' : ''} text-lg font-bold text-slate-950`}>{title}</h3>
      {description ? <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p> : null}
      {meta?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {meta.map((item) => (
            <CountBadge key={item} value={item} />
          ))}
        </div>
      ) : null}
    </div>
    {action ? <div className="flex flex-wrap gap-3">{action}</div> : null}
  </div>
);

const StatCard = ({
  title,
  value,
  detail,
  icon,
}: {
  title: string;
  value: string;
  detail: string;
  icon: ReactNode;
}) => (
  <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_22px_48px_-38px_rgba(15,23,42,0.3)]">
    <div className="flex items-center gap-3 text-slate-500">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-800">{icon}</div>
      <span className="text-[12px] font-semibold uppercase tracking-[0.14em]">{title}</span>
    </div>
    <p className="mt-5 text-[30px] font-black tracking-[-0.04em] text-slate-950">{value}</p>
    <p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p>
  </div>
);

const ListButton = ({
  active,
  title,
  subtitle,
  onClick,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
      active ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-white'
    }`}
  >
    <p className="text-[14px] font-semibold">{title}</p>
    <p className={`mt-1 text-[12px] leading-5 ${active ? 'text-slate-200' : 'text-slate-500'}`}>{subtitle}</p>
  </button>
);

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="grid gap-2">
    <span className={labelClass}>{label}</span>
    {children}
  </div>
);

const MessageBanner = ({ message }: { message: string }) =>
  message ? (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
      {message}
    </div>
  ) : null;

const FilterSummaryBar = ({
  action,
  itemLabel,
  totalCount,
  activeFilters,
  onClear,
}: {
  action?: ReactNode;
  activeFilters: string[];
  itemLabel: string;
  onClear?: () => void;
  totalCount: number;
}) => {
  const hasActiveFilters = activeFilters.length > 0;

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <CountBadge value={`${formatInteger(totalCount)} ${itemLabel}`} />
        {hasActiveFilters ? (
          activeFilters.map((filterLabel) => (
            <span
              key={filterLabel}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
            >
              {filterLabel}
            </span>
          ))
        ) : (
          <span className="text-xs text-slate-500">Belum ada filter tambahan yang aktif.</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {action}
        {hasActiveFilters && onClear ? (
          <button type="button" className={buttonSecondaryClass} onClick={onClear}>
            Reset filter
          </button>
        ) : null}
      </div>
    </div>
  );
};

const EmptyStateCard = ({ title, body }: { body: string; title: string }) => (
  <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-5">
    <p className="text-sm font-semibold text-slate-700">{title}</p>
    <p className="mt-2 text-sm leading-6 text-slate-500">{body}</p>
  </div>
);

const resetPaginationPage = (
  setPage: (value: number | ((currentValue: number) => number)) => void,
  resetKey: string,
) => {
  setPage((currentPage) => (resetKey || currentPage > 1 ? 1 : currentPage));
};

const SelectableListButton = ({
  active,
  checked,
  title,
  subtitle,
  detail,
  onClick,
  onToggle,
}: {
  active: boolean;
  checked: boolean;
  detail?: string;
  onClick: () => void;
  onToggle: () => void;
  subtitle: string;
  title: string;
}) => (
  <div
    className={`flex items-start gap-3 rounded-[24px] border px-4 py-4 transition ${
      active ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-white'
    }`}
  >
    <input
      type="checkbox"
      className={checkboxClass}
      checked={checked}
      onChange={onToggle}
      onClick={(event) => event.stopPropagation()}
    />
    <button type="button" onClick={onClick} className="flex-1 text-left">
      <p className="text-[14px] font-semibold">{title}</p>
      <p className={`mt-1 text-[12px] leading-5 ${active ? 'text-slate-200' : 'text-slate-500'}`}>{subtitle}</p>
      {detail ? (
        <p className={`mt-2 text-xs leading-6 ${active ? 'text-slate-200' : 'text-slate-500'}`}>{detail}</p>
      ) : null}
    </button>
  </div>
);

const BulkActionBar = ({
  action,
  count,
  label,
  onClear,
  onSelectPage,
}: {
  action: ReactNode;
  count: number;
  label: string;
  onClear: () => void;
  onSelectPage: () => void;
}) =>
  count > 0 ? (
    <div className="mt-4 flex flex-col gap-3 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <CountBadge value={`${formatInteger(count)} ${label} dipilih`} />
        <button type="button" className={buttonSecondaryClass} onClick={onSelectPage}>
          Pilih halaman aktif
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {action}
        <button type="button" className={buttonSecondaryClass} onClick={onClear}>
          Clear selection
        </button>
      </div>
    </div>
  ) : null;

const usePaginatedItems = <T,>(items: T[], initialPageSize = 6) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, pageCount));
  }, [pageCount]);

  const rangeStart = items.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, items.length);
  const pagedItems = items.slice(rangeStart === 0 ? 0 : rangeStart - 1, rangeEnd);

  return {
    page,
    pageCount,
    pageSize,
    pagedItems,
    rangeEnd,
    rangeStart,
    setPage,
    setPageSize,
    totalCount: items.length,
  };
};

const PaginationControls = ({
  itemLabel,
  page,
  pageCount,
  pageSize,
  rangeEnd,
  rangeStart,
  setPage,
  setPageSize,
  totalCount,
}: {
  itemLabel: string;
  page: number;
  pageCount: number;
  pageSize: number;
  rangeEnd: number;
  rangeStart: number;
  setPage: (value: number | ((currentValue: number) => number)) => void;
  setPageSize: (value: number) => void;
  totalCount: number;
}) => (
  <div className="mt-4 flex flex-col gap-3 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 md:flex-row md:items-center md:justify-between">
    <p className="text-xs text-slate-500">
      {totalCount === 0 ? `Tidak ada ${itemLabel}.` : `${rangeStart}-${rangeEnd} dari ${totalCount} ${itemLabel}`}
    </p>
    <div className="flex flex-wrap items-center gap-2">
      <select
        className={compactSelectClass}
        value={String(pageSize)}
        onChange={(event) => {
          setPage(1);
          setPageSize(Number.parseInt(event.target.value, 10));
        }}
      >
        <option value="5">5 / halaman</option>
        <option value="10">10 / halaman</option>
        <option value="20">20 / halaman</option>
      </select>
      <button
        type="button"
        className={buttonSecondaryClass}
        disabled={page <= 1}
        onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
      >
        Prev
      </button>
      <span className="px-2 text-xs font-semibold text-slate-500">
        Page {page} / {pageCount}
      </span>
      <button
        type="button"
        className={buttonSecondaryClass}
        disabled={page >= pageCount}
        onClick={() => setPage((currentPage) => Math.min(pageCount, currentPage + 1))}
      >
        Next
      </button>
    </div>
  </div>
);

export const AdminOverviewScreen = () => {
  const { session } = useAdminSession();
  const {
    appointments,
    consumers,
    getProvidersCountForService,
    getTableRows,
    modifiedTableNames,
    professionals,
    runtimeSelections,
    services,
    snapshotSavedAt,
  } = useAdminConsoleData();
  const { commandCenter, tickets } = useSupportDesk();
  const { reviewStatesByProfessionalId } = useProfessionalPortal();
  const appointmentStatuses = getTableRows('reference_appointment_statuses');
  const [focusView, setFocusView] = useState<'all' | 'appointments' | 'catalog' | 'reviews' | 'support'>('all');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<
    'all' | 'new' | 'refunded' | 'resolved' | 'reviewing' | 'triaged'
  >('all');
  const [ticketUrgencyFilter, setTicketUrgencyFilter] = useState<'all' | 'high' | 'normal' | 'urgent'>('all');
  const [appointmentPhaseFilter, setAppointmentPhaseFilter] = useState<
    'all' | 'closed' | 'payment' | 'post_service' | 'pre_service' | 'service_delivery'
  >('all');
  const [reviewStatusFilter, setReviewStatusFilter] = useState<
    'all' | 'changes_requested' | 'draft' | 'published' | 'ready_for_review' | 'submitted' | 'verified'
  >('all');
  const [serviceModeFilter, setServiceModeFilter] = useState<'all' | 'home_visit' | 'online' | 'onsite'>('all');
  const [savedOverviewView, setSavedOverviewView] = useStoredView('bidanapp:admin-view:overview', {
    appointmentPhaseFilter: 'all' as 'all' | 'closed' | 'payment' | 'post_service' | 'pre_service' | 'service_delivery',
    focusView: 'all' as 'all' | 'appointments' | 'catalog' | 'reviews' | 'support',
    reviewStatusFilter: 'all' as
      | 'all'
      | 'changes_requested'
      | 'draft'
      | 'published'
      | 'ready_for_review'
      | 'submitted'
      | 'verified',
    savedAt: '',
    serviceModeFilter: 'all' as 'all' | 'home_visit' | 'online' | 'onsite',
    ticketStatusFilter: 'all' as 'all' | 'new' | 'refunded' | 'resolved' | 'reviewing' | 'triaged',
    ticketUrgencyFilter: 'all' as 'all' | 'high' | 'normal' | 'urgent',
  });

  const activeTickets = tickets.filter((ticket) => ticket.status !== 'resolved' && ticket.status !== 'refunded');
  const urgentTickets = activeTickets.filter((ticket) => ticket.urgency === 'urgent' || ticket.urgency === 'high');
  const runtimeSelection = runtimeSelections[0];
  const ticketStatusRank = {
    new: 0,
    triaged: 1,
    reviewing: 2,
    resolved: 3,
    refunded: 4,
  } satisfies Record<string, number>;
  const appointmentPhaseRank = {
    payment: 0,
    pre_service: 1,
    service_delivery: 2,
    post_service: 3,
    closed: 4,
    unknown: 5,
  } satisfies Record<string, number>;

  const reviewQueueEntries = professionals
    .map((professional) => {
      const reviewState = reviewStatesByProfessionalId[professional.id];

      if (!reviewState || reviewState.status === 'published') {
        return null;
      }

      return {
        ageLabel: formatQueueAge(reviewState.submittedAt || reviewState.reviewedAt),
        professional,
        reviewState,
        sortTimestamp: getReviewStateSortTimestamp(reviewState),
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .sort((leftEntry, rightEntry) => {
      const statusDelta =
        (approvalStatusRank[leftEntry.reviewState.status] ?? Number.MAX_SAFE_INTEGER) -
        (approvalStatusRank[rightEntry.reviewState.status] ?? Number.MAX_SAFE_INTEGER);

      if (statusDelta !== 0) {
        return statusDelta;
      }

      return leftEntry.sortTimestamp - rightEntry.sortTimestamp;
    });

  const filteredTickets = tickets
    .filter((ticket) => (ticketStatusFilter === 'all' ? true : ticket.status === ticketStatusFilter))
    .filter((ticket) => (ticketUrgencyFilter === 'all' ? true : ticket.urgency === ticketUrgencyFilter));

  const filteredAppointments = appointments.filter((appointment) => {
    const appointmentPhase = getAppointmentPhase(appointmentStatuses, appointment.status);
    return appointmentPhaseFilter === 'all' ? true : appointmentPhase === appointmentPhaseFilter;
  });

  const filteredReviewQueue = reviewQueueEntries.filter((entry) =>
    reviewStatusFilter === 'all' ? true : entry.reviewState.status === reviewStatusFilter,
  );

  const filteredServices = services.filter((service) =>
    serviceModeFilter === 'all' ? true : isServiceModeEnabled(service, serviceModeFilter),
  );

  const filteredActiveTickets = filteredTickets.filter(
    (ticket) => ticket.status !== 'resolved' && ticket.status !== 'refunded',
  );
  const filteredUrgentTickets = filteredActiveTickets.filter(
    (ticket) => ticket.urgency === 'urgent' || ticket.urgency === 'high',
  );
  const filteredOpenAppointments = filteredAppointments.filter((appointment) => {
    const appointmentMeta = getAppointmentStatusMeta(appointmentStatuses, appointment.status);
    return appointmentMeta ? !appointmentMeta.isTerminal : true;
  });
  const filteredAppointmentValue = sumPriceLabels(
    filteredAppointments.map((appointment) => appointment.totalPriceLabel),
  );
  const uncoveredServices = filteredServices.filter((service) => getProvidersCountForService(service.id) === 0);

  const supportSpotlight = [...filteredTickets]
    .sort((leftTicket, rightTicket) => {
      const urgencyDelta = getTicketPriorityWeight(rightTicket.urgency) - getTicketPriorityWeight(leftTicket.urgency);

      if (urgencyDelta !== 0) {
        return urgencyDelta;
      }

      const statusDelta =
        (ticketStatusRank[leftTicket.status] ?? Number.MAX_SAFE_INTEGER) -
        (ticketStatusRank[rightTicket.status] ?? Number.MAX_SAFE_INTEGER);

      if (statusDelta !== 0) {
        return statusDelta;
      }

      return new Date(leftTicket.createdAt).getTime() - new Date(rightTicket.createdAt).getTime();
    })
    .slice(0, 3);

  const getAppointmentPhaseRank = (phase: string) =>
    appointmentPhaseRank[phase as keyof typeof appointmentPhaseRank] ?? Number.MAX_SAFE_INTEGER;

  const appointmentSpotlight = [...filteredAppointments]
    .sort((leftAppointment, rightAppointment) => {
      const phaseDelta =
        getAppointmentPhaseRank(getAppointmentPhase(appointmentStatuses, leftAppointment.status)) -
        getAppointmentPhaseRank(getAppointmentPhase(appointmentStatuses, rightAppointment.status));

      if (phaseDelta !== 0) {
        return phaseDelta;
      }

      return new Date(leftAppointment.requestedAt).getTime() - new Date(rightAppointment.requestedAt).getTime();
    })
    .slice(0, 3);

  const catalogSpotlight = [...filteredServices]
    .sort((leftService, rightService) => {
      const providerDelta = getProvidersCountForService(leftService.id) - getProvidersCountForService(rightService.id);

      if (providerDelta !== 0) {
        return providerDelta;
      }

      return leftService.name.localeCompare(rightService.name);
    })
    .slice(0, 3);

  const focusRoute =
    focusView === 'support'
      ? ADMIN_ROUTES.support
      : focusView === 'reviews'
        ? ADMIN_ROUTES.professionals
        : focusView === 'appointments'
          ? ADMIN_ROUTES.appointments
          : focusView === 'catalog'
            ? ADMIN_ROUTES.services
            : ADMIN_ROUTES.overview;
  const activeOverviewFilters = [
    focusView !== 'all' ? `focus:${focusView}` : '',
    ticketStatusFilter !== 'all' ? `ticket:${ticketStatusFilter}` : '',
    ticketUrgencyFilter !== 'all' ? `urgency:${ticketUrgencyFilter}` : '',
    appointmentPhaseFilter !== 'all' ? `phase:${appointmentPhaseFilter}` : '',
    reviewStatusFilter !== 'all' ? `review:${reviewStatusFilter}` : '',
    serviceModeFilter !== 'all' ? `mode:${serviceModeFilter}` : '',
  ].filter(Boolean);

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Overview"
        title="Command center operasional"
        description="Dashboard kontrol admin yang bisa difilter sesuai kebutuhan operasional, supaya support, review, appointment, dan katalog lebih cepat dibaca dan ditindaklanjuti."
      />

      <section className={panelClass}>
        <PanelHeader
          eyebrow="Command controls"
          title="Filter dashboard sesuai apa yang admin ingin lihat"
          description={`${overviewFocusDescriptions[focusView]} ${commandCenter.commandNote}`}
          meta={[`Session focus ${session.focusArea}`, `Runtime ${runtimeSelection?.id || 'runtime-default'}`]}
          action={
            <Link href={focusRoute} className={buttonSecondaryClass}>
              Buka area fokus
            </Link>
          }
        />

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <FilterPillGroup
              label="Focus cepat"
              value={focusView}
              onChange={(value) => setFocusView(value as typeof focusView)}
              options={[
                { label: 'Semua', value: 'all' },
                { label: 'Support', value: 'support' },
                { label: 'Reviews', value: 'reviews' },
                { label: 'Appointments', value: 'appointments' },
                { label: 'Catalog', value: 'catalog' },
              ]}
            />

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <Field label="Status ticket">
                <select
                  className={inputClass}
                  value={ticketStatusFilter}
                  onChange={(event) => setTicketStatusFilter(event.target.value as typeof ticketStatusFilter)}
                >
                  <option value="all">Semua status</option>
                  <option value="new">new</option>
                  <option value="triaged">triaged</option>
                  <option value="reviewing">reviewing</option>
                  <option value="resolved">resolved</option>
                  <option value="refunded">refunded</option>
                </select>
              </Field>
              <Field label="Urgency ticket">
                <select
                  className={inputClass}
                  value={ticketUrgencyFilter}
                  onChange={(event) => setTicketUrgencyFilter(event.target.value as typeof ticketUrgencyFilter)}
                >
                  <option value="all">Semua urgency</option>
                  <option value="normal">normal</option>
                  <option value="high">high</option>
                  <option value="urgent">urgent</option>
                </select>
              </Field>
              <Field label="Phase appointment">
                <select
                  className={inputClass}
                  value={appointmentPhaseFilter}
                  onChange={(event) => setAppointmentPhaseFilter(event.target.value as typeof appointmentPhaseFilter)}
                >
                  <option value="all">Semua phase</option>
                  <option value="payment">Payment</option>
                  <option value="pre_service">Pra layanan</option>
                  <option value="service_delivery">Sedang berjalan</option>
                  <option value="post_service">Pasca layanan</option>
                  <option value="closed">Closed</option>
                </select>
              </Field>
              <Field label="Status review profesional">
                <select
                  className={inputClass}
                  value={reviewStatusFilter}
                  onChange={(event) => setReviewStatusFilter(event.target.value as typeof reviewStatusFilter)}
                >
                  <option value="all">Semua review state</option>
                  <option value="submitted">submitted</option>
                  <option value="verified">verified</option>
                  <option value="changes_requested">changes_requested</option>
                  <option value="ready_for_review">ready_for_review</option>
                  <option value="draft">draft</option>
                  <option value="published">published</option>
                </select>
              </Field>
              <Field label="Mode service">
                <select
                  className={inputClass}
                  value={serviceModeFilter}
                  onChange={(event) => setServiceModeFilter(event.target.value as typeof serviceModeFilter)}
                >
                  <option value="all">Semua mode</option>
                  <option value="online">Online</option>
                  <option value="home_visit">Home visit</option>
                  <option value="onsite">Onsite</option>
                </select>
              </Field>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <CompactInsightCard
              label="Support sesuai filter"
              value={formatInteger(filteredActiveTickets.length)}
              detail={`${formatInteger(filteredUrgentTickets.length)} high/urgent dari ${formatInteger(filteredTickets.length)} total ticket.`}
            />
            <CompactInsightCard
              label="Review queue"
              value={formatInteger(filteredReviewQueue.length)}
              detail="Status review profesional langsung ikut berubah saat filter dashboard diganti."
            />
            <CompactInsightCard
              label="Appointment aktif"
              value={formatInteger(filteredOpenAppointments.length)}
              detail={`${formatCurrency(filteredAppointmentValue)} nilai snapshot pada daftar appointment terfilter.`}
            />
            <CompactInsightCard
              label="Gap katalog"
              value={formatInteger(uncoveredServices.length)}
              detail={`${formatInteger(filteredServices.length)} layanan cocok dengan filter mode yang dipilih.`}
            />
          </div>
        </div>

        <FilterSummaryBar
          itemLabel="signal overview"
          totalCount={
            filteredActiveTickets.length +
            filteredReviewQueue.length +
            filteredOpenAppointments.length +
            uncoveredServices.length
          }
          activeFilters={activeOverviewFilters}
          action={
            <>
              <button
                type="button"
                className={buttonSecondaryClass}
                onClick={() =>
                  setSavedOverviewView({
                    appointmentPhaseFilter,
                    focusView,
                    reviewStatusFilter,
                    savedAt: new Date().toISOString(),
                    serviceModeFilter,
                    ticketStatusFilter,
                    ticketUrgencyFilter,
                  })
                }
              >
                Simpan view
              </button>
              {savedOverviewView.savedAt ? (
                <button
                  type="button"
                  className={buttonSecondaryClass}
                  onClick={() => {
                    setFocusView(savedOverviewView.focusView);
                    setTicketStatusFilter(savedOverviewView.ticketStatusFilter);
                    setTicketUrgencyFilter(savedOverviewView.ticketUrgencyFilter);
                    setAppointmentPhaseFilter(savedOverviewView.appointmentPhaseFilter);
                    setReviewStatusFilter(savedOverviewView.reviewStatusFilter);
                    setServiceModeFilter(savedOverviewView.serviceModeFilter);
                  }}
                >
                  Muat view
                </button>
              ) : null}
            </>
          }
          onClear={() => {
            setFocusView('all');
            setTicketStatusFilter('all');
            setTicketUrgencyFilter('all');
            setAppointmentPhaseFilter('all');
            setReviewStatusFilter('all');
            setServiceModeFilter('all');
          }}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<UsersRound className="h-5 w-5" />}
          title="Customers"
          value={formatInteger(consumers.length)}
          detail="Customer demo tetap terlihat sebagai basis relasi untuk support dan appointment."
        />
        <StatCard
          icon={<Stethoscope className="h-5 w-5" />}
          title="Professionals"
          value={formatInteger(filteredReviewQueue.length)}
          detail={`${formatInteger(professionals.length)} roster aktif, ${formatInteger(reviewQueueEntries.length)} profil masih perlu perhatian admin.`}
        />
        <StatCard
          icon={<Activity className="h-5 w-5" />}
          title="Appointments"
          value={formatInteger(filteredAppointments.length)}
          detail={`${formatInteger(filteredOpenAppointments.length)} masih terbuka, nilai ${formatCurrency(filteredAppointmentValue)}.`}
        />
        <StatCard
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Support"
          value={formatInteger(filteredUrgentTickets.length)}
          detail={`${formatInteger(activeTickets.length)} aktif total, ${formatInteger(filteredTickets.length)} terlihat pada filter saat ini.`}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.06fr_0.94fr]">
        <div className={panelClass}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-950">Drill-down prioritas sesuai filter</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Panel ini berubah mengikuti filter dashboard sehingga admin bisa langsung lihat item mana yang perlu
                dibuka.
              </p>
            </div>
            <Link href={focusRoute} className={buttonSecondaryClass}>
              Buka view fokus
            </Link>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Support queue</p>
              <div className="mt-4 space-y-3">
                {supportSpotlight.length ? (
                  supportSpotlight.map((ticket) => (
                    <div key={ticket.id} className="rounded-[20px] bg-white px-4 py-3">
                      <p className="text-sm font-semibold text-slate-950">{ticket.summary}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {ticket.reporterRole} · {ticket.status} · {ticket.urgency}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        {ticket.id} · umur {formatQueueAge(ticket.createdAt)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[20px] border border-dashed border-slate-200 bg-white px-4 py-5 text-sm text-slate-500">
                    Tidak ada ticket yang cocok dengan kombinasi filter saat ini.
                  </div>
                )}
              </div>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Review profesional</p>
              <div className="mt-4 space-y-3">
                {filteredReviewQueue.slice(0, 3).map((entry) => (
                  <div key={entry.professional.id} className="rounded-[20px] bg-white px-4 py-3">
                    <p className="text-sm font-semibold text-slate-950">{entry.professional.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {entry.professional.title} ·{' '}
                      {reviewStatusLabels[entry.reviewState.status] || entry.reviewState.status}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Submitted {formatDateTime(entry.reviewState.submittedAt)} · {entry.ageLabel}
                    </p>
                  </div>
                ))}
                {filteredReviewQueue.length === 0 ? (
                  <div className="rounded-[20px] border border-dashed border-slate-200 bg-white px-4 py-5 text-sm text-slate-500">
                    Tidak ada profesional yang cocok dengan state review terpilih.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Appointment ops</p>
              <div className="mt-4 space-y-3">
                {appointmentSpotlight.length ? (
                  appointmentSpotlight.map((appointment) => (
                    <div key={appointment.id} className="rounded-[20px] bg-white px-4 py-3">
                      <p className="text-sm font-semibold text-slate-950">{appointment.serviceSnapshot.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {appointment.status} ·{' '}
                        {appointmentPhaseLabels[getAppointmentPhase(appointmentStatuses, appointment.status)] ||
                          'Unknown'}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        {appointment.id} · {appointment.scheduledTimeLabel}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[20px] border border-dashed border-slate-200 bg-white px-4 py-5 text-sm text-slate-500">
                    Tidak ada appointment yang cocok dengan phase terpilih.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Katalog dan coverage
              </p>
              <div className="mt-4 space-y-3">
                {catalogSpotlight.length ? (
                  catalogSpotlight.map((service) => (
                    <div key={service.id} className="rounded-[20px] bg-white px-4 py-3">
                      <p className="text-sm font-semibold text-slate-950">{service.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {serviceModeLabels[service.defaultMode] || service.defaultMode} ·{' '}
                        {formatInteger(getProvidersCountForService(service.id))} provider
                      </p>
                      <p className="mt-2 text-xs text-slate-500">{service.id}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[20px] border border-dashed border-slate-200 bg-white px-4 py-5 text-sm text-slate-500">
                    Tidak ada layanan yang cocok dengan mode service terpilih.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className={panelClass}>
            <h3 className="text-lg font-bold text-slate-950">Fokus operasional saat ini</h3>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] bg-slate-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Focus area aktif</p>
                <p className="mt-2 text-[20px] font-black capitalize text-slate-950">{session.focusArea}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{commandCenter.commandNote}</p>
              </div>
              <div className="rounded-[24px] bg-slate-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Runtime aktif</p>
                <p className="mt-2 text-[16px] font-bold text-slate-950">{runtimeSelection?.id || 'runtime-default'}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Consumer {runtimeSelection?.currentConsumerId || '-'} · Context{' '}
                  {runtimeSelection?.currentUserContextId || '-'}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {formatDateTime(runtimeSelection?.currentDateTimeIso)}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <QuickLinkCard
                href={ADMIN_ROUTES.support}
                title="Triage support"
                body="Buka ticket yang urgent, assign PIC, dan update SLA."
              />
              <QuickLinkCard
                href={ADMIN_ROUTES.professionals}
                title="Review profesional"
                body="Ajukan ulang, verifikasi, atau publish profil yang sudah siap."
              />
              <QuickLinkCard
                href={ADMIN_ROUTES.appointments}
                title="Appointment ops"
                body="Perbaiki status booking, waktu sesi, dan ringkasan operasional."
              />
              <QuickLinkCard
                href={ADMIN_ROUTES.mock}
                title="Mock studio"
                body="Inspect raw tables, import/export snapshot, atau reset ke seed."
              />
            </div>
          </div>

          <div className={panelClass}>
            <h3 className="text-lg font-bold text-slate-950">Snapshot admin lokal</h3>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
                {modifiedTableNames.length} table berubah
              </span>
              <span className="rounded-full bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
                Saved {formatDateTime(snapshotSavedAt)}
              </span>
              <span className="rounded-full bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
                {formatInteger(urgentTickets.length)} urgent queue total
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {modifiedTableNames.length ? (
                modifiedTableNames.map((tableName) => (
                  <span
                    key={tableName}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
                  >
                    {tableName}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-500">
                  Belum ada perubahan dari seed. Mock studio masih identik dengan data awal.
                </span>
              )}
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <CompactInsightCard
                label="Ticket aging"
                value={`${formatInteger(filteredActiveTickets.filter((ticket) => getTicketAgeHours(ticket.createdAt) >= 6).length)}`}
                detail="Ticket aktif dengan umur minimal 6 jam, berguna untuk mengawasi backlog triage."
              />
              <CompactInsightCard
                label="Service tanpa provider"
                value={formatInteger(uncoveredServices.length)}
                detail="Layanan yang lolos filter mode tetapi belum punya provider aktif."
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export const AdminCustomersScreen = () => {
  const {
    appointments,
    consumers,
    createConsumer,
    createUserContext,
    deleteConsumer,
    deleteUserContext,
    getTableRows,
    runtimeSelections,
    updateConsumer,
    updateRuntimeSelection,
    updateUserContext,
    userContexts,
  } = useAdminConsoleData();
  const { tickets } = useSupportDesk();
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');
  const [selectedConsumerId, setSelectedConsumerId] = useState(consumers[0]?.id || '');
  const [selectedContextId, setSelectedContextId] = useState(userContexts[0]?.id || '');
  const [customerDraft, setCustomerDraft] = useState(consumers[0]);
  const [contextDraft, setContextDraft] = useState(userContexts[0]);
  const [runtimeDraft, setRuntimeDraft] = useState(runtimeSelections[0]);
  const homeFeeds = getTableRows('home_feed_snapshots');
  const [savedCustomerView, setSavedCustomerView] = useStoredView('bidanapp:admin-view:customers', {
    savedAt: '',
    searchQuery: '',
    selectedConsumerId: '',
    selectedContextId: '',
  });
  const filteredConsumers = consumers.filter((consumer) => {
    const searchValue = searchQuery.trim().toLowerCase();
    if (!searchValue) {
      return true;
    }

    return (
      consumer.name.toLowerCase().includes(searchValue) ||
      consumer.phone.toLowerCase().includes(searchValue) ||
      consumer.id.toLowerCase().includes(searchValue)
    );
  });
  const customerListPagination = usePaginatedItems(filteredConsumers, 6);

  const selectedConsumer = consumers.find((consumer) => consumer.id === selectedConsumerId) || consumers[0];
  const activeRuntimeSelection = runtimeSelections[0];
  const activeUserContext =
    userContexts.find((context) => context.id === activeRuntimeSelection?.currentUserContextId) || userContexts[0];
  const selectedContext =
    userContexts.find((context) => context.id === selectedContextId) || activeUserContext || userContexts[0];

  useEffect(() => {
    if (
      (!selectedConsumerId || !consumers.some((consumer) => consumer.id === selectedConsumerId)) &&
      consumers[0]?.id
    ) {
      setSelectedConsumerId(consumers[0].id);
    }
  }, [consumers, selectedConsumerId]);

  useEffect(() => {
    if (
      (!selectedContextId || !userContexts.some((context) => context.id === selectedContextId)) &&
      activeUserContext?.id
    ) {
      setSelectedContextId(activeUserContext.id);
    }
  }, [activeUserContext?.id, selectedContextId, userContexts]);

  useEffect(() => {
    setCustomerDraft(selectedConsumer);
  }, [selectedConsumer]);

  useEffect(() => {
    setContextDraft(selectedContext);
  }, [selectedContext]);

  useEffect(() => {
    setRuntimeDraft(activeRuntimeSelection);
  }, [activeRuntimeSelection]);

  const relatedAppointments = appointments.filter((appointment) => appointment.consumerId === selectedConsumer?.id);
  const relatedTickets = tickets.filter(
    (ticket) => ticket.reporterName === selectedConsumer?.name || ticket.reporterPhone === selectedConsumer?.phone,
  );
  const relatedAppointmentsPagination = usePaginatedItems(relatedAppointments, 5);
  const relatedTicketsPagination = usePaginatedItems(relatedTickets, 5);
  const customerListResetKey = searchQuery.trim();
  const customerRelationsResetKey = selectedConsumer?.id || 'none';

  useEffect(() => {
    resetPaginationPage(customerListPagination.setPage, customerListResetKey);
  }, [customerListPagination.setPage, customerListResetKey]);

  useEffect(() => {
    if (filteredConsumers.length > 0 && !filteredConsumers.some((consumer) => consumer.id === selectedConsumerId)) {
      setSelectedConsumerId(filteredConsumers[0].id);
    }
  }, [filteredConsumers, selectedConsumerId]);

  useEffect(() => {
    resetPaginationPage(relatedAppointmentsPagination.setPage, customerRelationsResetKey);
    resetPaginationPage(relatedTicketsPagination.setPage, customerRelationsResetKey);
  }, [customerRelationsResetKey, relatedAppointmentsPagination.setPage, relatedTicketsPagination.setPage]);

  if (!selectedConsumer || !customerDraft || !selectedContext || !contextDraft || !runtimeDraft) {
    return null;
  }

  const activeCustomerFilters = [searchQuery.trim() ? `search:${searchQuery.trim()}` : ''].filter(Boolean);

  const handleCreateConsumer = () => {
    const nextConsumer = createConsumer();

    if (nextConsumer) {
      setSelectedConsumerId(nextConsumer.id);
      setMessage(`Customer baru ${nextConsumer.id} ditambahkan ke snapshot admin.`);
    }
  };

  const handleDeleteConsumer = () => {
    const result = deleteConsumer(selectedConsumer.id);
    setMessage(result.message);
  };

  const handleCreateContext = () => {
    const nextContext = createUserContext();

    if (nextContext) {
      setSelectedContextId(nextContext.id);
      setMessage(`User context baru ${nextContext.id} ditambahkan.`);
    }
  };

  const handleDeleteContext = () => {
    const result = deleteUserContext(selectedContext.id);
    setMessage(result.message);
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Customers"
        title="Customer profiles dan runtime"
        description="Edit profil customer demo, lihat relasi appointment/support, dan kontrol consumer/context aktif yang dipakai surface user."
      />

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className={panelClass}>
          <PanelHeader
            title="Daftar customer"
            description="Cari customer aktif, buka profilnya, lalu lanjutkan edit data dan runtime context dari panel sebelah."
            meta={[`${formatInteger(filteredConsumers.length)} hasil`, `${formatInteger(userContexts.length)} context`]}
            action={
              <button type="button" className={buttonSecondaryClass} onClick={handleCreateConsumer}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah customer
              </button>
            }
          />
          <input
            className={`${inputClass} mt-4`}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Cari nama, nomor telepon, atau id customer."
          />
          <FilterSummaryBar
            itemLabel="customer"
            totalCount={filteredConsumers.length}
            activeFilters={activeCustomerFilters}
            action={
              <>
                <button
                  type="button"
                  className={buttonSecondaryClass}
                  onClick={() =>
                    setSavedCustomerView({
                      savedAt: new Date().toISOString(),
                      searchQuery,
                      selectedConsumerId,
                      selectedContextId,
                    })
                  }
                >
                  Simpan view
                </button>
                {savedCustomerView.savedAt ? (
                  <button
                    type="button"
                    className={buttonSecondaryClass}
                    onClick={() => {
                      setSearchQuery(savedCustomerView.searchQuery);
                      setSelectedConsumerId(savedCustomerView.selectedConsumerId);
                      setSelectedContextId(savedCustomerView.selectedContextId);
                    }}
                  >
                    Muat view
                  </button>
                ) : null}
              </>
            }
            onClear={() => setSearchQuery('')}
          />
          <div className="mt-5 space-y-3">
            {customerListPagination.pagedItems.map((consumer) => (
              <ListButton
                key={consumer.id}
                active={consumer.id === selectedConsumerId}
                title={consumer.name}
                subtitle={`${consumer.phone} · ${appointments.filter((appointment) => appointment.consumerId === consumer.id).length} appointment`}
                onClick={() => setSelectedConsumerId(consumer.id)}
              />
            ))}
            {filteredConsumers.length === 0 ? (
              <EmptyStateCard
                title="Tidak ada customer yang cocok"
                body="Ubah kata kunci pencarian atau tambahkan customer baru ke snapshot admin."
              />
            ) : null}
            <PaginationControls
              itemLabel="customer"
              page={customerListPagination.page}
              pageCount={customerListPagination.pageCount}
              pageSize={customerListPagination.pageSize}
              rangeEnd={customerListPagination.rangeEnd}
              rangeStart={customerListPagination.rangeStart}
              setPage={customerListPagination.setPage}
              setPageSize={customerListPagination.setPageSize}
              totalCount={customerListPagination.totalCount}
            />
          </div>
        </div>

        <div className="space-y-5">
          <MessageBanner message={message} />

          <div className={panelClass}>
            <div className="grid gap-4 md:grid-cols-3">
              <StatCard
                icon={<UsersRound className="h-5 w-5" />}
                title="Customer"
                value={selectedConsumer.name}
                detail={selectedConsumer.phone}
              />
              <StatCard
                icon={<Activity className="h-5 w-5" />}
                title="Appointments"
                value={formatInteger(relatedAppointments.length)}
                detail="Riwayat appointment yang terkait customer ini."
              />
              <StatCard
                icon={<ShieldCheck className="h-5 w-5" />}
                title="Tickets"
                value={formatInteger(relatedTickets.length)}
                detail="Ticket support yang match nama/nomor customer."
              />
            </div>
          </div>

          <div className={`${panelClass} grid gap-5 lg:grid-cols-2`}>
            <div>
              <PanelHeader
                title="Edit profil customer"
                description="Perubahan di sini dipakai sebagai data operasional mock customer yang sedang dipilih."
              />
              <div className="mt-5 grid gap-4">
                <Field label="Nama">
                  <input
                    className={inputClass}
                    value={customerDraft.name}
                    onChange={(event) => setCustomerDraft({ ...customerDraft, name: event.target.value })}
                  />
                </Field>
                <Field label="Nomor telepon">
                  <input
                    className={inputClass}
                    value={customerDraft.phone}
                    onChange={(event) => setCustomerDraft({ ...customerDraft, phone: event.target.value })}
                  />
                </Field>
                <Field label="Avatar URL">
                  <input
                    className={inputClass}
                    value={customerDraft.avatar}
                    onChange={(event) => setCustomerDraft({ ...customerDraft, avatar: event.target.value })}
                  />
                </Field>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className={buttonPrimaryClass}
                    onClick={() => {
                      updateConsumer(selectedConsumer.id, customerDraft);
                      setMessage(`Profil customer ${selectedConsumer.id} berhasil disimpan.`);
                    }}
                  >
                    Simpan profil customer
                  </button>
                  <button type="button" className={buttonSecondaryClass} onClick={handleDeleteConsumer}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Hapus customer
                  </button>
                </div>
              </div>
            </div>

            <div>
              <PanelHeader
                title="Runtime selection"
                description="Atur consumer, context, home feed, dan jam simulasi yang sedang aktif untuk surface user."
              />
              <div className="mt-5 grid gap-4">
                <Field label="Current consumer">
                  <select
                    className={inputClass}
                    value={runtimeDraft.currentConsumerId}
                    onChange={(event) => setRuntimeDraft({ ...runtimeDraft, currentConsumerId: event.target.value })}
                  >
                    {consumers.map((consumer) => (
                      <option key={consumer.id} value={consumer.id}>
                        {consumer.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Current user context">
                  <select
                    className={inputClass}
                    value={runtimeDraft.currentUserContextId}
                    onChange={(event) => setRuntimeDraft({ ...runtimeDraft, currentUserContextId: event.target.value })}
                  >
                    {userContexts.map((context) => (
                      <option key={context.id} value={context.id}>
                        {context.id}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Active home feed">
                  <select
                    className={inputClass}
                    value={runtimeDraft.activeHomeFeedId}
                    onChange={(event) => setRuntimeDraft({ ...runtimeDraft, activeHomeFeedId: event.target.value })}
                  >
                    {homeFeeds.map((homeFeed) => (
                      <option key={homeFeed.id} value={homeFeed.id}>
                        {homeFeed.title}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Current date time ISO">
                  <input
                    className={inputClass}
                    value={runtimeDraft.currentDateTimeIso}
                    onChange={(event) => setRuntimeDraft({ ...runtimeDraft, currentDateTimeIso: event.target.value })}
                  />
                </Field>
                <button
                  type="button"
                  className={buttonPrimaryClass}
                  onClick={() => {
                    updateRuntimeSelection(runtimeDraft.id, runtimeDraft);
                    setMessage(`Runtime selection ${runtimeDraft.id} berhasil diperbarui.`);
                  }}
                >
                  Simpan runtime selection
                </button>
              </div>
            </div>
          </div>

          <div className={`${panelClass} grid gap-5 lg:grid-cols-2`}>
            <div>
              <PanelHeader
                title="Kelola user context"
                description="Gunakan context untuk mengatur area, status online, dan koordinat user yang aktif."
                action={
                  <>
                    <button type="button" className={buttonSecondaryClass} onClick={handleCreateContext}>
                      <Plus className="mr-2 h-4 w-4" />
                      Tambah context
                    </button>
                    <button type="button" className={buttonSecondaryClass} onClick={handleDeleteContext}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Hapus context
                    </button>
                  </>
                }
              />
              <div className="mt-5 grid gap-4">
                <Field label="Context target">
                  <select
                    className={inputClass}
                    value={selectedContext.id}
                    onChange={(event) => setSelectedContextId(event.target.value)}
                  >
                    {userContexts.map((context) => (
                      <option key={context.id} value={context.id}>
                        {context.id}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Selected area id">
                  <input
                    className={inputClass}
                    value={contextDraft.selectedAreaId}
                    onChange={(event) => setContextDraft({ ...contextDraft, selectedAreaId: event.target.value })}
                  />
                </Field>
                <Field label="Latitude">
                  <input
                    className={inputClass}
                    value={String(contextDraft.userLatitude)}
                    onChange={(event) =>
                      setContextDraft({ ...contextDraft, userLatitude: Number.parseFloat(event.target.value) || 0 })
                    }
                  />
                </Field>
                <Field label="Longitude">
                  <input
                    className={inputClass}
                    value={String(contextDraft.userLongitude)}
                    onChange={(event) =>
                      setContextDraft({ ...contextDraft, userLongitude: Number.parseFloat(event.target.value) || 0 })
                    }
                  />
                </Field>
                <Field label="Online status label">
                  <input
                    className={inputClass}
                    value={contextDraft.onlineStatusLabel}
                    onChange={(event) => setContextDraft({ ...contextDraft, onlineStatusLabel: event.target.value })}
                  />
                </Field>
                <button
                  type="button"
                  className={buttonPrimaryClass}
                  onClick={() => {
                    updateUserContext(contextDraft.id, contextDraft);
                    setMessage(`User context ${contextDraft.id} berhasil disimpan.`);
                  }}
                >
                  Simpan user context
                </button>
              </div>
            </div>

            <div className="rounded-[28px] bg-slate-50 p-5">
              <PanelHeader
                eyebrow="Catatan"
                title="Pattern mock tetap sederhana"
                description="Runtime selection di admin console disimpan sebagai snapshot lokal browser untuk kebutuhan operasional mock. Jadi tim bisa menyiapkan data tanpa mengubah pattern mock publik yang sekarang."
              />
            </div>
          </div>

          <div className={`${panelClass} grid gap-5 lg:grid-cols-2`}>
            <div>
              <PanelHeader
                title="Linked appointments"
                description="Snapshot appointment yang berelasi ke customer terpilih."
                meta={[`${formatInteger(relatedAppointments.length)} appointment`]}
              />
              <div className="mt-4 space-y-3">
                {relatedAppointmentsPagination.pagedItems.map((appointment) => (
                  <div key={appointment.id} className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-sm font-semibold text-slate-950">{appointment.serviceSnapshot.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {appointment.id} · {appointment.status} · {appointment.scheduledTimeLabel}
                    </p>
                  </div>
                ))}
                {relatedAppointments.length === 0 ? (
                  <EmptyStateCard
                    title="Belum ada appointment terkait"
                    body="Customer ini belum punya appointment yang tercatat di snapshot admin."
                  />
                ) : null}
              </div>
              <PaginationControls
                itemLabel="appointment terkait"
                page={relatedAppointmentsPagination.page}
                pageCount={relatedAppointmentsPagination.pageCount}
                pageSize={relatedAppointmentsPagination.pageSize}
                rangeEnd={relatedAppointmentsPagination.rangeEnd}
                rangeStart={relatedAppointmentsPagination.rangeStart}
                setPage={relatedAppointmentsPagination.setPage}
                setPageSize={relatedAppointmentsPagination.setPageSize}
                totalCount={relatedAppointmentsPagination.totalCount}
              />
            </div>

            <div>
              <PanelHeader
                title="Linked support tickets"
                description="Ticket support yang cocok dengan nama atau nomor customer terpilih."
                meta={[`${formatInteger(relatedTickets.length)} ticket`]}
              />
              <div className="mt-4 space-y-3">
                {relatedTicketsPagination.pagedItems.map((ticket) => (
                  <div key={ticket.id} className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-sm font-semibold text-slate-950">{ticket.summary}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {ticket.id} · {ticket.status} · {ticket.urgency}
                    </p>
                  </div>
                ))}
                {relatedTickets.length === 0 ? (
                  <EmptyStateCard
                    title="Belum ada ticket yang cocok"
                    body="Support desk belum menemukan ticket yang match ke nama atau nomor customer ini."
                  />
                ) : null}
              </div>
              <PaginationControls
                itemLabel="ticket terkait"
                page={relatedTicketsPagination.page}
                pageCount={relatedTicketsPagination.pageCount}
                pageSize={relatedTicketsPagination.pageSize}
                rangeEnd={relatedTicketsPagination.rangeEnd}
                rangeStart={relatedTicketsPagination.rangeStart}
                setPage={relatedTicketsPagination.setPage}
                setPageSize={relatedTicketsPagination.setPageSize}
                totalCount={relatedTicketsPagination.totalCount}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export const AdminProfessionalsScreen = () => {
  const {
    appointments,
    createProfessional,
    deleteProfessional,
    getServicesForProfessional,
    professionals,
    updateProfessional,
  } = useAdminConsoleData();
  const {
    activeProfessional,
    applyProfessionalAdminReviewBatch,
    publishProfessionalProfile,
    publishProfessionalProfiles,
    reviewStatesByProfessionalId,
    simulateProfessionalAdminReview,
    submitProfessionalProfileForReview,
    switchProfessionalProfile,
  } = useProfessionalPortal();
  const [rosterAvailabilityFilter, setRosterAvailabilityFilter] = useState<'all' | 'available' | 'offline'>('all');
  const [rosterReviewFilter, setRosterReviewFilter] = useState<
    'all' | 'changes_requested' | 'draft' | 'local_draft' | 'published' | 'ready_for_review' | 'submitted' | 'verified'
  >('all');
  const [rosterLocationFilter, setRosterLocationFilter] = useState<'all' | string>('all');
  const [queueSearchQuery, setQueueSearchQuery] = useState('');
  const [queueFilter, setQueueFilter] = useState<
    'all' | 'changes_requested' | 'ready_for_review' | 'submitted' | 'verified'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');
  const [selectedQueueIds, setSelectedQueueIds] = useState<string[]>([]);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState(professionals[0]?.id || '');
  const [professionalDraft, setProfessionalDraft] = useState(professionals[0]);
  const [savedQueueView, setSavedQueueView] = useStoredView('bidanapp:admin-view:professional-queue', {
    queueFilter: 'all' as 'all' | 'changes_requested' | 'ready_for_review' | 'submitted' | 'verified',
    queueSearchQuery: '',
    savedAt: '',
  });
  const [savedRosterView, setSavedRosterView] = useStoredView('bidanapp:admin-view:professional-roster', {
    rosterAvailabilityFilter: 'all' as 'all' | 'available' | 'offline',
    rosterLocationFilter: 'all',
    rosterReviewFilter: 'all' as
      | 'all'
      | 'changes_requested'
      | 'draft'
      | 'local_draft'
      | 'published'
      | 'ready_for_review'
      | 'submitted'
      | 'verified',
    savedAt: '',
    searchQuery: '',
  });
  const rosterLocationOptions = Array.from(
    new Set(professionals.map((professional) => professional.location).filter(Boolean)),
  ).sort((leftLocation, rightLocation) => leftLocation.localeCompare(rightLocation));
  const filteredProfessionals = professionals.filter((professional) => {
    const reviewState = reviewStatesByProfessionalId[professional.id];
    const resolvedReviewStatus = reviewState?.status || 'local_draft';
    const matchesAvailability =
      rosterAvailabilityFilter === 'all'
        ? true
        : rosterAvailabilityFilter === 'available'
          ? professional.isAvailable
          : !professional.isAvailable;
    const matchesReview = rosterReviewFilter === 'all' ? true : resolvedReviewStatus === rosterReviewFilter;
    const matchesLocation = rosterLocationFilter === 'all' ? true : professional.location === rosterLocationFilter;
    const searchValue = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !searchValue ||
      professional.name.toLowerCase().includes(searchValue) ||
      professional.title.toLowerCase().includes(searchValue) ||
      professional.slug.toLowerCase().includes(searchValue) ||
      professional.id.toLowerCase().includes(searchValue);

    return matchesAvailability && matchesReview && matchesLocation && matchesSearch;
  });
  const professionalRosterPagination = usePaginatedItems(filteredProfessionals, 6);
  const approvalQueueEntries = professionals
    .map((professional) => {
      const reviewState = reviewStatesByProfessionalId[professional.id];

      if (!reviewState || reviewState.status === 'published' || reviewState.status === 'draft') {
        return null;
      }

      return {
        ageLabel: formatQueueAge(reviewState.submittedAt || reviewState.reviewedAt),
        professional,
        reviewState,
        sortTimestamp: getReviewStateSortTimestamp(reviewState),
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .sort((leftEntry, rightEntry) => {
      const statusDelta =
        (approvalStatusRank[leftEntry.reviewState.status] ?? Number.MAX_SAFE_INTEGER) -
        (approvalStatusRank[rightEntry.reviewState.status] ?? Number.MAX_SAFE_INTEGER);

      if (statusDelta !== 0) {
        return statusDelta;
      }

      return leftEntry.sortTimestamp - rightEntry.sortTimestamp;
    });
  const filteredApprovalQueue = approvalQueueEntries.filter((entry) => {
    const matchesFilter = queueFilter === 'all' ? true : entry.reviewState.status === queueFilter;
    const searchValue = queueSearchQuery.trim().toLowerCase();
    const matchesSearch =
      !searchValue ||
      entry.professional.name.toLowerCase().includes(searchValue) ||
      entry.professional.title.toLowerCase().includes(searchValue) ||
      entry.professional.id.toLowerCase().includes(searchValue) ||
      entry.reviewState.status.toLowerCase().includes(searchValue);

    return matchesFilter && matchesSearch;
  });
  const approvalQueuePagination = usePaginatedItems(filteredApprovalQueue, 5);

  const selectedProfessional =
    professionals.find((professional) => professional.id === selectedProfessionalId) || professionals[0];

  useEffect(() => {
    if (
      (!selectedProfessionalId || !professionals.some((professional) => professional.id === selectedProfessionalId)) &&
      professionals[0]?.id
    ) {
      setSelectedProfessionalId(professionals[0].id);
    }
  }, [professionals, selectedProfessionalId]);

  useEffect(() => {
    setProfessionalDraft(selectedProfessional);
  }, [selectedProfessional]);

  useEffect(() => {
    if (
      selectedProfessionalId &&
      reviewStatesByProfessionalId[selectedProfessionalId] &&
      activeProfessional?.id !== selectedProfessionalId
    ) {
      switchProfessionalProfile(selectedProfessionalId);
    }
  }, [activeProfessional?.id, reviewStatesByProfessionalId, selectedProfessionalId, switchProfessionalProfile]);

  const selectedReviewState = reviewStatesByProfessionalId[selectedProfessionalId] || { status: 'draft' };
  const relatedServices = getServicesForProfessional(selectedProfessionalId);
  const relatedAppointments = appointments.filter(
    (appointment) => appointment.professionalId === selectedProfessionalId,
  );
  const isPortalManaged = Boolean(reviewStatesByProfessionalId[selectedProfessionalId]);
  const isSynced = isPortalManaged && activeProfessional?.id === selectedProfessionalId;
  const submittedApprovalQueue = approvalQueueEntries.filter((entry) => entry.reviewState.status === 'submitted');
  const verifiedApprovalQueue = approvalQueueEntries.filter((entry) => entry.reviewState.status === 'verified');
  const revisionQueue = approvalQueueEntries.filter((entry) => entry.reviewState.status === 'changes_requested');
  const oldestApprovalEntry = submittedApprovalQueue[0] || verifiedApprovalQueue[0] || filteredApprovalQueue[0] || null;
  const professionalRosterResetKey = [
    rosterAvailabilityFilter,
    rosterLocationFilter,
    rosterReviewFilter,
    searchQuery.trim(),
  ].join('|');
  const approvalQueueResetKey = [queueFilter, queueSearchQuery.trim()].join('|');

  useEffect(() => {
    resetPaginationPage(professionalRosterPagination.setPage, professionalRosterResetKey);
  }, [professionalRosterPagination.setPage, professionalRosterResetKey]);

  useEffect(() => {
    resetPaginationPage(approvalQueuePagination.setPage, approvalQueueResetKey);
  }, [approvalQueuePagination.setPage, approvalQueueResetKey]);

  useEffect(() => {
    setSelectedQueueIds((currentIds) =>
      currentIds.filter((professionalId) =>
        filteredApprovalQueue.some((entry) => entry.professional.id === professionalId),
      ),
    );
  }, [filteredApprovalQueue]);

  useEffect(() => {
    if (
      filteredProfessionals.length > 0 &&
      !filteredProfessionals.some((professional) => professional.id === selectedProfessionalId)
    ) {
      setSelectedProfessionalId(filteredProfessionals[0].id);
    }
  }, [filteredProfessionals, selectedProfessionalId]);

  if (!selectedProfessional || !professionalDraft) {
    return null;
  }

  const activeQueueFilters = [
    queueSearchQuery.trim() ? `search:${queueSearchQuery.trim()}` : '',
    queueFilter !== 'all' ? `status:${queueFilter}` : '',
  ].filter(Boolean);
  const activeRosterFilters = [
    searchQuery.trim() ? `search:${searchQuery.trim()}` : '',
    rosterReviewFilter !== 'all' ? `review:${rosterReviewFilter}` : '',
    rosterAvailabilityFilter !== 'all' ? `availability:${rosterAvailabilityFilter}` : '',
    rosterLocationFilter !== 'all' ? `location:${rosterLocationFilter}` : '',
  ].filter(Boolean);

  const handleCreateProfessional = () => {
    const nextProfessional = createProfessional();

    if (nextProfessional) {
      setSelectedProfessionalId(nextProfessional.id);
      setMessage(
        `Profesional baru ${nextProfessional.id} ditambahkan. Profil ini masih lokal sampai dihubungkan ke portal mock.`,
      );
    }
  };

  const handleDeleteProfessional = () => {
    const result = deleteProfessional(selectedProfessional.id);
    setMessage(result.message);
  };

  const handleBulkQueueReview = (status: 'changes_requested' | 'verified') => {
    const updatedCount = applyProfessionalAdminReviewBatch(selectedQueueIds, status);

    setMessage(
      updatedCount > 0
        ? `${formatInteger(updatedCount)} profesional berhasil diubah ke ${status}.`
        : 'Tidak ada profesional selected yang bisa diproses dengan status itu.',
    );

    if (updatedCount > 0) {
      setSelectedQueueIds([]);
    }
  };

  const handleBulkQueuePublish = () => {
    const updatedCount = publishProfessionalProfiles(selectedQueueIds);

    setMessage(
      updatedCount > 0
        ? `${formatInteger(updatedCount)} profesional berhasil dipublish dari antrean bulk.`
        : 'Tidak ada profesional selected yang siap dipublish.',
    );

    if (updatedCount > 0) {
      setSelectedQueueIds([]);
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Professionals"
        title="Review dan kontrol profesional"
        description="Edit profil publik demo, pantau approval queue FIFO, dan jalankan aksi changes requested, verified, atau publish dari state professional portal mock yang sudah ada."
      />

      <section className={`${panelClass} grid gap-5 xl:grid-cols-[0.95fr_1.05fr]`}>
        <div>
          <PanelHeader
            eyebrow="Approval Queue"
            title="Antrian review FIFO profesional"
            description="Queue approval menempatkan admin pada backlog review yang paling perlu diproses terlebih dulu."
            meta={[
              `${formatInteger(filteredApprovalQueue.length)} item`,
              `${formatInteger(submittedApprovalQueue.length)} submitted`,
            ]}
          />
          <div className="mt-4 grid gap-3">
            <input
              className={inputClass}
              value={queueSearchQuery}
              onChange={(event) => setQueueSearchQuery(event.target.value)}
              placeholder="Cari nama, title, id, atau status approval."
            />
            <select
              className={inputClass}
              value={queueFilter}
              onChange={(event) => setQueueFilter(event.target.value as typeof queueFilter)}
            >
              <option value="all">Semua status approval</option>
              <option value="submitted">Butuh review admin</option>
              <option value="verified">Siap publish</option>
              <option value="changes_requested">Menunggu revisi profesional</option>
              <option value="ready_for_review">Ready for review</option>
            </select>
          </div>
          <FilterSummaryBar
            itemLabel="item approval"
            totalCount={filteredApprovalQueue.length}
            activeFilters={activeQueueFilters}
            action={
              <>
                <button
                  type="button"
                  className={buttonSecondaryClass}
                  onClick={() =>
                    setSavedQueueView({
                      queueFilter,
                      queueSearchQuery,
                      savedAt: new Date().toISOString(),
                    })
                  }
                >
                  Simpan view
                </button>
                {savedQueueView.savedAt ? (
                  <button
                    type="button"
                    className={buttonSecondaryClass}
                    onClick={() => {
                      setQueueFilter(savedQueueView.queueFilter);
                      setQueueSearchQuery(savedQueueView.queueSearchQuery);
                    }}
                  >
                    Muat view
                  </button>
                ) : null}
              </>
            }
            onClear={() => {
              setQueueSearchQuery('');
              setQueueFilter('all');
            }}
          />
          <BulkActionBar
            label="profesional queue"
            count={selectedQueueIds.length}
            onSelectPage={() =>
              setSelectedQueueIds((currentIds) =>
                Array.from(
                  new Set([...currentIds, ...approvalQueuePagination.pagedItems.map((entry) => entry.professional.id)]),
                ),
              )
            }
            onClear={() => setSelectedQueueIds([])}
            action={
              <>
                <button
                  type="button"
                  className={buttonSecondaryClass}
                  onClick={() => handleBulkQueueReview('verified')}
                >
                  Bulk verified
                </button>
                <button
                  type="button"
                  className={buttonSecondaryClass}
                  onClick={() => handleBulkQueueReview('changes_requested')}
                >
                  Bulk revisi
                </button>
                <button type="button" className={buttonPrimaryClass} onClick={handleBulkQueuePublish}>
                  Bulk publish
                </button>
              </>
            }
          />

          <div className="mt-5 space-y-3">
            {approvalQueuePagination.pagedItems.map((entry, index) => (
              <SelectableListButton
                key={entry.professional.id}
                active={entry.professional.id === selectedProfessionalId}
                checked={selectedQueueIds.includes(entry.professional.id)}
                detail={`Submitted ${formatDateTime(entry.reviewState.submittedAt)} · Reviewer ${entry.reviewState.reviewerName || '-'}`}
                onToggle={() =>
                  setSelectedQueueIds((currentIds) =>
                    currentIds.includes(entry.professional.id)
                      ? currentIds.filter((professionalId) => professionalId !== entry.professional.id)
                      : [...currentIds, entry.professional.id],
                  )
                }
                onClick={() => setSelectedProfessionalId(entry.professional.id)}
                subtitle={`${entry.professional.title} · ${entry.reviewState.status} · ${entry.ageLabel}`}
                title={`#${approvalQueuePagination.rangeStart + index} · ${entry.professional.name}`}
              />
            ))}
            {filteredApprovalQueue.length === 0 ? (
              <EmptyStateCard
                title="Queue approval kosong"
                body="Belum ada profesional yang masuk antrean sesuai filter ini. Coba reset filter atau ajukan profil lain ke review."
              />
            ) : null}
            <PaginationControls
              itemLabel="item approval"
              page={approvalQueuePagination.page}
              pageCount={approvalQueuePagination.pageCount}
              pageSize={approvalQueuePagination.pageSize}
              rangeEnd={approvalQueuePagination.rangeEnd}
              rangeStart={approvalQueuePagination.rangeStart}
              setPage={approvalQueuePagination.setPage}
              setPageSize={approvalQueuePagination.setPageSize}
              totalCount={approvalQueuePagination.totalCount}
            />
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              icon={<Workflow className="h-5 w-5" />}
              title="Menunggu Review"
              value={formatInteger(submittedApprovalQueue.length)}
              detail="Profil submitted yang harus diproses admin sesuai FIFO."
            />
            <StatCard
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Siap Publish"
              value={formatInteger(verifiedApprovalQueue.length)}
              detail="Profil verified yang tinggal dipublish ke publik."
            />
            <StatCard
              icon={<CircleAlert className="h-5 w-5" />}
              title="Revisi Aktif"
              value={formatInteger(revisionQueue.length)}
              detail="Profil yang sudah dikembalikan ke profesional untuk perbaikan."
            />
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Kontrol FIFO</p>
            <h3 className="mt-2 text-lg font-bold text-slate-950">
              {oldestApprovalEntry
                ? `Prioritas saat ini: ${oldestApprovalEntry.professional.name}`
                : 'Belum ada backlog approval'}
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Queue ini menempatkan status `submitted` paling atas, lalu `verified`, lalu `changes_requested`. Di dalam
              tiap status, urutan memakai timestamp `submittedAt` terlama terlebih dulu supaya approval dan publish
              tetap terkontrol.
            </p>
            {oldestApprovalEntry ? (
              <div className="mt-4 rounded-[22px] bg-white px-4 py-4">
                <p className="text-sm font-semibold text-slate-950">
                  {oldestApprovalEntry.professional.id} · {oldestApprovalEntry.professional.title}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {oldestApprovalEntry.reviewState.status} · submitted{' '}
                  {formatDateTime(oldestApprovalEntry.reviewState.submittedAt)}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {oldestApprovalEntry.reviewState.adminNote ||
                    'Belum ada admin note. Buka profil untuk menjalankan keputusan review.'}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.88fr_1.12fr]">
        <div className={panelClass}>
          <PanelHeader
            title="Roster profesional"
            description="Gunakan roster untuk pindah profil, audit status review, dan edit metadata profesional."
            meta={[
              `${formatInteger(filteredProfessionals.length)} hasil`,
              `${formatInteger(professionals.length)} total roster`,
            ]}
            action={
              <button type="button" className={buttonSecondaryClass} onClick={handleCreateProfessional}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah profesional
              </button>
            }
          />
          <div className="mt-4 flex flex-col gap-3">
            <input
              className={inputClass}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Cari nama, slug, title, atau id profesional."
            />
            <div className="grid gap-3 md:grid-cols-3">
              <select
                className={inputClass}
                value={rosterReviewFilter}
                onChange={(event) => setRosterReviewFilter(event.target.value as typeof rosterReviewFilter)}
              >
                <option value="all">Semua status review</option>
                <option value="local_draft">Local draft</option>
                <option value="draft">Draft portal</option>
                <option value="ready_for_review">Ready for review</option>
                <option value="submitted">Submitted</option>
                <option value="changes_requested">Changes requested</option>
                <option value="verified">Verified</option>
                <option value="published">Published</option>
              </select>
              <select
                className={inputClass}
                value={rosterAvailabilityFilter}
                onChange={(event) => setRosterAvailabilityFilter(event.target.value as typeof rosterAvailabilityFilter)}
              >
                <option value="all">Semua availability</option>
                <option value="available">Sedang available</option>
                <option value="offline">Tidak available</option>
              </select>
              <select
                className={inputClass}
                value={rosterLocationFilter}
                onChange={(event) => setRosterLocationFilter(event.target.value)}
              >
                <option value="all">Semua lokasi</option>
                {rosterLocationOptions.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <FilterSummaryBar
            itemLabel="profesional"
            totalCount={filteredProfessionals.length}
            activeFilters={activeRosterFilters}
            action={
              <>
                <button
                  type="button"
                  className={buttonSecondaryClass}
                  onClick={() =>
                    setSavedRosterView({
                      rosterAvailabilityFilter,
                      rosterLocationFilter,
                      rosterReviewFilter,
                      savedAt: new Date().toISOString(),
                      searchQuery,
                    })
                  }
                >
                  Simpan view
                </button>
                {savedRosterView.savedAt ? (
                  <button
                    type="button"
                    className={buttonSecondaryClass}
                    onClick={() => {
                      setSearchQuery(savedRosterView.searchQuery);
                      setRosterReviewFilter(savedRosterView.rosterReviewFilter);
                      setRosterAvailabilityFilter(savedRosterView.rosterAvailabilityFilter);
                      setRosterLocationFilter(savedRosterView.rosterLocationFilter);
                    }}
                  >
                    Muat view
                  </button>
                ) : null}
              </>
            }
            onClear={() => {
              setSearchQuery('');
              setRosterReviewFilter('all');
              setRosterAvailabilityFilter('all');
              setRosterLocationFilter('all');
            }}
          />
          <div className="mt-5 space-y-3">
            {professionalRosterPagination.pagedItems.map((professional) => {
              const reviewState = reviewStatesByProfessionalId[professional.id];

              return (
                <ListButton
                  key={professional.id}
                  active={professional.id === selectedProfessionalId}
                  title={professional.name}
                  subtitle={`${professional.title} · ${reviewState?.status || 'local_draft'}`}
                  onClick={() => setSelectedProfessionalId(professional.id)}
                />
              );
            })}
            {filteredProfessionals.length === 0 ? (
              <EmptyStateCard
                title="Tidak ada profesional yang cocok"
                body="Sesuaikan kombinasi review state, availability, lokasi, atau kata kunci pencarian."
              />
            ) : null}
            <PaginationControls
              itemLabel="profesional"
              page={professionalRosterPagination.page}
              pageCount={professionalRosterPagination.pageCount}
              pageSize={professionalRosterPagination.pageSize}
              rangeEnd={professionalRosterPagination.rangeEnd}
              rangeStart={professionalRosterPagination.rangeStart}
              setPage={professionalRosterPagination.setPage}
              setPageSize={professionalRosterPagination.setPageSize}
              totalCount={professionalRosterPagination.totalCount}
            />
          </div>
        </div>

        <div className="space-y-5">
          <MessageBanner message={message} />

          <div className={panelClass}>
            <div className="grid gap-4 md:grid-cols-3">
              <StatCard
                icon={<Stethoscope className="h-5 w-5" />}
                title="Professional"
                value={selectedProfessional.name}
                detail={selectedProfessional.title}
              />
              <StatCard
                icon={<Workflow className="h-5 w-5" />}
                title="Review state"
                value={selectedReviewState?.status || 'published'}
                detail={`Sync portal ${isSynced ? 'aktif' : 'menunggu'} untuk aksi review.`}
              />
              <StatCard
                icon={<Activity className="h-5 w-5" />}
                title="Ops"
                value={`${relatedServices.length} / ${relatedAppointments.length}`}
                detail="Service offerings / appointment terkait profesional ini."
              />
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <PanelHeader
              eyebrow="Selected professional"
              title={selectedProfessional.name}
              description={`${selectedProfessional.title} · ${selectedProfessional.location}`}
              meta={[
                `review ${selectedReviewState?.status || 'published'}`,
                `${formatInteger(relatedServices.length)} offering`,
                `${formatInteger(relatedAppointments.length)} appointment`,
              ]}
            />
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <CompactInsightCard
                label="Submitted"
                value={formatDateTime(selectedReviewState.submittedAt)}
                detail="Timestamp awal antrean review profesional."
              />
              <CompactInsightCard
                label="Reviewed"
                value={formatDateTime(selectedReviewState.reviewedAt)}
                detail={`Reviewer ${selectedReviewState.reviewerName || '-'}`}
              />
            </div>
          </div>

          <div className={`${panelClass} grid gap-5 lg:grid-cols-[1.05fr_0.95fr]`}>
            <div className="grid gap-4">
              <PanelHeader
                title="Edit profil profesional"
                description="Perbarui metadata publik, availability, dan trust signal dasar untuk profesional terpilih."
              />
              <Field label="Nama">
                <input
                  className={inputClass}
                  value={professionalDraft.name}
                  onChange={(event) => setProfessionalDraft({ ...professionalDraft, name: event.target.value })}
                />
              </Field>
              <Field label="Slug">
                <input
                  className={inputClass}
                  value={professionalDraft.slug}
                  onChange={(event) => setProfessionalDraft({ ...professionalDraft, slug: event.target.value })}
                />
              </Field>
              <Field label="Title">
                <input
                  className={inputClass}
                  value={professionalDraft.title}
                  onChange={(event) => setProfessionalDraft({ ...professionalDraft, title: event.target.value })}
                />
              </Field>
              <Field label="Location">
                <input
                  className={inputClass}
                  value={professionalDraft.location}
                  onChange={(event) => setProfessionalDraft({ ...professionalDraft, location: event.target.value })}
                />
              </Field>
              <Field label="Response time">
                <input
                  className={inputClass}
                  value={professionalDraft.responseTime}
                  onChange={(event) => setProfessionalDraft({ ...professionalDraft, responseTime: event.target.value })}
                />
              </Field>
              <Field label="Badge label">
                <input
                  className={inputClass}
                  value={professionalDraft.badgeLabel}
                  onChange={(event) => setProfessionalDraft({ ...professionalDraft, badgeLabel: event.target.value })}
                />
              </Field>
              <Field label="Experience">
                <input
                  className={inputClass}
                  value={professionalDraft.experience}
                  onChange={(event) => setProfessionalDraft({ ...professionalDraft, experience: event.target.value })}
                />
              </Field>
              <Field label="Clients served">
                <input
                  className={inputClass}
                  value={professionalDraft.clientsServed}
                  onChange={(event) =>
                    setProfessionalDraft({ ...professionalDraft, clientsServed: event.target.value })
                  }
                />
              </Field>
              <Field label="Rating">
                <input
                  className={inputClass}
                  value={String(professionalDraft.rating)}
                  onChange={(event) =>
                    setProfessionalDraft({ ...professionalDraft, rating: Number.parseFloat(event.target.value) || 0 })
                  }
                />
              </Field>
              <Field label="Profile image">
                <input
                  className={inputClass}
                  value={professionalDraft.image}
                  onChange={(event) => setProfessionalDraft({ ...professionalDraft, image: event.target.value })}
                />
              </Field>
              <Field label="Cover image">
                <input
                  className={inputClass}
                  value={professionalDraft.coverImage || ''}
                  onChange={(event) =>
                    setProfessionalDraft({ ...professionalDraft, coverImage: event.target.value || null })
                  }
                />
              </Field>
              <Field label="About">
                <textarea
                  className={textareaClass}
                  value={professionalDraft.about}
                  onChange={(event) => setProfessionalDraft({ ...professionalDraft, about: event.target.value })}
                />
              </Field>
              <label className="inline-flex items-center gap-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={professionalDraft.isAvailable}
                  onChange={(event) =>
                    setProfessionalDraft({ ...professionalDraft, isAvailable: event.target.checked })
                  }
                />
                Terima klien baru
              </label>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className={buttonPrimaryClass}
                  onClick={() => {
                    updateProfessional(selectedProfessional.id, professionalDraft);
                    setMessage(`Profil profesional ${selectedProfessional.id} berhasil disimpan.`);
                  }}
                >
                  Simpan profil profesional
                </button>
                <button type="button" className={buttonSecondaryClass} onClick={handleDeleteProfessional}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus profesional
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[28px] bg-slate-50 p-5">
                <PanelHeader
                  eyebrow="Review actions"
                  title="Kontrol lifecycle approval"
                  description="Jalankan submit, changes requested, verified, dan publish dari state portal mock yang sinkron."
                />
                <div className="mt-4 grid gap-3">
                  <button
                    type="button"
                    className={buttonSecondaryClass}
                    disabled={!isSynced}
                    onClick={() =>
                      setMessage(
                        submitProfessionalProfileForReview()
                          ? 'Profil berhasil diajukan ke review admin.'
                          : 'Profil belum siap diajukan. Lengkapi requirement onboarding dulu.',
                      )
                    }
                  >
                    Ajukan ke review
                  </button>
                  <button
                    type="button"
                    className={buttonSecondaryClass}
                    disabled={!isSynced}
                    onClick={() =>
                      setMessage(
                        simulateProfessionalAdminReview('changes_requested')
                          ? 'Admin mengembalikan profil ke profesional untuk revisi.'
                          : 'Status saat ini belum bisa diubah ke changes requested.',
                      )
                    }
                  >
                    Minta revisi
                  </button>
                  <button
                    type="button"
                    className={buttonSecondaryClass}
                    disabled={!isSynced}
                    onClick={() =>
                      setMessage(
                        simulateProfessionalAdminReview('verified')
                          ? 'Profil berhasil ditandai verified dan masuk antrean publish.'
                          : 'Status saat ini belum bisa diverifikasi.',
                      )
                    }
                  >
                    Tandai verified
                  </button>
                  <button
                    type="button"
                    className={buttonPrimaryClass}
                    disabled={!isSynced}
                    onClick={() =>
                      setMessage(
                        publishProfessionalProfile()
                          ? 'Profil profesional berhasil dipublish.'
                          : 'Profil harus verified lebih dulu sebelum dipublish.',
                      )
                    }
                  >
                    Publish profil
                  </button>
                </div>
                {!isPortalManaged ? (
                  <p className="mt-3 text-xs text-amber-600">
                    Profil ini belum terhubung ke state professional portal mock. Review action hanya aktif untuk roster
                    portal yang sudah ada.
                  </p>
                ) : !isSynced ? (
                  <p className="mt-3 text-xs text-amber-600">
                    Menunggu switch ke profesional ini di professional portal demo.
                  </p>
                ) : null}
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                <PanelHeader
                  eyebrow="Service offerings"
                  title="Layanan terkait profesional"
                  description="Offering ini membantu admin membaca kesiapan katalog dan kapasitas profesional yang dipilih."
                />
                <div className="mt-4 space-y-3">
                  {relatedServices.map((service) => (
                    <div key={service.id} className="rounded-[22px] bg-slate-50 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">{service.serviceId}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {service.duration} · {service.price} · {service.bookingFlow}
                      </p>
                    </div>
                  ))}
                  {relatedServices.length === 0 ? (
                    <EmptyStateCard
                      title="Belum ada service offering"
                      body="Profesional ini belum punya service offering di katalog admin."
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export const AdminServicesScreen = () => {
  const {
    categories,
    createCategory,
    createProfessionalServiceOffering,
    createService,
    deleteCategory,
    deleteProfessionalServiceOffering,
    deleteService,
    getProvidersCountForService,
    professionalServiceOfferings,
    professionals,
    services,
    updateCategory,
    updateProfessionalServiceOffering,
    updateService,
  } = useAdminConsoleData();
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all');
  const [modeFilter, setModeFilter] = useState<'all' | 'online' | 'home_visit' | 'onsite'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id || '');
  const [selectedOfferingId, setSelectedOfferingId] = useState('');
  const [newOfferingProfessionalId, setNewOfferingProfessionalId] = useState(professionals[0]?.id || '');
  const [serviceDraft, setServiceDraft] = useState(services[0]);
  const [categoryDraft, setCategoryDraft] = useState(categories[0]);
  const [offeringDraft, setOfferingDraft] = useState<null | (typeof professionalServiceOfferings)[number]>(null);
  const [savedServicesView, setSavedServicesView] = useStoredView('bidanapp:admin-view:services', {
    categoryFilter: 'all' as 'all' | string,
    modeFilter: 'all' as 'all' | 'online' | 'home_visit' | 'onsite',
    savedAt: '',
    searchQuery: '',
    selectedOfferingId: '',
    selectedServiceId: '',
  });
  const filteredServices = services.filter((service) => {
    const matchesCategory = categoryFilter === 'all' ? true : service.categoryId === categoryFilter;
    const matchesMode =
      modeFilter === 'all'
        ? true
        : modeFilter === 'online'
          ? service.serviceModes.online
          : modeFilter === 'home_visit'
            ? service.serviceModes.homeVisit
            : service.serviceModes.onsite;
    const searchValue = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !searchValue ||
      service.name.toLowerCase().includes(searchValue) ||
      service.slug.toLowerCase().includes(searchValue) ||
      service.id.toLowerCase().includes(searchValue) ||
      service.tags.some((tag) => tag.toLowerCase().includes(searchValue));

    return matchesCategory && matchesMode && matchesSearch;
  });
  const serviceListPagination = usePaginatedItems(filteredServices, 6);

  const selectedService = services.find((service) => service.id === selectedServiceId) || services[0];
  const selectedCategory = categories.find((category) => category.id === selectedService?.categoryId) || categories[0];
  const relatedOfferings = professionalServiceOfferings.filter(
    (offering) => offering.serviceId === selectedService?.id,
  );
  const offeringPagination = usePaginatedItems(relatedOfferings, 5);
  const selectedOffering =
    relatedOfferings.find((offering) => offering.id === selectedOfferingId) || relatedOfferings[0] || null;
  const visibleOfferingOptions =
    selectedOffering && !offeringPagination.pagedItems.some((offering) => offering.id === selectedOffering.id)
      ? [selectedOffering, ...offeringPagination.pagedItems]
      : offeringPagination.pagedItems;
  const serviceListResetKey = [categoryFilter, modeFilter, searchQuery.trim()].join('|');
  const serviceOfferingResetKey = selectedService?.id || 'none';

  useEffect(() => {
    if ((!selectedServiceId || !services.some((service) => service.id === selectedServiceId)) && services[0]?.id) {
      setSelectedServiceId(services[0].id);
    }
  }, [selectedServiceId, services]);

  useEffect(() => {
    if (
      (!newOfferingProfessionalId ||
        !professionals.some((professional) => professional.id === newOfferingProfessionalId)) &&
      professionals[0]?.id
    ) {
      setNewOfferingProfessionalId(professionals[0].id);
    }
  }, [newOfferingProfessionalId, professionals]);

  useEffect(() => {
    resetPaginationPage(serviceListPagination.setPage, serviceListResetKey);
  }, [serviceListPagination.setPage, serviceListResetKey]);

  useEffect(() => {
    if (filteredServices.length > 0 && !filteredServices.some((service) => service.id === selectedServiceId)) {
      setSelectedServiceId(filteredServices[0].id);
    }
  }, [filteredServices, selectedServiceId]);

  useEffect(() => {
    resetPaginationPage(offeringPagination.setPage, serviceOfferingResetKey);
  }, [offeringPagination.setPage, serviceOfferingResetKey]);

  useEffect(() => {
    setServiceDraft(selectedService);
  }, [selectedService]);

  useEffect(() => {
    setCategoryDraft(selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    setSelectedOfferingId(selectedOffering?.id || '');
    setOfferingDraft(selectedOffering);
  }, [selectedOffering]);

  if (!selectedService || !serviceDraft || !categoryDraft) {
    return null;
  }

  const activeServiceFilters = [
    searchQuery.trim() ? `search:${searchQuery.trim()}` : '',
    categoryFilter !== 'all' ? `category:${categoryFilter}` : '',
    modeFilter !== 'all' ? `mode:${modeFilter}` : '',
  ].filter(Boolean);

  const handleCreateService = () => {
    const nextService = createService(selectedCategory?.id);

    if (nextService) {
      setSelectedServiceId(nextService.id);
      setMessage(`Service baru ${nextService.id} ditambahkan ke katalog admin.`);
    }
  };

  const handleDeleteService = () => {
    const result = deleteService(selectedService.id);
    setMessage(result.message);
  };

  const handleCreateCategory = () => {
    const nextCategory = createCategory();

    if (nextCategory) {
      setCategoryDraft(nextCategory);
      setMessage(`Category baru ${nextCategory.id} ditambahkan.`);
    }
  };

  const handleDeleteCategory = () => {
    const result = deleteCategory(categoryDraft.id);
    setMessage(result.message);
  };

  const handleCreateOffering = () => {
    const existingOffering = relatedOfferings.find((offering) => offering.professionalId === newOfferingProfessionalId);

    if (existingOffering) {
      setSelectedOfferingId(existingOffering.id);
      setMessage(`Offering untuk profesional ${newOfferingProfessionalId} sudah ada pada service ini.`);
      return;
    }

    const nextOffering = createProfessionalServiceOffering({
      professionalId: newOfferingProfessionalId,
      serviceId: selectedService.id,
    });

    if (nextOffering) {
      setSelectedOfferingId(nextOffering.id);
      setMessage(`Offering baru ${nextOffering.id} ditambahkan untuk service ${selectedService.id}.`);
    }
  };

  const handleDeleteOffering = () => {
    if (!offeringDraft) {
      setMessage('Pilih offering yang ingin dihapus.');
      return;
    }

    const result = deleteProfessionalServiceOffering(offeringDraft.id);
    setMessage(result.message);
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Services"
        title="Catalog global dan provider relation"
        description="Kelola metadata service, kategori, dan service offering per profesional yang mempengaruhi explore, detail service, dan public profile."
      />

      <section className="grid gap-5 xl:grid-cols-[0.88fr_1.12fr]">
        <div className={panelClass}>
          <PanelHeader
            title="Daftar service"
            description="Audit service global, coverage kategori, dan provider relation sebelum masuk ke editor detail."
            meta={[`${formatInteger(filteredServices.length)} hasil`, `${formatInteger(categories.length)} kategori`]}
            action={
              <button type="button" className={buttonSecondaryClass} onClick={handleCreateService}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah service
              </button>
            }
          />
          <div className="mt-4 flex flex-col gap-3">
            <input
              className={inputClass}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Cari service, slug, id, atau tag."
            />
            <div className="grid gap-3 md:grid-cols-2">
              <select
                className={inputClass}
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option value="all">Semua category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <select
                className={inputClass}
                value={modeFilter}
                onChange={(event) => setModeFilter(event.target.value as typeof modeFilter)}
              >
                <option value="all">Semua mode</option>
                <option value="online">online</option>
                <option value="home_visit">home_visit</option>
                <option value="onsite">onsite</option>
              </select>
            </div>
          </div>
          <FilterSummaryBar
            itemLabel="service"
            totalCount={filteredServices.length}
            activeFilters={activeServiceFilters}
            action={
              <>
                <button
                  type="button"
                  className={buttonSecondaryClass}
                  onClick={() =>
                    setSavedServicesView({
                      categoryFilter,
                      modeFilter,
                      savedAt: new Date().toISOString(),
                      searchQuery,
                      selectedOfferingId,
                      selectedServiceId,
                    })
                  }
                >
                  Simpan view
                </button>
                {savedServicesView.savedAt ? (
                  <button
                    type="button"
                    className={buttonSecondaryClass}
                    onClick={() => {
                      setSearchQuery(savedServicesView.searchQuery);
                      setCategoryFilter(savedServicesView.categoryFilter);
                      setModeFilter(savedServicesView.modeFilter);
                      setSelectedServiceId(savedServicesView.selectedServiceId);
                      setSelectedOfferingId(savedServicesView.selectedOfferingId);
                    }}
                  >
                    Muat view
                  </button>
                ) : null}
              </>
            }
            onClear={() => {
              setSearchQuery('');
              setCategoryFilter('all');
              setModeFilter('all');
            }}
          />
          <div className="mt-5 space-y-3">
            {serviceListPagination.pagedItems.map((service) => (
              <ListButton
                key={service.id}
                active={service.id === selectedServiceId}
                title={service.name}
                subtitle={`${getProvidersCountForService(service.id)} provider · ${service.defaultMode}`}
                onClick={() => setSelectedServiceId(service.id)}
              />
            ))}
            {filteredServices.length === 0 ? (
              <EmptyStateCard
                title="Tidak ada service yang cocok"
                body="Reset filter kategori atau mode, atau tambahkan service baru ke katalog admin."
              />
            ) : null}
            <PaginationControls
              itemLabel="service"
              page={serviceListPagination.page}
              pageCount={serviceListPagination.pageCount}
              pageSize={serviceListPagination.pageSize}
              rangeEnd={serviceListPagination.rangeEnd}
              rangeStart={serviceListPagination.rangeStart}
              setPage={serviceListPagination.setPage}
              setPageSize={serviceListPagination.setPageSize}
              totalCount={serviceListPagination.totalCount}
            />
          </div>
        </div>

        <div className="space-y-5">
          <MessageBanner message={message} />

          <div className={panelClass}>
            <div className="grid gap-4 md:grid-cols-3">
              <StatCard
                icon={<Stethoscope className="h-5 w-5" />}
                title="Service"
                value={selectedService.name}
                detail={selectedService.slug}
              />
              <StatCard
                icon={<Workflow className="h-5 w-5" />}
                title="Category"
                value={selectedCategory.name}
                detail={selectedCategory.shortLabel}
              />
              <StatCard
                icon={<UsersRound className="h-5 w-5" />}
                title="Providers"
                value={formatInteger(relatedOfferings.length)}
                detail="Jumlah professional offering untuk service ini."
              />
            </div>
          </div>

          <div className={`${panelClass} grid gap-5 lg:grid-cols-[1.05fr_0.95fr]`}>
            <div className="grid gap-4">
              <PanelHeader
                title="Edit service"
                description="Perbarui metadata utama, visual, deskripsi, dan mode layanan untuk service terpilih."
              />
              <Field label="Nama service">
                <input
                  className={inputClass}
                  value={serviceDraft.name}
                  onChange={(event) => setServiceDraft({ ...serviceDraft, name: event.target.value })}
                />
              </Field>
              <Field label="Slug">
                <input
                  className={inputClass}
                  value={serviceDraft.slug}
                  onChange={(event) => setServiceDraft({ ...serviceDraft, slug: event.target.value })}
                />
              </Field>
              <Field label="Category">
                <select
                  className={inputClass}
                  value={serviceDraft.categoryId}
                  onChange={(event) => setServiceDraft({ ...serviceDraft, categoryId: event.target.value })}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Default mode">
                <select
                  className={inputClass}
                  value={serviceDraft.defaultMode}
                  onChange={(event) =>
                    setServiceDraft({
                      ...serviceDraft,
                      defaultMode: event.target.value as typeof serviceDraft.defaultMode,
                    })
                  }
                >
                  <option value="online">online</option>
                  <option value="home_visit">home_visit</option>
                  <option value="onsite">onsite</option>
                </select>
              </Field>
              <Field label="Short description">
                <textarea
                  className={textareaClass}
                  value={serviceDraft.shortDescription}
                  onChange={(event) => setServiceDraft({ ...serviceDraft, shortDescription: event.target.value })}
                />
              </Field>
              <Field label="Description">
                <textarea
                  className={textareaClass}
                  value={serviceDraft.description}
                  onChange={(event) => setServiceDraft({ ...serviceDraft, description: event.target.value })}
                />
              </Field>
              <Field label="Tags (comma separated)">
                <input
                  className={inputClass}
                  value={serviceDraft.tags.join(', ')}
                  onChange={(event) =>
                    setServiceDraft({
                      ...serviceDraft,
                      tags: event.target.value
                        .split(',')
                        .map((item) => item.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </Field>
              <Field label="Highlights (comma separated)">
                <input
                  className={inputClass}
                  value={serviceDraft.highlights.join(', ')}
                  onChange={(event) =>
                    setServiceDraft({
                      ...serviceDraft,
                      highlights: event.target.value
                        .split(',')
                        .map((item) => item.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </Field>
              <Field label="Image URL">
                <input
                  className={inputClass}
                  value={serviceDraft.image}
                  onChange={(event) => setServiceDraft({ ...serviceDraft, image: event.target.value })}
                />
              </Field>
              <Field label="Cover image URL">
                <input
                  className={inputClass}
                  value={serviceDraft.coverImage}
                  onChange={(event) => setServiceDraft({ ...serviceDraft, coverImage: event.target.value })}
                />
              </Field>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="inline-flex items-center gap-3 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={serviceDraft.serviceModes.online}
                    onChange={(event) =>
                      setServiceDraft({
                        ...serviceDraft,
                        serviceModes: { ...serviceDraft.serviceModes, online: event.target.checked },
                      })
                    }
                  />
                  Online
                </label>
                <label className="inline-flex items-center gap-3 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={serviceDraft.serviceModes.homeVisit}
                    onChange={(event) =>
                      setServiceDraft({
                        ...serviceDraft,
                        serviceModes: { ...serviceDraft.serviceModes, homeVisit: event.target.checked },
                      })
                    }
                  />
                  Home visit
                </label>
                <label className="inline-flex items-center gap-3 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={serviceDraft.serviceModes.onsite}
                    onChange={(event) =>
                      setServiceDraft({
                        ...serviceDraft,
                        serviceModes: { ...serviceDraft.serviceModes, onsite: event.target.checked },
                      })
                    }
                  />
                  Onsite
                </label>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className={buttonPrimaryClass}
                  onClick={() => {
                    updateService(selectedService.id, serviceDraft);
                    setMessage(`Service ${selectedService.id} berhasil disimpan.`);
                  }}
                >
                  Simpan service
                </button>
                <button type="button" className={buttonSecondaryClass} onClick={handleDeleteService}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus service
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[28px] bg-slate-50 p-5">
                <PanelHeader
                  eyebrow="Edit category"
                  title="Category service"
                  description="Kelola label kategori dan deskripsinya tanpa meninggalkan editor service."
                  action={
                    <>
                      <button type="button" className={buttonSecondaryClass} onClick={handleCreateCategory}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah category
                      </button>
                      <button type="button" className={buttonSecondaryClass} onClick={handleDeleteCategory}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Hapus category
                      </button>
                    </>
                  }
                />
                <div className="mt-4 grid gap-3">
                  <Field label="Category name">
                    <input
                      className={inputClass}
                      value={categoryDraft.name}
                      onChange={(event) => setCategoryDraft({ ...categoryDraft, name: event.target.value })}
                    />
                  </Field>
                  <Field label="Short label">
                    <input
                      className={inputClass}
                      value={categoryDraft.shortLabel}
                      onChange={(event) => setCategoryDraft({ ...categoryDraft, shortLabel: event.target.value })}
                    />
                  </Field>
                  <Field label="Description">
                    <textarea
                      className={textareaClass}
                      value={categoryDraft.description || ''}
                      onChange={(event) => setCategoryDraft({ ...categoryDraft, description: event.target.value })}
                    />
                  </Field>
                  <button
                    type="button"
                    className={buttonSecondaryClass}
                    onClick={() => {
                      updateCategory(categoryDraft.id, categoryDraft);
                      setMessage(`Category ${categoryDraft.id} berhasil disimpan.`);
                    }}
                  >
                    Simpan category
                  </button>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                <PanelHeader
                  eyebrow="Provider offering"
                  title="Relasi provider untuk service ini"
                  description="Offering membantu admin melihat provider aktif, harga, durasi, dan booking flow per service."
                  meta={[`${formatInteger(relatedOfferings.length)} offering`]}
                  action={
                    <>
                      <button type="button" className={buttonSecondaryClass} onClick={handleCreateOffering}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah offering
                      </button>
                      <button type="button" className={buttonSecondaryClass} onClick={handleDeleteOffering}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Hapus offering
                      </button>
                    </>
                  }
                />
                <div className="mt-4 grid gap-3">
                  <Field label="Profesional untuk offering baru">
                    <select
                      className={inputClass}
                      value={newOfferingProfessionalId}
                      onChange={(event) => setNewOfferingProfessionalId(event.target.value)}
                    >
                      {professionals.map((professional) => (
                        <option key={professional.id} value={professional.id}>
                          {professional.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <select
                    className={inputClass}
                    value={selectedOfferingId}
                    onChange={(event) => setSelectedOfferingId(event.target.value)}
                  >
                    {visibleOfferingOptions.map((offering) => (
                      <option key={offering.id} value={offering.id}>
                        {offering.professionalId} · {offering.price}
                      </option>
                    ))}
                  </select>
                  {offeringDraft ? (
                    <>
                      <Field label="Professional id">
                        <select
                          className={inputClass}
                          value={offeringDraft.professionalId}
                          onChange={(event) =>
                            setOfferingDraft({ ...offeringDraft, professionalId: event.target.value })
                          }
                        >
                          {professionals.map((professional) => (
                            <option key={professional.id} value={professional.id}>
                              {professional.name}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Price label">
                        <input
                          className={inputClass}
                          value={offeringDraft.price}
                          onChange={(event) => setOfferingDraft({ ...offeringDraft, price: event.target.value })}
                        />
                      </Field>
                      <Field label="Duration">
                        <input
                          className={inputClass}
                          value={offeringDraft.duration}
                          onChange={(event) => setOfferingDraft({ ...offeringDraft, duration: event.target.value })}
                        />
                      </Field>
                      <Field label="Default mode">
                        <select
                          className={inputClass}
                          value={offeringDraft.defaultMode}
                          onChange={(event) =>
                            setOfferingDraft({
                              ...offeringDraft,
                              defaultMode: event.target.value as typeof offeringDraft.defaultMode,
                            })
                          }
                        >
                          <option value="online">online</option>
                          <option value="home_visit">home_visit</option>
                          <option value="onsite">onsite</option>
                        </select>
                      </Field>
                      <Field label="Booking flow">
                        <select
                          className={inputClass}
                          value={offeringDraft.bookingFlow}
                          onChange={(event) =>
                            setOfferingDraft({
                              ...offeringDraft,
                              bookingFlow: event.target.value as typeof offeringDraft.bookingFlow,
                            })
                          }
                        >
                          <option value="request">request</option>
                          <option value="instant">instant</option>
                        </select>
                      </Field>
                      <Field label="Summary">
                        <textarea
                          className={textareaClass}
                          value={offeringDraft.summary || ''}
                          onChange={(event) =>
                            setOfferingDraft({ ...offeringDraft, summary: event.target.value || null })
                          }
                        />
                      </Field>
                      <div className="grid gap-3 md:grid-cols-3">
                        <label className="inline-flex items-center gap-3 text-sm font-medium text-slate-700">
                          <input
                            type="checkbox"
                            checked={offeringDraft.supportsOnline}
                            onChange={(event) =>
                              setOfferingDraft({ ...offeringDraft, supportsOnline: event.target.checked })
                            }
                          />
                          Online
                        </label>
                        <label className="inline-flex items-center gap-3 text-sm font-medium text-slate-700">
                          <input
                            type="checkbox"
                            checked={offeringDraft.supportsHomeVisit}
                            onChange={(event) =>
                              setOfferingDraft({ ...offeringDraft, supportsHomeVisit: event.target.checked })
                            }
                          />
                          Home visit
                        </label>
                        <label className="inline-flex items-center gap-3 text-sm font-medium text-slate-700">
                          <input
                            type="checkbox"
                            checked={offeringDraft.supportsOnsite}
                            onChange={(event) =>
                              setOfferingDraft({ ...offeringDraft, supportsOnsite: event.target.checked })
                            }
                          />
                          Onsite
                        </label>
                      </div>
                      <button
                        type="button"
                        className={buttonSecondaryClass}
                        onClick={() => {
                          updateProfessionalServiceOffering(offeringDraft.id, offeringDraft);
                          setMessage(`Offering ${offeringDraft.id} berhasil disimpan.`);
                        }}
                      >
                        Simpan offering
                      </button>
                    </>
                  ) : (
                    <EmptyStateCard
                      title="Belum ada provider offering"
                      body="Tambahkan profesional baru ke service ini untuk mengaktifkan harga, durasi, dan booking flow."
                    />
                  )}
                  <PaginationControls
                    itemLabel="offering"
                    page={offeringPagination.page}
                    pageCount={offeringPagination.pageCount}
                    pageSize={offeringPagination.pageSize}
                    rangeEnd={offeringPagination.rangeEnd}
                    rangeStart={offeringPagination.rangeStart}
                    setPage={offeringPagination.setPage}
                    setPageSize={offeringPagination.setPageSize}
                    totalCount={offeringPagination.totalCount}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export const AdminAppointmentsScreen = () => {
  const {
    appointments,
    consumers,
    deleteAppointment,
    duplicateAppointment,
    getTableRows,
    professionals,
    updateAppointment,
  } = useAdminConsoleData();
  const [modeFilter, setModeFilter] = useState<'all' | 'online' | 'home_visit' | 'onsite'>('all');
  const [phaseFilter, setPhaseFilter] = useState<
    'all' | 'closed' | 'payment' | 'post_service' | 'pre_service' | 'service_delivery'
  >('all');
  const [bookingFlowFilter, setBookingFlowFilter] = useState<'all' | 'instant' | 'request'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | string>('all');
  const [message, setMessage] = useState('');
  const [selectedAppointmentIds, setSelectedAppointmentIds] = useState<string[]>([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(appointments[0]?.id || '');
  const [appointmentDraft, setAppointmentDraft] = useState(appointments[0]);
  const statusOptions = getTableRows('reference_appointment_statuses');
  const [bulkAppointmentStatus, setBulkAppointmentStatus] = useState<AppointmentStatus>(
    (statusOptions[0]?.code as AppointmentStatus) || 'requested',
  );
  const [savedAppointmentView, setSavedAppointmentView] = useStoredView('bidanapp:admin-view:appointments', {
    bookingFlowFilter: 'all' as 'all' | 'instant' | 'request',
    modeFilter: 'all' as 'all' | 'online' | 'home_visit' | 'onsite',
    phaseFilter: 'all' as 'all' | 'closed' | 'payment' | 'post_service' | 'pre_service' | 'service_delivery',
    savedAt: '',
    searchQuery: '',
    statusFilter: 'all',
  });
  const consumerNameById = Object.fromEntries(consumers.map((consumer) => [consumer.id, consumer.name]));
  const professionalNameById = Object.fromEntries(
    professionals.map((professional) => [professional.id, professional.name]),
  );
  const filteredAppointments = appointments.filter((appointment) => {
    const matchesStatus = statusFilter === 'all' ? true : appointment.status === statusFilter;
    const matchesMode = modeFilter === 'all' ? true : appointment.requestedMode === modeFilter;
    const matchesPhase =
      phaseFilter === 'all' ? true : getAppointmentPhase(statusOptions, appointment.status) === phaseFilter;
    const matchesBookingFlow = bookingFlowFilter === 'all' ? true : appointment.bookingFlow === bookingFlowFilter;
    const searchValue = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !searchValue ||
      appointment.id.toLowerCase().includes(searchValue) ||
      appointment.serviceSnapshot.name.toLowerCase().includes(searchValue) ||
      appointment.status.toLowerCase().includes(searchValue) ||
      appointment.areaId.toLowerCase().includes(searchValue) ||
      consumerNameById[appointment.consumerId]?.toLowerCase().includes(searchValue) ||
      professionalNameById[appointment.professionalId]?.toLowerCase().includes(searchValue);

    return matchesStatus && matchesMode && matchesPhase && matchesBookingFlow && matchesSearch;
  });
  const appointmentListPagination = usePaginatedItems(filteredAppointments, 7);

  const selectedAppointment =
    appointments.find((appointment) => appointment.id === selectedAppointmentId) ||
    appointmentListPagination.pagedItems[0] ||
    filteredAppointments[0] ||
    appointments[0];

  useEffect(() => {
    if (
      (!selectedAppointmentId || !appointments.some((appointment) => appointment.id === selectedAppointmentId)) &&
      appointments[0]?.id
    ) {
      setSelectedAppointmentId(appointments[0].id);
    }
  }, [appointments, selectedAppointmentId]);

  useEffect(() => {
    resetPaginationPage(
      appointmentListPagination.setPage,
      [bookingFlowFilter, modeFilter, phaseFilter, searchQuery.trim(), statusFilter].join('|'),
    );
  }, [appointmentListPagination.setPage, bookingFlowFilter, modeFilter, phaseFilter, searchQuery, statusFilter]);

  useEffect(() => {
    if (
      filteredAppointments.length > 0 &&
      !filteredAppointments.some((appointment) => appointment.id === selectedAppointmentId)
    ) {
      setSelectedAppointmentId(filteredAppointments[0].id);
    }
  }, [filteredAppointments, selectedAppointmentId]);

  useEffect(() => {
    setAppointmentDraft(selectedAppointment);
  }, [selectedAppointment]);
  const consumer = consumers.find((item) => item.id === selectedAppointment?.consumerId);
  const professional = professionals.find((item) => item.id === selectedAppointment?.professionalId);
  const filteredAppointmentValue = sumPriceLabels(
    filteredAppointments.map((appointment) => appointment.totalPriceLabel),
  );
  const paymentQueueCount = filteredAppointments.filter(
    (appointment) => getAppointmentPhase(statusOptions, appointment.status) === 'payment',
  ).length;
  const liveServiceCount = filteredAppointments.filter((appointment) => appointment.status === 'in_service').length;
  const closedAppointmentCount = filteredAppointments.filter((appointment) => {
    const appointmentMeta = getAppointmentStatusMeta(statusOptions, appointment.status);
    return appointmentMeta?.isTerminal;
  }).length;
  const oldestFilteredAppointment = [...filteredAppointments].sort(
    (leftAppointment, rightAppointment) =>
      new Date(leftAppointment.requestedAt).getTime() - new Date(rightAppointment.requestedAt).getTime(),
  )[0];
  const timelinePagination = usePaginatedItems(selectedAppointment?.timeline || [], 5);

  useEffect(() => {
    resetPaginationPage(timelinePagination.setPage, selectedAppointment?.id || 'none');
  }, [selectedAppointment?.id, timelinePagination.setPage]);

  useEffect(() => {
    setSelectedAppointmentIds((currentIds) =>
      currentIds.filter((appointmentId) =>
        filteredAppointments.some((appointment) => appointment.id === appointmentId),
      ),
    );
  }, [filteredAppointments]);

  if (!selectedAppointment || !appointmentDraft) {
    return null;
  }

  const activeAppointmentFilters = [
    searchQuery.trim() ? `search:${searchQuery.trim()}` : '',
    statusFilter !== 'all' ? `status:${statusFilter}` : '',
    phaseFilter !== 'all' ? `phase:${phaseFilter}` : '',
    modeFilter !== 'all' ? `mode:${modeFilter}` : '',
    bookingFlowFilter !== 'all' ? `flow:${bookingFlowFilter}` : '',
  ].filter(Boolean);

  const handleDuplicateAppointment = () => {
    const nextAppointment = duplicateAppointment(selectedAppointment.id);

    if (nextAppointment) {
      setSelectedAppointmentId(nextAppointment.id);
      setMessage(`Appointment baru ${nextAppointment.id} berhasil dibuat dari duplikat admin.`);
    }
  };

  const handleDeleteAppointment = () => {
    const result = deleteAppointment(selectedAppointment.id);
    setMessage(result.message);
  };

  const handleBulkUpdateAppointmentStatus = () => {
    if (!selectedAppointmentIds.length) {
      setMessage('Pilih appointment lebih dulu untuk bulk update.');
      return;
    }

    selectedAppointmentIds.forEach((appointmentId) => {
      updateAppointment(appointmentId, { status: bulkAppointmentStatus });
    });
    setMessage(
      `${formatInteger(selectedAppointmentIds.length)} appointment berhasil diubah ke status ${bulkAppointmentStatus}.`,
    );
    setSelectedAppointmentIds([]);
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Appointments"
        title="Kontrol appointment operasional"
        description="Filter appointment berdasarkan status, phase, mode layanan, dan booking flow supaya admin bisa membaca backlog, pembayaran, dan eksekusi service dengan lebih terkontrol."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Activity className="h-5 w-5" />}
          title="Terfilter"
          value={formatInteger(filteredAppointments.length)}
          detail={`${formatCurrency(filteredAppointmentValue)} total nilai snapshot dari hasil filter saat ini.`}
        />
        <StatCard
          icon={<Workflow className="h-5 w-5" />}
          title="Payment Queue"
          value={formatInteger(paymentQueueCount)}
          detail="Booking yang masih tertahan pada phase pembayaran."
        />
        <StatCard
          icon={<Stethoscope className="h-5 w-5" />}
          title="Sedang Berjalan"
          value={formatInteger(liveServiceCount)}
          detail="Sesi yang sudah masuk `in_service` dan perlu dipantau timeline-nya."
        />
        <StatCard
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Closed"
          value={formatInteger(closedAppointmentCount)}
          detail="Booking terminal pada hasil filter ini, termasuk cancelled, rejected, atau completed."
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.88fr_1.12fr]">
        <div className={panelClass}>
          <PanelHeader
            title="Daftar appointment"
            description="Gunakan daftar ini untuk memilah backlog booking, pembayaran, mode layanan, dan status eksekusi."
            meta={[
              `${formatInteger(filteredAppointments.length)} hasil`,
              `${formatCurrency(filteredAppointmentValue)} nilai`,
            ]}
          />
          <div className="mt-4 flex flex-col gap-3">
            <input
              className={inputClass}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Cari appointment, layanan, customer, professional, area, atau status."
            />
            <div className="grid gap-3 md:grid-cols-2">
              <select
                className={inputClass}
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="all">Semua status</option>
                {statusOptions.map((status) => (
                  <option key={status.code} value={status.code}>
                    {status.code}
                  </option>
                ))}
              </select>
              <select
                className={inputClass}
                value={phaseFilter}
                onChange={(event) => setPhaseFilter(event.target.value as typeof phaseFilter)}
              >
                <option value="all">Semua phase</option>
                <option value="payment">payment</option>
                <option value="pre_service">pre_service</option>
                <option value="service_delivery">service_delivery</option>
                <option value="post_service">post_service</option>
                <option value="closed">closed</option>
              </select>
              <select
                className={inputClass}
                value={modeFilter}
                onChange={(event) => setModeFilter(event.target.value as typeof modeFilter)}
              >
                <option value="all">Semua mode</option>
                <option value="online">online</option>
                <option value="home_visit">home_visit</option>
                <option value="onsite">onsite</option>
              </select>
              <select
                className={inputClass}
                value={bookingFlowFilter}
                onChange={(event) => setBookingFlowFilter(event.target.value as typeof bookingFlowFilter)}
              >
                <option value="all">Semua booking flow</option>
                <option value="request">request</option>
                <option value="instant">instant</option>
              </select>
            </div>
          </div>
          <FilterSummaryBar
            itemLabel="appointment"
            totalCount={filteredAppointments.length}
            activeFilters={activeAppointmentFilters}
            action={
              <>
                <button
                  type="button"
                  className={buttonSecondaryClass}
                  onClick={() =>
                    setSavedAppointmentView({
                      bookingFlowFilter,
                      modeFilter,
                      phaseFilter,
                      savedAt: new Date().toISOString(),
                      searchQuery,
                      statusFilter,
                    })
                  }
                >
                  Simpan view
                </button>
                {savedAppointmentView.savedAt ? (
                  <button
                    type="button"
                    className={buttonSecondaryClass}
                    onClick={() => {
                      setSearchQuery(savedAppointmentView.searchQuery);
                      setStatusFilter(savedAppointmentView.statusFilter);
                      setPhaseFilter(savedAppointmentView.phaseFilter);
                      setModeFilter(savedAppointmentView.modeFilter);
                      setBookingFlowFilter(savedAppointmentView.bookingFlowFilter);
                    }}
                  >
                    Muat view
                  </button>
                ) : null}
              </>
            }
            onClear={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setPhaseFilter('all');
              setModeFilter('all');
              setBookingFlowFilter('all');
            }}
          />
          <BulkActionBar
            label="appointment"
            count={selectedAppointmentIds.length}
            onSelectPage={() =>
              setSelectedAppointmentIds((currentIds) =>
                Array.from(new Set([...currentIds, ...appointmentListPagination.pagedItems.map((item) => item.id)])),
              )
            }
            onClear={() => setSelectedAppointmentIds([])}
            action={
              <>
                <select
                  className={compactSelectClass}
                  value={bulkAppointmentStatus}
                  onChange={(event) => setBulkAppointmentStatus(event.target.value as AppointmentStatus)}
                >
                  {statusOptions.map((status) => (
                    <option key={status.code} value={status.code}>
                      {status.code}
                    </option>
                  ))}
                </select>
                <button type="button" className={buttonPrimaryClass} onClick={handleBulkUpdateAppointmentStatus}>
                  Apply bulk status
                </button>
              </>
            }
          />
          <div className="mt-5 space-y-3">
            {appointmentListPagination.pagedItems.map((appointment) => (
              <SelectableListButton
                key={appointment.id}
                active={appointment.id === selectedAppointmentId}
                checked={selectedAppointmentIds.includes(appointment.id)}
                detail={`${appointment.id} · ${appointment.scheduledTimeLabel}`}
                onToggle={() =>
                  setSelectedAppointmentIds((currentIds) =>
                    currentIds.includes(appointment.id)
                      ? currentIds.filter((itemId) => itemId !== appointment.id)
                      : [...currentIds, appointment.id],
                  )
                }
                onClick={() => setSelectedAppointmentId(appointment.id)}
                title={appointment.serviceSnapshot.name}
                subtitle={`${consumerNameById[appointment.consumerId] || appointment.consumerId} · ${appointment.status}`}
              />
            ))}
            {filteredAppointments.length === 0 ? (
              <EmptyStateCard
                title="Tidak ada appointment yang cocok"
                body="Reset filter status, phase, mode, atau booking flow untuk melihat backlog lain."
              />
            ) : null}
            <PaginationControls
              itemLabel="appointment"
              page={appointmentListPagination.page}
              pageCount={appointmentListPagination.pageCount}
              pageSize={appointmentListPagination.pageSize}
              rangeEnd={appointmentListPagination.rangeEnd}
              rangeStart={appointmentListPagination.rangeStart}
              setPage={appointmentListPagination.setPage}
              setPageSize={appointmentListPagination.setPageSize}
              totalCount={appointmentListPagination.totalCount}
            />
          </div>
        </div>

        <div className="space-y-5">
          <MessageBanner message={message} />

          <div className="grid gap-4 md:grid-cols-2">
            <CompactInsightCard
              label="Prioritas terlama"
              value={oldestFilteredAppointment?.id || 'Tidak ada'}
              detail={
                oldestFilteredAppointment
                  ? `${oldestFilteredAppointment.serviceSnapshot.name} · requested ${formatDateTime(oldestFilteredAppointment.requestedAt)}`
                  : 'Belum ada appointment yang masuk pada kombinasi filter saat ini.'
              }
            />
            <CompactInsightCard
              label="Distribusi phase"
              value={
                appointmentPhaseLabels[getAppointmentPhase(statusOptions, selectedAppointment.status)] || 'Unknown'
              }
              detail={`Booking flow ${selectedAppointment.bookingFlow} · mode ${selectedAppointment.requestedMode}.`}
            />
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <PanelHeader
              eyebrow="Selected appointment"
              title={selectedAppointment.serviceSnapshot.name}
              description={`${selectedAppointment.id} · ${selectedAppointment.scheduledTimeLabel}`}
              meta={[
                `status ${selectedAppointment.status}`,
                `flow ${selectedAppointment.bookingFlow}`,
                `mode ${selectedAppointment.requestedMode}`,
              ]}
            />
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <CompactInsightCard
                label="Customer"
                value={consumer?.name || selectedAppointment.consumerId}
                detail={consumer?.phone || 'Data customer tidak ditemukan.'}
              />
              <CompactInsightCard
                label="Professional"
                value={professional?.name || selectedAppointment.professionalId}
                detail={`Area ${selectedAppointment.areaId}`}
              />
            </div>
          </div>

          <div className={panelClass}>
            <div className="grid gap-4 md:grid-cols-3">
              <StatCard
                icon={<Activity className="h-5 w-5" />}
                title="Status"
                value={selectedAppointment.status}
                detail={selectedAppointment.id}
              />
              <StatCard
                icon={<UsersRound className="h-5 w-5" />}
                title="Customer"
                value={consumer?.name || selectedAppointment.consumerId}
                detail={consumer?.phone || 'Tidak ditemukan'}
              />
              <StatCard
                icon={<Stethoscope className="h-5 w-5" />}
                title="Professional"
                value={professional?.name || selectedAppointment.professionalId}
                detail={selectedAppointment.requestedMode}
              />
            </div>
          </div>

          <div className={`${panelClass} grid gap-4 lg:grid-cols-2`}>
            <div className="lg:col-span-2">
              <PanelHeader
                title="Edit appointment"
                description="Perbarui status, jadwal, harga, dan request note dari appointment yang sedang dipilih."
              />
            </div>
            <Field label="Appointment status">
              <select
                className={inputClass}
                value={appointmentDraft.status}
                onChange={(event) =>
                  setAppointmentDraft({
                    ...appointmentDraft,
                    status: event.target.value as typeof appointmentDraft.status,
                  })
                }
              >
                {statusOptions.map((status) => (
                  <option key={status.code} value={status.code}>
                    {status.code}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Scheduled time label">
              <input
                className={inputClass}
                value={appointmentDraft.scheduledTimeLabel}
                onChange={(event) =>
                  setAppointmentDraft({
                    ...appointmentDraft,
                    scheduledTimeLabel: event.target.value,
                    scheduleSnapshot: {
                      ...appointmentDraft.scheduleSnapshot,
                      scheduledTimeLabel: event.target.value,
                    },
                  })
                }
              />
            </Field>
            <Field label="Total price label">
              <input
                className={inputClass}
                value={appointmentDraft.totalPriceLabel}
                onChange={(event) =>
                  setAppointmentDraft({
                    ...appointmentDraft,
                    totalPriceLabel: event.target.value,
                    serviceSnapshot: {
                      ...appointmentDraft.serviceSnapshot,
                      priceAmount: parsePriceAmount(event.target.value),
                      priceLabel: event.target.value,
                    },
                  })
                }
              />
            </Field>
            <Field label="Requested note">
              <textarea
                className={textareaClass}
                value={appointmentDraft.requestNote}
                onChange={(event) => setAppointmentDraft({ ...appointmentDraft, requestNote: event.target.value })}
              />
            </Field>
            <div className="flex flex-wrap gap-3 lg:col-span-2">
              <button
                type="button"
                className={buttonPrimaryClass}
                onClick={() => {
                  updateAppointment(selectedAppointment.id, appointmentDraft);
                  setMessage(`Appointment ${selectedAppointment.id} berhasil disimpan.`);
                }}
              >
                Simpan appointment
              </button>
              <button type="button" className={buttonSecondaryClass} onClick={handleDuplicateAppointment}>
                <Plus className="mr-2 h-4 w-4" />
                Duplikat appointment
              </button>
              <button type="button" className={buttonSecondaryClass} onClick={handleDeleteAppointment}>
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus appointment
              </button>
            </div>
          </div>

          <div className={panelClass}>
            <PanelHeader
              title="Timeline snapshot"
              description="Timeline ini membantu admin membaca kronologi perubahan status booking terpilih."
              meta={[`${formatInteger((selectedAppointment.timeline || []).length)} event`]}
            />
            <div className="mt-4 space-y-3">
              {timelinePagination.pagedItems.map((event) => (
                <div key={event.id} className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-950">{event.toStatus}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDateTime(event.createdAt)}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {event.customerSummary || event.internalNote || 'Tidak ada catatan tambahan.'}
                  </p>
                </div>
              ))}
              {timelinePagination.totalCount === 0 ? (
                <EmptyStateCard
                  title="Timeline masih kosong"
                  body="Appointment ini belum punya event timeline tambahan pada snapshot admin."
                />
              ) : null}
            </div>
            <PaginationControls
              itemLabel="event timeline"
              page={timelinePagination.page}
              pageCount={timelinePagination.pageCount}
              pageSize={timelinePagination.pageSize}
              rangeEnd={timelinePagination.rangeEnd}
              rangeStart={timelinePagination.rangeStart}
              setPage={timelinePagination.setPage}
              setPageSize={timelinePagination.setPageSize}
              totalCount={timelinePagination.totalCount}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export const AdminSupportScreen = () => {
  const { session } = useAdminSession();
  const {
    adminStaff,
    commandCenter,
    exportSnapshot,
    importSnapshot,
    resetSupportDesk,
    savedAt,
    submitSupportTicket,
    tickets,
    updateCommandCenter,
    updateSupportTicket,
  } = useSupportDesk();
  const [roleFilter, setRoleFilter] = useState<'all' | 'customer' | 'professional'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'triaged' | 'reviewing' | 'resolved' | 'refunded'>(
    'all',
  );
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'normal' | 'high' | 'urgent'>('all');
  const [assignedFilter, setAssignedFilter] = useState<'all' | string>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | SupportCategoryId>('all');
  const [channelFilter, setChannelFilter] = useState<'all' | 'call' | 'email' | 'whatsapp'>('all');
  const [queuePreset, setQueuePreset] = useState<
    'all' | 'needs_response' | 'refund_watch' | 'sla_risk' | 'unassigned_urgent'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');
  const [importJson, setImportJson] = useState('');
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState(tickets[0]?.id || '');
  const [ticketDraft, setTicketDraft] = useState(tickets[0]);
  const [commandDraft, setCommandDraft] = useState(commandCenter);
  const [bulkAssignedAdminId, setBulkAssignedAdminId] = useState(adminStaff[0]?.id || '');
  const [bulkTicketStatus, setBulkTicketStatus] = useState<'new' | 'refunded' | 'resolved' | 'reviewing' | 'triaged'>(
    'triaged',
  );
  const [bulkTicketUrgency, setBulkTicketUrgency] = useState<'normal' | 'high' | 'urgent'>('high');
  const [savedSupportView, setSavedSupportView] = useStoredView('bidanapp:admin-view:support', {
    assignedFilter: 'all',
    categoryFilter: 'all' as 'all' | SupportCategoryId,
    channelFilter: 'all' as 'all' | 'call' | 'email' | 'whatsapp',
    queuePreset: 'all' as 'all' | 'needs_response' | 'refund_watch' | 'sla_risk' | 'unassigned_urgent',
    roleFilter: 'all' as 'all' | 'customer' | 'professional',
    savedAt: '',
    searchQuery: '',
    statusFilter: 'all' as 'all' | 'new' | 'triaged' | 'reviewing' | 'resolved' | 'refunded',
    urgencyFilter: 'all' as 'all' | 'normal' | 'high' | 'urgent',
  });
  const [manualTicketDraft, setManualTicketDraft] = useState({
    categoryId: 'accountAccess' as SupportCategoryId,
    contactValue: '',
    details: '',
    preferredChannel: 'whatsapp' as const,
    referenceCode: '',
    relatedAppointmentId: '',
    relatedProfessionalId: '',
    reporterName: '',
    reporterPhone: '',
    reporterRole: 'customer' as const,
    summary: '',
    urgency: 'normal' as const,
  });
  const supportCategoryOptions = Array.from(
    new Set([
      ...customerSupportCategoryOptions,
      ...professionalSupportCategoryOptions,
      ...tickets.map((ticket) => ticket.categoryId),
    ]),
  ).sort((leftCategory, rightCategory) => leftCategory.localeCompare(rightCategory)) as SupportCategoryId[];

  const filteredTickets = tickets.filter((ticket) => {
    const matchesRole = roleFilter === 'all' ? true : ticket.reporterRole === roleFilter;
    const matchesStatus = statusFilter === 'all' ? true : ticket.status === statusFilter;
    const matchesUrgency = urgencyFilter === 'all' ? true : ticket.urgency === urgencyFilter;
    const matchesAssigned =
      assignedFilter === 'all' ? true : (ticket.assignedAdminId || 'unassigned') === assignedFilter;
    const matchesCategory = categoryFilter === 'all' ? true : ticket.categoryId === categoryFilter;
    const matchesChannel = channelFilter === 'all' ? true : ticket.preferredChannel === channelFilter;
    const matchesPreset =
      queuePreset === 'all'
        ? true
        : queuePreset === 'needs_response'
          ? ticket.status === 'new' || ticket.status === 'triaged'
          : queuePreset === 'unassigned_urgent'
            ? !ticket.assignedAdminId && (ticket.urgency === 'high' || ticket.urgency === 'urgent')
            : queuePreset === 'refund_watch'
              ? ticket.categoryId === 'refundRequest' ||
                ticket.categoryId === 'refundClarification' ||
                ticket.status === 'refunded'
              : ticket.status !== 'resolved' &&
                ticket.status !== 'refunded' &&
                getTicketAgeHours(ticket.createdAt) >= 6;
    const searchValue = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !searchValue ||
      ticket.summary.toLowerCase().includes(searchValue) ||
      ticket.reporterName.toLowerCase().includes(searchValue) ||
      ticket.id.toLowerCase().includes(searchValue) ||
      ticket.referenceCode?.toLowerCase().includes(searchValue) ||
      ticket.categoryId.toLowerCase().includes(searchValue) ||
      ticket.preferredChannel.toLowerCase().includes(searchValue);

    return (
      matchesRole &&
      matchesStatus &&
      matchesUrgency &&
      matchesAssigned &&
      matchesCategory &&
      matchesChannel &&
      matchesPreset &&
      matchesSearch
    );
  });
  const ticketQueuePagination = usePaginatedItems(filteredTickets, 7);
  const selectedTicket =
    tickets.find((ticket) => ticket.id === selectedTicketId) ||
    ticketQueuePagination.pagedItems[0] ||
    filteredTickets[0] ||
    tickets[0];
  const manualCategoryOptions =
    manualTicketDraft.reporterRole === 'customer' ? customerSupportCategoryOptions : professionalSupportCategoryOptions;
  const ticketQueueResetKey = [
    assignedFilter,
    categoryFilter,
    channelFilter,
    queuePreset,
    roleFilter,
    searchQuery.trim(),
    statusFilter,
    urgencyFilter,
  ].join('|');

  useEffect(() => {
    setCommandDraft(commandCenter);
  }, [commandCenter]);

  useEffect(() => {
    if ((!selectedTicketId || !tickets.some((ticket) => ticket.id === selectedTicketId)) && tickets[0]?.id) {
      setSelectedTicketId(tickets[0].id);
    }
  }, [selectedTicketId, tickets]);

  useEffect(() => {
    if (!selectedTicketId && filteredTickets[0]?.id) {
      setSelectedTicketId(filteredTickets[0].id);
    }
  }, [filteredTickets, selectedTicketId]);

  useEffect(() => {
    resetPaginationPage(ticketQueuePagination.setPage, ticketQueueResetKey);
  }, [ticketQueuePagination.setPage, ticketQueueResetKey]);

  useEffect(() => {
    if (filteredTickets.length > 0 && !filteredTickets.some((ticket) => ticket.id === selectedTicketId)) {
      setSelectedTicketId(filteredTickets[0].id);
    }
  }, [filteredTickets, selectedTicketId]);

  useEffect(() => {
    setTicketDraft(selectedTicket);
  }, [selectedTicket]);

  useEffect(() => {
    setSelectedTicketIds((currentIds) =>
      currentIds.filter((ticketId) => filteredTickets.some((ticket) => ticket.id === ticketId)),
    );
  }, [filteredTickets]);

  if (!selectedTicket || !ticketDraft || !commandDraft) {
    return null;
  }

  const activeSupportFilters = [
    queuePreset !== 'all' ? `preset:${queuePreset}` : '',
    searchQuery.trim() ? `search:${searchQuery.trim()}` : '',
    roleFilter !== 'all' ? `role:${roleFilter}` : '',
    statusFilter !== 'all' ? `status:${statusFilter}` : '',
    urgencyFilter !== 'all' ? `urgency:${urgencyFilter}` : '',
    assignedFilter !== 'all' ? `pic:${assignedFilter}` : '',
    categoryFilter !== 'all' ? `category:${categoryFilter}` : '',
    channelFilter !== 'all' ? `channel:${channelFilter}` : '',
  ].filter(Boolean);

  const activeTickets = tickets.filter((ticket) => ticket.status !== 'resolved' && ticket.status !== 'refunded');
  const filteredActiveTickets = filteredTickets.filter(
    (ticket) => ticket.status !== 'resolved' && ticket.status !== 'refunded',
  );
  const filteredUrgentTickets = filteredActiveTickets.filter((ticket) => ticket.urgency === 'urgent');
  const unassignedFilteredTickets = filteredTickets.filter((ticket) => !ticket.assignedAdminId);
  const slaRiskTickets = filteredTickets.filter(
    (ticket) =>
      ticket.status !== 'resolved' && ticket.status !== 'refunded' && getTicketAgeHours(ticket.createdAt) >= 6,
  );
  const refundWatchTickets = filteredTickets.filter(
    (ticket) =>
      ticket.categoryId === 'refundRequest' ||
      ticket.categoryId === 'refundClarification' ||
      ticket.status === 'refunded',
  );
  const ticketSpotlight = [...filteredTickets]
    .sort((leftTicket, rightTicket) => {
      const urgencyDelta = getTicketPriorityWeight(rightTicket.urgency) - getTicketPriorityWeight(leftTicket.urgency);

      if (urgencyDelta !== 0) {
        return urgencyDelta;
      }

      const assignmentDelta =
        Number(Boolean(leftTicket.assignedAdminId)) - Number(Boolean(rightTicket.assignedAdminId));

      if (assignmentDelta !== 0) {
        return assignmentDelta;
      }

      return new Date(leftTicket.createdAt).getTime() - new Date(rightTicket.createdAt).getTime();
    })
    .slice(0, 3);

  const handleCreateManualTicket = () => {
    if (
      !manualTicketDraft.reporterName.trim() ||
      !manualTicketDraft.summary.trim() ||
      !manualTicketDraft.details.trim()
    ) {
      setMessage('Nama pelapor, ringkasan, dan detail ticket wajib diisi.');
      return;
    }

    const nextTicket = submitSupportTicket({
      categoryId: manualTicketDraft.categoryId,
      contactValue: manualTicketDraft.contactValue.trim() || manualTicketDraft.reporterPhone.trim(),
      details: manualTicketDraft.details.trim(),
      preferredChannel: manualTicketDraft.preferredChannel,
      referenceCode: manualTicketDraft.referenceCode.trim() || undefined,
      relatedAppointmentId: manualTicketDraft.relatedAppointmentId.trim() || undefined,
      relatedProfessionalId: manualTicketDraft.relatedProfessionalId.trim() || undefined,
      reporterName: manualTicketDraft.reporterName.trim(),
      reporterPhone: manualTicketDraft.reporterPhone.trim(),
      reporterRole: manualTicketDraft.reporterRole,
      sourceSurface: 'admin_manual',
      summary: manualTicketDraft.summary.trim(),
      urgency: manualTicketDraft.urgency,
    });

    setSelectedTicketId(nextTicket.id);
    setMessage(`Ticket manual ${nextTicket.id} berhasil dibuat.`);
    setManualTicketDraft((currentDraft) => ({
      ...currentDraft,
      contactValue: '',
      details: '',
      referenceCode: '',
      relatedAppointmentId: '',
      relatedProfessionalId: '',
      summary: '',
    }));
  };

  const handleImportSupportSnapshot = () => {
    try {
      importSnapshot(importJson);
      setMessage('Snapshot support desk berhasil diimport.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Import snapshot support gagal.');
    }
  };

  const handleBulkTicketUpdate = () => {
    if (!selectedTicketIds.length) {
      setMessage('Pilih ticket dulu sebelum menjalankan bulk update.');
      return;
    }

    selectedTicketIds.forEach((ticketId) => {
      updateSupportTicket(ticketId, {
        assignedAdminId: bulkAssignedAdminId || undefined,
        etaKey: bulkTicketUrgency,
        status: bulkTicketStatus,
        urgency: bulkTicketUrgency,
      });
    });
    setMessage(
      `${formatInteger(selectedTicketIds.length)} ticket berhasil diassign/update ke status ${bulkTicketStatus} dengan urgency ${bulkTicketUrgency}.`,
    );
    setSelectedTicketIds([]);
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Support"
        title="Support desk dan triage"
        description="Update command center, gunakan preset triage, filter ticket customer/professional, assign admin, dan kontrol status serta urgency dari hook support desk yang sama dengan surface profile."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Open queue"
          value={formatInteger(filteredActiveTickets.length)}
          detail={`${formatInteger(activeTickets.length)} ticket aktif total, ${formatInteger(filteredTickets.length)} terlihat pada filter saat ini.`}
        />
        <StatCard
          icon={<CircleAlert className="h-5 w-5" />}
          title="Urgent"
          value={formatInteger(filteredUrgentTickets.length)}
          detail="Kasus urgent yang lolos filter dan perlu diprioritaskan."
        />
        <StatCard
          icon={<Workflow className="h-5 w-5" />}
          title="SLA Risk"
          value={formatInteger(slaRiskTickets.length)}
          detail="Ticket aktif dengan umur minimal 6 jam pada hasil filter sekarang."
        />
        <StatCard
          icon={<UsersRound className="h-5 w-5" />}
          title="Focus area"
          value={session.focusArea}
          detail={`Admin aktif ${commandCenter.activeAdminId || '-'} · ${formatInteger(unassignedFilteredTickets.length)} belum diassign.`}
        />
      </section>

      <section className={`${panelClass} grid gap-5 lg:grid-cols-2`}>
        <div className="grid gap-4">
          <PanelHeader
            title="Command center"
            description="Perbarui command note, runtime narrative, dan focus area agar support desk punya konteks operasional yang jelas."
          />
          <Field label="Command note">
            <textarea
              className={textareaClass}
              value={commandDraft.commandNote}
              onChange={(event) => setCommandDraft({ ...commandDraft, commandNote: event.target.value })}
            />
          </Field>
          <Field label="Runtime narrative">
            <textarea
              className={textareaClass}
              value={commandDraft.runtimeNarrative}
              onChange={(event) => setCommandDraft({ ...commandDraft, runtimeNarrative: event.target.value })}
            />
          </Field>
          <Field label="Focus area">
            <select
              className={inputClass}
              value={commandDraft.focusArea}
              onChange={(event) =>
                setCommandDraft({ ...commandDraft, focusArea: event.target.value as typeof commandDraft.focusArea })
              }
            >
              <option value="support">support</option>
              <option value="ops">ops</option>
              <option value="reviews">reviews</option>
              <option value="catalog">catalog</option>
            </select>
          </Field>
          <button
            type="button"
            className={buttonPrimaryClass}
            onClick={() => {
              updateCommandCenter(commandDraft);
              setMessage('Command center support berhasil disimpan.');
            }}
          >
            Simpan command center
          </button>
        </div>

        <div className="rounded-[28px] bg-slate-50 p-5">
          <PanelHeader
            eyebrow="Admin roster"
            title="PIC support yang tersedia"
            description="Roster ini membantu admin memilih assignee ticket dan membaca presence tim yang sedang aktif."
          />
          <div className="mt-4 space-y-3">
            {adminStaff.map((admin) => (
              <div key={admin.id} className="rounded-[22px] bg-white px-4 py-3">
                <p className="text-sm font-semibold text-slate-950">{admin.name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {admin.title} · {admin.presence}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className={panelClass}>
          <PanelHeader
            title="Ticket queue"
            description="Preset triage dan filter di bawah ini menentukan backlog support yang sedang dilihat admin."
            meta={[
              `${formatInteger(filteredTickets.length)} hasil`,
              `${formatInteger(unassignedFilteredTickets.length)} unassigned`,
            ]}
          />
          <div className="mt-4 flex flex-col gap-3">
            <FilterPillGroup
              label="Preset triage"
              value={queuePreset}
              onChange={(value) => setQueuePreset(value as typeof queuePreset)}
              options={[
                { label: 'Semua', value: 'all' },
                { label: 'Butuh respon', value: 'needs_response' },
                { label: 'Unassigned urgent', value: 'unassigned_urgent' },
                { label: 'Refund watch', value: 'refund_watch' },
                { label: 'SLA risk', value: 'sla_risk' },
              ]}
            />
            <input
              className={inputClass}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Cari summary, reporter, reference, category, channel, atau id ticket."
            />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <select
                className={inputClass}
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value as typeof roleFilter)}
              >
                <option value="all">Semua role</option>
                <option value="customer">Customer</option>
                <option value="professional">Professional</option>
              </select>
              <select
                className={inputClass}
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
              >
                <option value="all">Semua status</option>
                <option value="new">new</option>
                <option value="triaged">triaged</option>
                <option value="reviewing">reviewing</option>
                <option value="resolved">resolved</option>
                <option value="refunded">refunded</option>
              </select>
              <select
                className={inputClass}
                value={urgencyFilter}
                onChange={(event) => setUrgencyFilter(event.target.value as typeof urgencyFilter)}
              >
                <option value="all">Semua urgency</option>
                <option value="normal">normal</option>
                <option value="high">high</option>
                <option value="urgent">urgent</option>
              </select>
              <select
                className={inputClass}
                value={assignedFilter}
                onChange={(event) => setAssignedFilter(event.target.value)}
              >
                <option value="all">Semua PIC</option>
                <option value="unassigned">Belum diassign</option>
                {adminStaff.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.name}
                  </option>
                ))}
              </select>
              <select
                className={inputClass}
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value as typeof categoryFilter)}
              >
                <option value="all">Semua category</option>
                {supportCategoryOptions.map((categoryId) => (
                  <option key={categoryId} value={categoryId}>
                    {categoryId}
                  </option>
                ))}
              </select>
              <select
                className={inputClass}
                value={channelFilter}
                onChange={(event) => setChannelFilter(event.target.value as typeof channelFilter)}
              >
                <option value="all">Semua channel</option>
                <option value="whatsapp">whatsapp</option>
                <option value="call">call</option>
                <option value="email">email</option>
              </select>
            </div>
          </div>
          <FilterSummaryBar
            itemLabel="ticket"
            totalCount={filteredTickets.length}
            activeFilters={activeSupportFilters}
            action={
              <>
                <button
                  type="button"
                  className={buttonSecondaryClass}
                  onClick={() =>
                    setSavedSupportView({
                      assignedFilter,
                      categoryFilter,
                      channelFilter,
                      queuePreset,
                      roleFilter,
                      savedAt: new Date().toISOString(),
                      searchQuery,
                      statusFilter,
                      urgencyFilter,
                    })
                  }
                >
                  Simpan view
                </button>
                {savedSupportView.savedAt ? (
                  <button
                    type="button"
                    className={buttonSecondaryClass}
                    onClick={() => {
                      setQueuePreset(savedSupportView.queuePreset);
                      setSearchQuery(savedSupportView.searchQuery);
                      setRoleFilter(savedSupportView.roleFilter);
                      setStatusFilter(savedSupportView.statusFilter);
                      setUrgencyFilter(savedSupportView.urgencyFilter);
                      setAssignedFilter(savedSupportView.assignedFilter);
                      setCategoryFilter(savedSupportView.categoryFilter);
                      setChannelFilter(savedSupportView.channelFilter);
                    }}
                  >
                    Muat view
                  </button>
                ) : null}
              </>
            }
            onClear={() => {
              setQueuePreset('all');
              setSearchQuery('');
              setRoleFilter('all');
              setStatusFilter('all');
              setUrgencyFilter('all');
              setAssignedFilter('all');
              setCategoryFilter('all');
              setChannelFilter('all');
            }}
          />
          <BulkActionBar
            label="ticket"
            count={selectedTicketIds.length}
            onSelectPage={() =>
              setSelectedTicketIds((currentIds) =>
                Array.from(new Set([...currentIds, ...ticketQueuePagination.pagedItems.map((ticket) => ticket.id)])),
              )
            }
            onClear={() => setSelectedTicketIds([])}
            action={
              <>
                <select
                  className={compactSelectClass}
                  value={bulkAssignedAdminId}
                  onChange={(event) => setBulkAssignedAdminId(event.target.value)}
                >
                  <option value="">Unassigned</option>
                  {adminStaff.map((admin) => (
                    <option key={admin.id} value={admin.id}>
                      {admin.name}
                    </option>
                  ))}
                </select>
                <select
                  className={compactSelectClass}
                  value={bulkTicketStatus}
                  onChange={(event) => setBulkTicketStatus(event.target.value as typeof bulkTicketStatus)}
                >
                  <option value="new">new</option>
                  <option value="triaged">triaged</option>
                  <option value="reviewing">reviewing</option>
                  <option value="resolved">resolved</option>
                  <option value="refunded">refunded</option>
                </select>
                <select
                  className={compactSelectClass}
                  value={bulkTicketUrgency}
                  onChange={(event) => setBulkTicketUrgency(event.target.value as typeof bulkTicketUrgency)}
                >
                  <option value="normal">normal</option>
                  <option value="high">high</option>
                  <option value="urgent">urgent</option>
                </select>
                <button type="button" className={buttonPrimaryClass} onClick={handleBulkTicketUpdate}>
                  Apply bulk
                </button>
              </>
            }
          />
          <div className="mt-5 space-y-3">
            {ticketQueuePagination.pagedItems.map((ticket) => (
              <SelectableListButton
                key={ticket.id}
                active={ticket.id === selectedTicketId}
                checked={selectedTicketIds.includes(ticket.id)}
                detail={`${ticket.id} · ${ticket.preferredChannel} · ${formatQueueAge(ticket.createdAt)}`}
                onToggle={() =>
                  setSelectedTicketIds((currentIds) =>
                    currentIds.includes(ticket.id)
                      ? currentIds.filter((itemId) => itemId !== ticket.id)
                      : [...currentIds, ticket.id],
                  )
                }
                onClick={() => setSelectedTicketId(ticket.id)}
                title={ticket.summary}
                subtitle={`${ticket.reporterRole} · ${ticket.status} · ${ticket.urgency}`}
              />
            ))}
            {filteredTickets.length === 0 ? (
              <EmptyStateCard
                title="Queue support kosong"
                body="Tidak ada ticket yang cocok dengan preset triage dan filter saat ini."
              />
            ) : null}
            <PaginationControls
              itemLabel="ticket"
              page={ticketQueuePagination.page}
              pageCount={ticketQueuePagination.pageCount}
              pageSize={ticketQueuePagination.pageSize}
              rangeEnd={ticketQueuePagination.rangeEnd}
              rangeStart={ticketQueuePagination.rangeStart}
              setPage={ticketQueuePagination.setPage}
              setPageSize={ticketQueuePagination.setPageSize}
              totalCount={ticketQueuePagination.totalCount}
            />
          </div>
        </div>

        <div className={`${panelClass} grid gap-4 lg:grid-cols-2`}>
          <div className="lg:col-span-2">
            <MessageBanner message={message} />
          </div>
          <div className="lg:col-span-2 grid gap-4 md:grid-cols-3">
            <CompactInsightCard
              label="Unassigned"
              value={formatInteger(unassignedFilteredTickets.length)}
              detail="Ticket pada hasil filter yang belum punya PIC admin."
            />
            <CompactInsightCard
              label="Refund watch"
              value={formatInteger(refundWatchTickets.length)}
              detail="Kasus refund atau klarifikasi refund yang perlu jalur tindak lanjut khusus."
            />
            <CompactInsightCard
              label="Prioritas saat ini"
              value={ticketSpotlight[0]?.id || 'Tidak ada'}
              detail={
                ticketSpotlight[0]
                  ? `${ticketSpotlight[0].summary} · umur ${formatQueueAge(ticketSpotlight[0].createdAt)}`
                  : 'Tidak ada ticket yang cocok dengan preset dan filter saat ini.'
              }
            />
          </div>
          <div className="lg:col-span-2 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <PanelHeader
              eyebrow="Selected ticket"
              title={ticketDraft.summary}
              description={`${ticketDraft.id} · ${ticketDraft.reporterName} · ${ticketDraft.preferredChannel}`}
              meta={[
                `status ${ticketDraft.status}`,
                `urgency ${ticketDraft.urgency}`,
                ticketDraft.assignedAdminId ? `PIC ${ticketDraft.assignedAdminId}` : 'Belum diassign',
              ]}
            />
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <CompactInsightCard
                label="Created"
                value={formatDateTime(ticketDraft.createdAt)}
                detail={`Updated ${formatDateTime(ticketDraft.updatedAt)}`}
              />
              <CompactInsightCard
                label="Reporter"
                value={ticketDraft.reporterRole}
                detail={`${ticketDraft.reporterName} · ${ticketDraft.contactValue}`}
              />
            </div>
          </div>
          <Field label="Assigned admin">
            <select
              className={inputClass}
              value={ticketDraft.assignedAdminId || ''}
              onChange={(event) => setTicketDraft({ ...ticketDraft, assignedAdminId: event.target.value || undefined })}
            >
              <option value="">Belum diassign</option>
              {adminStaff.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              className={inputClass}
              value={ticketDraft.status}
              onChange={(event) =>
                setTicketDraft({ ...ticketDraft, status: event.target.value as typeof ticketDraft.status })
              }
            >
              <option value="new">new</option>
              <option value="triaged">triaged</option>
              <option value="reviewing">reviewing</option>
              <option value="resolved">resolved</option>
              <option value="refunded">refunded</option>
            </select>
          </Field>
          <Field label="Urgency">
            <select
              className={inputClass}
              value={ticketDraft.urgency}
              onChange={(event) =>
                setTicketDraft({
                  ...ticketDraft,
                  urgency: event.target.value as typeof ticketDraft.urgency,
                  etaKey: event.target.value as typeof ticketDraft.etaKey,
                })
              }
            >
              <option value="normal">normal</option>
              <option value="high">high</option>
              <option value="urgent">urgent</option>
            </select>
          </Field>
          <Field label="ETA key">
            <select
              className={inputClass}
              value={ticketDraft.etaKey}
              onChange={(event) =>
                setTicketDraft({ ...ticketDraft, etaKey: event.target.value as typeof ticketDraft.etaKey })
              }
            >
              <option value="normal">normal</option>
              <option value="high">high</option>
              <option value="urgent">urgent</option>
            </select>
          </Field>
          <Field label="Ringkasan">
            <textarea
              className={textareaClass}
              value={ticketDraft.summary}
              onChange={(event) => setTicketDraft({ ...ticketDraft, summary: event.target.value })}
            />
          </Field>
          <div className="rounded-[28px] bg-slate-50 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Detail ticket</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">{ticketDraft.details}</p>
            <p className="mt-3 text-xs text-slate-500">
              {ticketDraft.reporterName} · {ticketDraft.contactValue}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {ticketDraft.categoryId} · {ticketDraft.preferredChannel} · created{' '}
              {formatDateTime(ticketDraft.createdAt)}
            </p>
          </div>
          <button
            type="button"
            className={buttonPrimaryClass}
            onClick={() => {
              updateSupportTicket(ticketDraft.id, {
                assignedAdminId: ticketDraft.assignedAdminId,
                etaKey: ticketDraft.etaKey,
                status: ticketDraft.status,
                summary: ticketDraft.summary,
                urgency: ticketDraft.urgency,
              });
              setMessage(`Ticket ${ticketDraft.id} berhasil diperbarui.`);
            }}
          >
            Simpan ticket
          </button>
        </div>
      </section>

      <section className={`${panelClass} grid gap-5 xl:grid-cols-[1fr_1fr]`}>
        <div>
          <PanelHeader
            title="Buat ticket manual"
            description="Gunakan form ini untuk menambah kasus baru langsung dari admin console tanpa menunggu surface user."
          />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Role pelapor">
              <select
                className={inputClass}
                value={manualTicketDraft.reporterRole}
                onChange={(event) =>
                  setManualTicketDraft({
                    ...manualTicketDraft,
                    categoryId:
                      event.target.value === 'customer'
                        ? customerSupportCategoryOptions[0]
                        : professionalSupportCategoryOptions[0],
                    reporterRole: event.target.value as typeof manualTicketDraft.reporterRole,
                  })
                }
              >
                <option value="customer">customer</option>
                <option value="professional">professional</option>
              </select>
            </Field>
            <Field label="Urgency">
              <select
                className={inputClass}
                value={manualTicketDraft.urgency}
                onChange={(event) =>
                  setManualTicketDraft({
                    ...manualTicketDraft,
                    urgency: event.target.value as typeof manualTicketDraft.urgency,
                  })
                }
              >
                <option value="normal">normal</option>
                <option value="high">high</option>
                <option value="urgent">urgent</option>
              </select>
            </Field>
            <Field label="Nama pelapor">
              <input
                className={inputClass}
                value={manualTicketDraft.reporterName}
                onChange={(event) => setManualTicketDraft({ ...manualTicketDraft, reporterName: event.target.value })}
              />
            </Field>
            <Field label="Nomor telepon">
              <input
                className={inputClass}
                value={manualTicketDraft.reporterPhone}
                onChange={(event) => setManualTicketDraft({ ...manualTicketDraft, reporterPhone: event.target.value })}
              />
            </Field>
            <Field label="Contact value">
              <input
                className={inputClass}
                value={manualTicketDraft.contactValue}
                onChange={(event) => setManualTicketDraft({ ...manualTicketDraft, contactValue: event.target.value })}
              />
            </Field>
            <Field label="Preferred channel">
              <select
                className={inputClass}
                value={manualTicketDraft.preferredChannel}
                onChange={(event) =>
                  setManualTicketDraft({
                    ...manualTicketDraft,
                    preferredChannel: event.target.value as typeof manualTicketDraft.preferredChannel,
                  })
                }
              >
                <option value="whatsapp">whatsapp</option>
                <option value="call">call</option>
                <option value="email">email</option>
              </select>
            </Field>
            <Field label="Category">
              <select
                className={inputClass}
                value={manualTicketDraft.categoryId}
                onChange={(event) =>
                  setManualTicketDraft({ ...manualTicketDraft, categoryId: event.target.value as SupportCategoryId })
                }
              >
                {manualCategoryOptions.map((categoryId) => (
                  <option key={categoryId} value={categoryId}>
                    {categoryId}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Reference code">
              <input
                className={inputClass}
                value={manualTicketDraft.referenceCode}
                onChange={(event) => setManualTicketDraft({ ...manualTicketDraft, referenceCode: event.target.value })}
              />
            </Field>
            <Field label="Appointment id terkait">
              <input
                className={inputClass}
                value={manualTicketDraft.relatedAppointmentId}
                onChange={(event) =>
                  setManualTicketDraft({ ...manualTicketDraft, relatedAppointmentId: event.target.value })
                }
              />
            </Field>
            <Field label="Professional id terkait">
              <input
                className={inputClass}
                value={manualTicketDraft.relatedProfessionalId}
                onChange={(event) =>
                  setManualTicketDraft({ ...manualTicketDraft, relatedProfessionalId: event.target.value })
                }
              />
            </Field>
            <Field label="Ringkasan">
              <textarea
                className={textareaClass}
                value={manualTicketDraft.summary}
                onChange={(event) => setManualTicketDraft({ ...manualTicketDraft, summary: event.target.value })}
              />
            </Field>
            <Field label="Detail">
              <textarea
                className={textareaClass}
                value={manualTicketDraft.details}
                onChange={(event) => setManualTicketDraft({ ...manualTicketDraft, details: event.target.value })}
              />
            </Field>
          </div>
          <button type="button" className={`${buttonPrimaryClass} mt-4`} onClick={handleCreateManualTicket}>
            Buat ticket manual
          </button>
        </div>

        <div>
          <PanelHeader
            title="Support desk snapshot"
            description="Snapshot support desk terpisah dari mock studio utama. Gunakan panel ini untuk backup atau reset queue support."
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <CountBadge value={`Saved ${formatDateTime(savedAt)}`} />
            <button
              type="button"
              className={buttonSecondaryClass}
              onClick={() => {
                resetSupportDesk();
                setMessage('Support desk direset ke seed lokal.');
              }}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Reset support desk
            </button>
          </div>
          <div className="mt-4 grid gap-4">
            <Field label="Export snapshot JSON">
              <textarea
                className={`${textareaClass} min-h-[180px] font-mono text-[12px]`}
                value={exportSnapshot()}
                readOnly
                spellCheck={false}
              />
            </Field>
            <Field label="Import snapshot JSON">
              <textarea
                className={`${textareaClass} min-h-[180px] font-mono text-[12px]`}
                value={importJson}
                onChange={(event) => setImportJson(event.target.value)}
                spellCheck={false}
                placeholder="Paste export snapshot support desk."
              />
            </Field>
            <button type="button" className={buttonPrimaryClass} onClick={handleImportSupportSnapshot}>
              Import snapshot support
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export const AdminMockStudioScreen = () => {
  const {
    exportSnapshot,
    getTableMeta,
    getTableRows,
    getTables,
    importSnapshot,
    modifiedTableNames,
    replaceTable,
    resetAll,
    resetTable,
    runtimeSelections,
    snapshotSavedAt,
    updateRuntimeSelection,
  } = useAdminConsoleData();
  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const [selectedTable, setSelectedTable] = useState<AdminConsoleTableName>('services');
  const [draftJson, setDraftJson] = useState('');
  const [importJson, setImportJson] = useState('');
  const [message, setMessage] = useState('');
  const [savedMockView, setSavedMockView] = useStoredView('bidanapp:admin-view:mock-studio', {
    savedAt: '',
    selectedTable: 'services' as AdminConsoleTableName,
    tableSearchQuery: '',
  });
  const filteredTableNames = ADMIN_CONSOLE_TABLE_NAMES.filter((tableName) =>
    tableName.toLowerCase().includes(tableSearchQuery.trim().toLowerCase()),
  );
  const tableListPagination = usePaginatedItems(filteredTableNames, 6);

  const selectedTableRows = getTableRows(selectedTable);
  const selectedTableJson = JSON.stringify(selectedTableRows, null, 2);
  const runtimeSelection = runtimeSelections[0];
  const allTables = getTables();
  const selectedTableMeta = getTableMeta(selectedTable);
  const activeTableFilters = [tableSearchQuery.trim() ? `search:${tableSearchQuery.trim()}` : ''].filter(Boolean);
  const tableListResetKey = tableSearchQuery.trim();

  useEffect(() => {
    setDraftJson(selectedTableJson);
  }, [selectedTableJson]);

  useEffect(() => {
    resetPaginationPage(tableListPagination.setPage, tableListResetKey);
  }, [tableListPagination.setPage, tableListResetKey]);

  useEffect(() => {
    if (filteredTableNames.length > 0 && !filteredTableNames.includes(selectedTable)) {
      setSelectedTable(filteredTableNames[0]);
    }
  }, [filteredTableNames, selectedTable]);

  const handleSaveTable = () => {
    try {
      replaceTable(selectedTable, JSON.parse(draftJson));
      setMessage(`Table ${selectedTable} berhasil disimpan ke snapshot admin.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gagal parse JSON table.');
    }
  };

  const handleImportSnapshot = () => {
    try {
      importSnapshot(importJson);
      setMessage('Snapshot admin berhasil diimport.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Import snapshot gagal.');
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Mock Studio"
        title="Raw table editor dan snapshot control"
        description="Edit raw JSON untuk table admin console, import/export snapshot lokal, reset per table, dan kontrol runtime default dari satu studio."
      />

      <section className="grid gap-5 xl:grid-cols-[0.76fr_1.24fr]">
        <div className={panelClass}>
          <PanelHeader
            title="Table snapshot"
            description="Pilih table yang ingin diaudit, lalu buka editor JSON di panel kanan."
            meta={[
              `${formatInteger(filteredTableNames.length)} hasil`,
              `${formatInteger(modifiedTableNames.length)} berubah`,
            ]}
          />
          <input
            className={`${inputClass} mt-4`}
            value={tableSearchQuery}
            onChange={(event) => setTableSearchQuery(event.target.value)}
            placeholder="Cari nama table admin."
          />
          <FilterSummaryBar
            itemLabel="table"
            totalCount={filteredTableNames.length}
            activeFilters={activeTableFilters}
            action={
              <>
                <button
                  type="button"
                  className={buttonSecondaryClass}
                  onClick={() =>
                    setSavedMockView({
                      savedAt: new Date().toISOString(),
                      selectedTable,
                      tableSearchQuery,
                    })
                  }
                >
                  Simpan view
                </button>
                {savedMockView.savedAt ? (
                  <button
                    type="button"
                    className={buttonSecondaryClass}
                    onClick={() => {
                      setTableSearchQuery(savedMockView.tableSearchQuery);
                      setSelectedTable(savedMockView.selectedTable);
                    }}
                  >
                    Muat view
                  </button>
                ) : null}
              </>
            }
            onClear={() => setTableSearchQuery('')}
          />
          <div className="mt-5 space-y-3">
            {tableListPagination.pagedItems.map((tableName) => (
              <ListButton
                key={tableName}
                active={tableName === selectedTable}
                title={tableName}
                subtitle={`${Array.isArray(allTables[tableName]) ? allTables[tableName].length : 0} rows · ${getTableMeta(tableName).isModified ? 'modified' : 'seed'}`}
                onClick={() => setSelectedTable(tableName)}
              />
            ))}
            {filteredTableNames.length === 0 ? (
              <EmptyStateCard
                title="Tidak ada table yang cocok"
                body="Ubah kata kunci pencarian atau reset filter untuk melihat seluruh table admin."
              />
            ) : null}
            <PaginationControls
              itemLabel="table"
              page={tableListPagination.page}
              pageCount={tableListPagination.pageCount}
              pageSize={tableListPagination.pageSize}
              rangeEnd={tableListPagination.rangeEnd}
              rangeStart={tableListPagination.rangeStart}
              setPage={tableListPagination.setPage}
              setPageSize={tableListPagination.setPageSize}
              totalCount={tableListPagination.totalCount}
            />
          </div>
        </div>

        <div className="space-y-5">
          <div className={panelClass}>
            <PanelHeader
              eyebrow="Selected table"
              title={selectedTable}
              description={`${selectedTableMeta.currentCount} row saat ini · seed ${selectedTableMeta.seedCount} · terakhir disimpan ${formatDateTime(snapshotSavedAt)}`}
              action={
                <>
                  <button type="button" className={buttonSecondaryClass} onClick={() => resetTable(selectedTable)}>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Reset table
                  </button>
                  <button type="button" className={buttonSecondaryClass} onClick={resetAll}>
                    <Database className="mr-2 h-4 w-4" />
                    Full reset
                  </button>
                  <button type="button" className={buttonPrimaryClass} onClick={handleSaveTable}>
                    Simpan JSON table
                  </button>
                </>
              }
            />
            <div className="mt-5">
              <textarea
                className={`${textareaClass} min-h-[360px] font-mono text-[12px]`}
                value={draftJson}
                onChange={(event) => setDraftJson(event.target.value)}
                spellCheck={false}
              />
            </div>
            {message ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {message}
              </div>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {modifiedTableNames.length ? (
                modifiedTableNames.map((tableName) => (
                  <span
                    key={tableName}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
                  >
                    {tableName}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-500">Belum ada table yang berbeda dari seed.</span>
              )}
            </div>
          </div>

          <div className={`${panelClass} grid gap-5 lg:grid-cols-2`}>
            <div>
              <PanelHeader
                title="Export snapshot"
                description="Ambil seluruh snapshot admin console untuk backup atau dibagikan ke skenario lain."
              />
              <textarea
                className={`${textareaClass} mt-4 min-h-[220px] font-mono text-[12px]`}
                value={exportSnapshot()}
                readOnly
                spellCheck={false}
              />
            </div>
            <div>
              <PanelHeader
                title="Import snapshot"
                description="Paste snapshot JSON untuk mengganti seluruh state admin console lokal."
              />
              <textarea
                className={`${textareaClass} mt-4 min-h-[220px] font-mono text-[12px]`}
                value={importJson}
                onChange={(event) => setImportJson(event.target.value)}
                spellCheck={false}
                placeholder="Paste snapshot JSON hasil export admin console."
              />
              <button type="button" className={`${buttonPrimaryClass} mt-4`} onClick={handleImportSnapshot}>
                Import snapshot
              </button>
            </div>
          </div>

          {runtimeSelection ? (
            <div className={panelClass}>
              <PanelHeader
                title="Runtime quick controls"
                description="Kontrol cepat ini mengubah consumer, context, home feed, dan jam simulasi tanpa membuka modul lain."
              />
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Field label="Current consumer id">
                  <input
                    className={inputClass}
                    value={runtimeSelection.currentConsumerId}
                    onChange={(event) =>
                      updateRuntimeSelection(runtimeSelection.id, { currentConsumerId: event.target.value })
                    }
                  />
                </Field>
                <Field label="Current user context id">
                  <input
                    className={inputClass}
                    value={runtimeSelection.currentUserContextId}
                    onChange={(event) =>
                      updateRuntimeSelection(runtimeSelection.id, { currentUserContextId: event.target.value })
                    }
                  />
                </Field>
                <Field label="Active home feed id">
                  <input
                    className={inputClass}
                    value={runtimeSelection.activeHomeFeedId}
                    onChange={(event) =>
                      updateRuntimeSelection(runtimeSelection.id, { activeHomeFeedId: event.target.value })
                    }
                  />
                </Field>
                <Field label="Current date time ISO">
                  <input
                    className={inputClass}
                    value={runtimeSelection.currentDateTimeIso}
                    onChange={(event) =>
                      updateRuntimeSelection(runtimeSelection.id, { currentDateTimeIso: event.target.value })
                    }
                  />
                </Field>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
};

const QuickLinkCard = ({ href, title, body }: { href: Route; title: string; body: string }) => (
  <Link
    href={href}
    className="rounded-[26px] border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
  >
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-[15px] font-semibold text-slate-950">{title}</p>
        <p className="mt-2 text-sm leading-6 text-slate-500">{body}</p>
      </div>
      <ArrowUpRight className="h-4 w-4 flex-shrink-0 text-slate-400" />
    </div>
  </Link>
);
