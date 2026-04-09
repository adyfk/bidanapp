export type UiParityStatus = 'matched' | 'missing' | 'partial' | 'regressed';

export interface UiParitySectionCheck {
  id: string;
  notes?: string;
  status: UiParityStatus;
  title: string;
}

export interface UiParityFlowCheck {
  id: string;
  notes?: string;
  status: UiParityStatus;
  title: string;
}

export interface UiParityScreenSpec {
  currentSurface: string;
  flowChecks: UiParityFlowCheck[];
  layoutChecks: UiParitySectionCheck[];
  legacySurface: string;
  recipeChecks: UiParitySectionCheck[];
  screenId: string;
}
