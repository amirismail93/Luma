/**
 * Luma — Global dark theme
 *
 * Ultra-sleek palette optimized for 10-foot TV UIs.
 * Deep blacks, soft whites, and a cool-blue accent (#00C2FF).
 */

export const colors = {
  /** Absolute black — used for the root background */
  background: '#0A0A0A',
  /** Slightly lifted surface for cards, modals, rows */
  surface: '#141414',
  /** Elevated surface — focused cards, overlays */
  surfaceLight: '#1E1E1E',
  /** Borders & subtle dividers */
  border: '#2A2A2A',

  /** Primary text — soft white, not pure #FFF to reduce glare */
  textPrimary: '#F0F0F0',
  /** Secondary / muted text */
  textSecondary: '#A0A0A0',
  /** Disabled / hint text */
  textDisabled: '#5C5C5C',

  /** Cool-blue accent */
  accent: '#00C2FF',
  /** Accent pressed / active variant */
  accentDark: '#009ACC',
  /** Accent at 20 % opacity — focus rings, highlights */
  accentMuted: 'rgba(0, 194, 255, 0.20)',

  /** Success / live indicator */
  success: '#00E676',
  /** Warning */
  warning: '#FFD600',
  /** Error / destructive */
  error: '#FF5252',

  /** Transparent */
  transparent: 'transparent',
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const radii = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 9999,
} as const;

export const typography = {
  /** Large hero titles (e.g. movie name on detail page) */
  hero: {
    fontSize: 42,
    fontWeight: '700' as const,
    lineHeight: 50,
    color: colors.textPrimary,
  },
  /** Section headings */
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
    color: colors.textPrimary,
  },
  h2: {
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 28,
    color: colors.textPrimary,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 18,
    color: colors.textSecondary,
  },
} as const;

/** Default focus-ring style for D-pad-highlighted elements */
export const focusRing = {
  borderWidth: 3,
  borderColor: colors.accent,
  borderRadius: radii.md,
} as const;

const theme = {
  colors,
  spacing,
  radii,
  typography,
  focusRing,
} as const;

export type Theme = typeof theme;
export default theme;
