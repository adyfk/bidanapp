import { buildStandardInputClass } from '@/components/ui/form-styles';

export const surfaceCardClass =
  'rounded-[24px] border border-slate-200/80 bg-white shadow-[0_14px_40px_-28px_rgba(15,23,42,0.18)]';

export const surfaceCardPaddedClass = `${surfaceCardClass} p-4`;

export const insetSurfaceClass = 'rounded-[20px] border border-slate-200 bg-slate-50';

export const softInputClass = buildStandardInputClass({
  accent: 'blue',
  surface: 'soft',
});

export const mutedInputClass = buildStandardInputClass({
  accent: 'blue',
  surface: 'muted',
});

export const segmentedContainerClass = 'rounded-[18px] bg-slate-100 p-1';

export const segmentedButtonClass = (isActive: boolean) =>
  `rounded-[14px] px-4 py-2.5 text-[13px] font-bold transition-all ${
    isActive ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
  }`;

export const filterChipClass = (isActive: boolean) =>
  `rounded-full border px-4 py-2.5 text-[13px] font-bold transition-all ${
    isActive
      ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-[0_14px_30px_-24px_rgba(37,99,235,0.45)]'
      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
  }`;

export const compactBadgeClass = 'rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700';

export const iconButtonSurfaceClass =
  'flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50 active:scale-95';

export const blushPanelClass =
  'rounded-[28px] border border-pink-100/80 bg-[linear-gradient(180deg,#FFF7FB_0%,#FFFFFF_100%)] shadow-[0_18px_40px_-28px_rgba(17,24,39,0.18)]';

export const blushSubtlePanelClass =
  'rounded-[24px] border border-pink-100/80 bg-[linear-gradient(180deg,#FFFFFF_0%,#FFF7FB_100%)] shadow-[0_18px_40px_-30px_rgba(17,24,39,0.25)]';

export const blushInputShellClass =
  'rounded-[24px] border border-pink-100/70 bg-[linear-gradient(180deg,#FFF9FC_0%,#FFFFFF_100%)]';

export const softWhitePanelClass =
  'rounded-[24px] border border-gray-100 bg-white shadow-[0_18px_36px_-32px_rgba(17,24,39,0.25)]';

export const softMetricTileClass = 'rounded-[20px] border border-gray-100 bg-white px-4 py-4';

export const neutralSoftPillClass =
  'inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-600 shadow-[inset_0_0_0_1px_rgba(229,231,235,1)]';

export const accentSoftPillClass =
  'inline-flex items-center gap-2 rounded-full bg-pink-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-pink-600';

export const accentPrimaryButtonClass =
  'inline-flex items-center justify-center rounded-full bg-[linear-gradient(180deg,#F7259B_0%,#E11D87_100%)] px-5 py-3 text-[13px] font-bold text-white shadow-[0_18px_28px_-18px_rgba(233,30,140,0.42)] transition-transform active:scale-[0.98]';

export const darkPrimaryButtonClass =
  'inline-flex items-center justify-center rounded-full bg-[#111827] px-5 py-3 text-[13px] font-bold text-white transition-transform active:scale-[0.98]';
