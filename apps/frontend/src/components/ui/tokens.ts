export const surfaceCardClass =
  'rounded-[24px] border border-slate-200/80 bg-white shadow-[0_14px_40px_-28px_rgba(15,23,42,0.18)]';

export const surfaceCardPaddedClass = `${surfaceCardClass} p-4`;

export const insetSurfaceClass = 'rounded-[20px] border border-slate-200 bg-slate-50';

export const softInputClass =
  'w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100';

export const mutedInputClass =
  'w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100';

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
