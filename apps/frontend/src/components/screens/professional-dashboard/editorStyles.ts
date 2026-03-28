import { buildStandardInputClass } from '@/components/ui/form-styles';

export const dashboardInputClass = buildStandardInputClass({
  accent: 'blue',
  surface: 'muted',
});
export const dashboardTextareaClass = `${dashboardInputClass} min-h-[88px] resize-y`;
export const dashboardTextareaTallClass = `${dashboardInputClass} min-h-[104px] resize-y`;
