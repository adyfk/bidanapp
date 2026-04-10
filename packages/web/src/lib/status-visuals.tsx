'use client';

import type { StatusTone } from '@marketplace/ui';
import { StatusChip } from '@marketplace/ui';
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  HelpCircle,
  House,
  PackageCheck,
  PauseCircle,
  RotateCcw,
  ShieldCheck,
  Video,
  XCircle,
} from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';
import {
  deliveryModeLabel,
  isEnglishLocale,
  offeringStatusLabel,
  offeringTypeLabel,
  orderStatusLabel,
  paymentStatusLabel,
  payoutStatusLabel,
  refundStatusLabel,
  reviewStatusLabel,
  supportStatusLabel,
} from './marketplace-copy';

type IconComponent = ComponentType<{ className?: string }>;

export interface StatusVisual {
  ariaLabel: string;
  icon: ReactNode;
  label: string;
  tone: StatusTone;
}

function iconNode(Icon: IconComponent) {
  return <Icon className="h-full w-full" />;
}

function visual(label: string, tone: StatusTone, Icon: IconComponent): StatusVisual {
  return {
    ariaLabel: label,
    icon: iconNode(Icon),
    label,
    tone,
  };
}

function normalized(value: string | undefined | null) {
  return value || '';
}

export function shortDeliveryModeLabel(value: string | undefined, locale?: string | null) {
  const en = isEnglishLocale(locale);
  switch (value) {
    case 'home_visit':
    case 'on_site':
      return en ? 'Home' : 'Rumah';
    case 'online':
      return 'Online';
    case 'digital':
      return en ? 'Digital' : 'Digital';
    default:
      return deliveryModeLabel(value, locale);
  }
}

export function deliveryModeVisual(
  value: string | undefined,
  locale?: string | null,
  options?: { compactLabel?: boolean },
) {
  const label = options?.compactLabel ? shortDeliveryModeLabel(value, locale) : deliveryModeLabel(value, locale);

  switch (normalized(value)) {
    case 'home_visit':
    case 'on_site':
      return visual(label, 'info', House);
    case 'online':
      return visual(label, 'accent', Video);
    case 'digital':
      return visual(label, 'neutral', FileText);
    default:
      return visual(label, 'neutral', HelpCircle);
  }
}

export function offeringTypeVisual(value: string | undefined, locale?: string | null) {
  const label = offeringTypeLabel(value, locale);

  switch (normalized(value)) {
    case 'home_visit':
      return visual(label, 'info', House);
    case 'online_session':
      return visual(label, 'accent', Video);
    case 'digital_product':
      return visual(label, 'neutral', FileText);
    default:
      return visual(label, 'neutral', PackageCheck);
  }
}

export function offeringStatusVisual(value: string | undefined, locale?: string | null) {
  const label = offeringStatusLabel(value, locale);

  switch (normalized(value)) {
    case 'published':
      return visual(label, 'success', CheckCircle2);
    case 'draft':
      return visual(label, 'warning', Clock3);
    case 'archived':
      return visual(label, 'neutral', Archive);
    default:
      return visual(label, 'neutral', HelpCircle);
  }
}

export function orderStatusVisual(value: string | undefined, locale?: string | null) {
  const label = orderStatusLabel(value, locale);

  switch (normalized(value)) {
    case 'pending_payment':
      return visual(label, 'warning', CreditCard);
    case 'pending_fulfillment':
      return visual(label, 'info', PackageCheck);
    case 'in_progress':
      return visual(label, 'accent', Clock3);
    case 'completed':
      return visual(label, 'success', CheckCircle2);
    case 'refunded':
      return visual(label, 'info', RotateCcw);
    case 'cancelled':
      return visual(label, 'danger', XCircle);
    default:
      return visual(label, 'neutral', HelpCircle);
  }
}

export function paymentStatusVisual(value: string | undefined, locale?: string | null) {
  const label = paymentStatusLabel(value, locale);

  switch (normalized(value)) {
    case 'paid':
      return visual(label, 'success', CreditCard);
    case 'pending':
    case 'pending_payment':
      return visual(label, 'warning', Clock3);
    case 'refunded':
      return visual(label, 'info', RotateCcw);
    case 'failed':
    case 'cancelled':
      return visual(label, 'danger', AlertTriangle);
    case 'expired':
      return visual(label, 'warning', Clock3);
    default:
      return visual(label, 'neutral', CreditCard);
  }
}

export function supportStatusVisual(value: string | undefined, locale?: string | null) {
  const label = supportStatusLabel(value, locale);

  switch (normalized(value)) {
    case 'new':
      return visual(label, 'info', HelpCircle);
    case 'triaged':
    case 'reviewing':
      return visual(label, 'warning', Clock3);
    case 'resolved':
      return visual(label, 'success', CheckCircle2);
    case 'refunded':
      return visual(label, 'info', RotateCcw);
    case 'closed':
      return visual(label, 'neutral', Archive);
    default:
      return visual(label, 'neutral', HelpCircle);
  }
}

export function reviewStatusVisual(value: string | undefined, locale?: string | null) {
  const label = reviewStatusLabel(value, locale);

  switch (normalized(value)) {
    case 'approved':
      return visual(label, 'success', ShieldCheck);
    case 'submitted':
    case 'pending_review':
      return visual(label, 'warning', Clock3);
    case 'changes_requested':
      return visual(label, 'warning', AlertTriangle);
    case 'rejected':
      return visual(label, 'danger', XCircle);
    case 'paused':
      return visual(label, 'neutral', PauseCircle);
    case 'draft':
      return visual(label, 'neutral', FileText);
    default:
      return visual(label, 'neutral', HelpCircle);
  }
}

export function refundStatusVisual(value: string | undefined, locale?: string | null) {
  const label = refundStatusLabel(value, locale);

  switch (normalized(value)) {
    case 'approved':
      return visual(label, 'info', CheckCircle2);
    case 'processed':
      return visual(label, 'success', RotateCcw);
    case 'failed':
      return visual(label, 'danger', AlertTriangle);
    case 'pending':
      return visual(label, 'warning', Clock3);
    default:
      return visual(label, 'neutral', RotateCcw);
  }
}

export function payoutStatusVisual(value: string | undefined, locale?: string | null) {
  const label = payoutStatusLabel(value, locale);

  switch (normalized(value)) {
    case 'paid':
      return visual(label, 'success', CheckCircle2);
    case 'processing':
      return visual(label, 'info', Clock3);
    case 'failed':
      return visual(label, 'danger', AlertTriangle);
    case 'pending':
      return visual(label, 'warning', Clock3);
    default:
      return visual(label, 'neutral', CreditCard);
  }
}

export function VisualStatusChip({
  className,
  compact = false,
  visual: item,
}: {
  className?: string;
  compact?: boolean;
  visual: StatusVisual;
}) {
  return (
    <StatusChip
      ariaLabel={item.ariaLabel}
      className={className}
      compact={compact}
      icon={item.icon}
      label={item.label}
      tone={item.tone}
    />
  );
}

export function DeliveryModeChip({
  compact,
  compactLabel,
  locale,
  value,
}: {
  compact?: boolean;
  compactLabel?: boolean;
  locale?: string | null;
  value?: string;
}) {
  return <VisualStatusChip compact={compact} visual={deliveryModeVisual(value, locale, { compactLabel })} />;
}

export function OfferingTypeChip({
  compact,
  locale,
  value,
}: {
  compact?: boolean;
  locale?: string | null;
  value?: string;
}) {
  return <VisualStatusChip compact={compact} visual={offeringTypeVisual(value, locale)} />;
}

export function OfferingStatusChip({
  compact,
  locale,
  value,
}: {
  compact?: boolean;
  locale?: string | null;
  value?: string;
}) {
  return <VisualStatusChip compact={compact} visual={offeringStatusVisual(value, locale)} />;
}

export function OrderStatusChip({
  compact,
  locale,
  value,
}: {
  compact?: boolean;
  locale?: string | null;
  value?: string;
}) {
  return <VisualStatusChip compact={compact} visual={orderStatusVisual(value, locale)} />;
}

export function PaymentStatusChip({
  compact,
  locale,
  value,
}: {
  compact?: boolean;
  locale?: string | null;
  value?: string;
}) {
  return <VisualStatusChip compact={compact} visual={paymentStatusVisual(value, locale)} />;
}

export function SupportStatusChip({
  compact,
  locale,
  value,
}: {
  compact?: boolean;
  locale?: string | null;
  value?: string;
}) {
  return <VisualStatusChip compact={compact} visual={supportStatusVisual(value, locale)} />;
}

export function ReviewStatusChip({
  compact,
  locale,
  value,
}: {
  compact?: boolean;
  locale?: string | null;
  value?: string;
}) {
  return <VisualStatusChip compact={compact} visual={reviewStatusVisual(value, locale)} />;
}

export function RefundStatusChip({
  compact,
  locale,
  value,
}: {
  compact?: boolean;
  locale?: string | null;
  value?: string;
}) {
  return <VisualStatusChip compact={compact} visual={refundStatusVisual(value, locale)} />;
}

export function PayoutStatusChip({
  compact,
  locale,
  value,
}: {
  compact?: boolean;
  locale?: string | null;
  value?: string;
}) {
  return <VisualStatusChip compact={compact} visual={payoutStatusVisual(value, locale)} />;
}
