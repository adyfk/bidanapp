import type { CSSProperties } from 'react';

export interface ThemePalette {
  accent: string;
  background: string;
  border: string;
  borderStrong: string;
  danger: string;
  focusRing: string;
  heroGradient: string;
  heroOverlay: string;
  info: string;
  muted: string;
  navActiveBackground: string;
  navActiveText: string;
  pillBackground: string;
  pillText: string;
  primary: string;
  secondary: string;
  success: string;
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;
  text: string;
  textMuted: string;
  textStrong: string;
  warning: string;
}

export interface BrandTheme extends ThemePalette {
  id: string;
  label: string;
}

export interface DesignTokens {
  radiusHero: string;
  radiusPanel: string;
  radiusCard: string;
  radiusInput: string;
  radiusPill: string;
  shadowHero: string;
  shadowPanel: string;
  shadowCard: string;
  shadowSoft: string;
}

export type MarketplaceThemePreset = 'classic';
export type MarketplaceMotionPreset = 'rich';

export interface MotionTokens {
  bounce: number;
  durationFast: number;
  durationPage: number;
  durationSlow: number;
  springStiffness: number;
}

export const MASTER_DESIGN_TOKENS: DesignTokens = {
  radiusHero: '36px',
  radiusPanel: '30px',
  radiusCard: '28px',
  radiusInput: '18px',
  radiusPill: '999px',
  shadowHero: '0 28px 64px -42px rgba(117, 48, 76, 0.28)',
  shadowPanel: '0 20px 46px -38px rgba(74, 46, 58, 0.18)',
  shadowCard: '0 16px 38px -34px rgba(74, 46, 58, 0.14)',
  shadowSoft: '0 12px 32px -26px rgba(74, 46, 58, 0.12)',
};

export const MASTER_MOTION_TOKENS: MotionTokens = {
  bounce: 0.22,
  durationFast: 0.2,
  durationPage: 0.38,
  durationSlow: 0.52,
  springStiffness: 290,
};

export function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export function themeStyleVariables(theme: ThemePalette): CSSProperties {
  return {
    '--ui-accent': theme.accent,
    '--ui-background': theme.background,
    '--ui-border': theme.border,
    '--ui-border-strong': theme.borderStrong,
    '--ui-danger': theme.danger,
    '--ui-focus-ring': theme.focusRing,
    '--ui-hero-gradient': theme.heroGradient,
    '--ui-hero-overlay': theme.heroOverlay,
    '--ui-info': theme.info,
    '--ui-muted': theme.muted,
    '--ui-nav-active-background': theme.navActiveBackground,
    '--ui-nav-active-text': theme.navActiveText,
    '--ui-pill-background': theme.pillBackground,
    '--ui-pill-text': theme.pillText,
    '--ui-primary': theme.primary,
    '--ui-secondary': theme.secondary,
    '--ui-success': theme.success,
    '--ui-surface': theme.surface,
    '--ui-surface-elevated': theme.surfaceElevated,
    '--ui-surface-muted': theme.surfaceMuted,
    '--ui-text': theme.text,
    '--ui-text-muted': theme.textMuted,
    '--ui-text-strong': theme.textStrong,
    '--ui-text-subtle': theme.muted,
    '--ui-warning': theme.warning,
    '--ui-radius-hero': MASTER_DESIGN_TOKENS.radiusHero,
    '--ui-radius-panel': MASTER_DESIGN_TOKENS.radiusPanel,
    '--ui-radius-card': MASTER_DESIGN_TOKENS.radiusCard,
    '--ui-radius-input': MASTER_DESIGN_TOKENS.radiusInput,
    '--ui-radius-pill': MASTER_DESIGN_TOKENS.radiusPill,
    '--ui-shadow-hero': MASTER_DESIGN_TOKENS.shadowHero,
    '--ui-shadow-panel': MASTER_DESIGN_TOKENS.shadowPanel,
    '--ui-shadow-card': MASTER_DESIGN_TOKENS.shadowCard,
    '--ui-shadow-soft': MASTER_DESIGN_TOKENS.shadowSoft,
    '--ui-motion-fast': `${MASTER_MOTION_TOKENS.durationFast}s`,
    '--ui-motion-page': `${MASTER_MOTION_TOKENS.durationPage}s`,
    '--ui-motion-slow': `${MASTER_MOTION_TOKENS.durationSlow}s`,
    backgroundColor: theme.background,
    color: theme.text,
  } as CSSProperties;
}

export type StatusTone = 'accent' | 'danger' | 'info' | 'neutral' | 'success' | 'warning';

export function toneStyle(tone: StatusTone): CSSProperties {
  switch (tone) {
    case 'accent':
      return {
        backgroundColor: 'var(--ui-pill-background)',
        color: 'var(--ui-pill-text)',
        borderColor: 'transparent',
      };
    case 'success':
      return {
        backgroundColor: 'color-mix(in srgb, var(--ui-success) 14%, white)',
        color: 'var(--ui-success)',
        borderColor: 'color-mix(in srgb, var(--ui-success) 24%, transparent)',
      };
    case 'warning':
      return {
        backgroundColor: 'color-mix(in srgb, var(--ui-warning) 14%, white)',
        color: 'var(--ui-warning)',
        borderColor: 'color-mix(in srgb, var(--ui-warning) 24%, transparent)',
      };
    case 'danger':
      return {
        backgroundColor: 'color-mix(in srgb, var(--ui-danger) 14%, white)',
        color: 'var(--ui-danger)',
        borderColor: 'color-mix(in srgb, var(--ui-danger) 24%, transparent)',
      };
    case 'info':
      return {
        backgroundColor: 'color-mix(in srgb, var(--ui-info) 14%, white)',
        color: 'var(--ui-info)',
        borderColor: 'color-mix(in srgb, var(--ui-info) 24%, transparent)',
      };
    default:
      return {
        backgroundColor: 'var(--ui-surface-muted)',
        color: 'var(--ui-text-muted)',
        borderColor: 'var(--ui-border)',
      };
  }
}
