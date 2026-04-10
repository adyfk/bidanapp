'use client';

import type { DirectoryOffering } from '@marketplace/marketplace-core/directory';
import { StatusPill } from '@marketplace/ui/primitives';
import { deliveryModeLabel, formatCurrency } from '../../../../lib/marketplace-copy';
import { InitialPortrait } from '../../shared/parts/portrait';

function shortDeliveryLabel(value: string | undefined, locale: string) {
  const label = deliveryModeLabel(value, locale);
  return label
    .replace(/^Kunjungan rumah$/i, 'Rumah')
    .replace(/^Sesi online$/i, 'Online')
    .replace(/^Produk digital$/i, 'Digital');
}

export function HomeServiceTile({ locale, offering }: { locale: string; offering: DirectoryOffering }) {
  return (
    <a
      className="relative block h-[184px] min-w-[184px] overflow-hidden rounded-[22px] border p-4 shadow-[0_12px_32px_-28px_rgba(74,46,58,0.16)] transition-shadow hover:shadow-[0_16px_36px_-28px_rgba(74,46,58,0.2)] active:scale-[0.99]"
      href={`/${locale}/s/${offering.slug}`}
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, color-mix(in srgb, var(--ui-surface-muted) 48%, white) 100%)',
        borderColor: 'var(--ui-border)',
      }}
    >
      <div
        className="absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-[0.06] transition-transform duration-500"
        style={{ backgroundColor: 'var(--ui-primary)' }}
      />
      <div className="relative z-10 flex h-full flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2">
            <InitialPortrait label={offering.title} size="small" />
            <StatusPill tone="neutral">{shortDeliveryLabel(offering.deliveryMode, locale)}</StatusPill>
          </div>
          <div className="mt-4 line-clamp-2 break-words text-[15px] font-bold leading-snug text-gray-900 [overflow-wrap:anywhere]">
            {offering.title}
          </div>
          <div className="mt-2 truncate text-[11px] font-semibold" style={{ color: 'var(--ui-text-muted)' }}>
            {offering.professionalDisplayName}
          </div>
        </div>
        <div className="flex items-end justify-between gap-3">
          <span className="text-[11px] font-semibold" style={{ color: 'var(--ui-primary)' }}>
            Detail
          </span>
          <div className="text-right text-[13px] font-bold text-gray-900">
            {formatCurrency(offering.priceAmount, locale, offering.currency)}
          </div>
        </div>
      </div>
    </a>
  );
}
