export type StandardFieldAccent = 'blue' | 'pink' | 'slate';
export type StandardFieldSurface = 'soft' | 'muted';

const accentClassNames: Record<StandardFieldAccent, string> = {
  blue: 'focus:border-blue-300 focus:ring-2 focus:ring-blue-100',
  pink: 'focus:border-pink-300 focus:ring-2 focus:ring-pink-100',
  slate: 'focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:bg-white',
};

const optionAccentClassNames: Record<StandardFieldAccent, { active: string; inactive: string }> = {
  blue: {
    active: 'border-blue-200 bg-blue-50 text-blue-700',
    inactive: 'border-slate-200 bg-white text-slate-700 hover:border-blue-100 hover:bg-blue-50/40',
  },
  pink: {
    active: 'border-pink-200 bg-pink-50 text-pink-700',
    inactive: 'border-slate-200 bg-white text-slate-700 hover:border-pink-100 hover:bg-pink-50/40',
  },
  slate: {
    active: 'border-slate-900 bg-slate-900 text-white',
    inactive: 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
  },
};

const surfaceClassNames: Record<StandardFieldSurface, string> = {
  muted: 'border-slate-200 bg-slate-50',
  soft: 'border-slate-200 bg-white',
};

const inputBaseClass =
  'w-full rounded-[18px] border px-4 py-3 text-sm text-slate-700 outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 placeholder:text-slate-400';

export const standardFieldLabelClass = 'mb-2 block text-[12px] font-semibold text-slate-500';
export const standardFieldDescriptionClass = 'mt-1 text-[12px] leading-relaxed text-slate-500';
export const standardDropdownPanelClass =
  'rounded-[22px] border border-slate-200 bg-white p-3 shadow-[0_18px_42px_-30px_rgba(15,23,42,0.35)]';

export const buildStandardInputClass = ({
  accent = 'blue',
  surface = 'muted',
}: {
  accent?: StandardFieldAccent;
  surface?: StandardFieldSurface;
} = {}) => `${inputBaseClass} ${surfaceClassNames[surface]} ${accentClassNames[accent]}`;

export const buildStandardSelectClass = ({
  accent = 'blue',
  surface = 'muted',
}: {
  accent?: StandardFieldAccent;
  surface?: StandardFieldSurface;
} = {}) => `${buildStandardInputClass({ accent, surface })} appearance-none pr-11`;

export const buildStandardFieldButtonClass = ({
  accent = 'blue',
  surface = 'muted',
}: {
  accent?: StandardFieldAccent;
  surface?: StandardFieldSurface;
} = {}) => `${buildStandardInputClass({ accent, surface })} flex items-center justify-between gap-3 text-left`;

export const buildStandardOptionClass = ({
  accent = 'blue',
  isActive,
}: {
  accent?: StandardFieldAccent;
  isActive: boolean;
}) =>
  `w-full rounded-[18px] border px-4 py-3 text-left transition-all ${
    isActive ? optionAccentClassNames[accent].active : optionAccentClassNames[accent].inactive
  }`;
