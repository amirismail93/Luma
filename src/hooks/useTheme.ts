import {useMemo} from 'react';
import {useProfileStore, DEFAULT_ACCENT_COLOR} from '@/store';

/**
 * Parse a hex color string (#RGB or #RRGGBB) into [r, g, b].
 */
function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '');
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  const num = parseInt(h, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Relative luminance per WCAG 2.0.
 */
function luminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export interface ThemeColors {
  /** The raw accent color hex */
  accentColor: string;
  /** Accent at 12% opacity — subtle backgrounds */
  dimColor: string;
  /** Accent at 35% opacity — glows, shadows */
  glowColor: string;
  /** Accent at 28% opacity — borders */
  borderColor: string;
  /** Black or white, whichever has better contrast on the accent */
  textOnAccent: string;
}

/**
 * Returns dynamic accent-derived colors for the active profile.
 * Updates instantly on profile switch or accent change — no reload needed.
 */
export function useTheme(): ThemeColors {
  const accentColor =
    useProfileStore(s => s.getActiveProfile()?.accentColor) ??
    DEFAULT_ACCENT_COLOR;

  return useMemo(() => {
    const [r, g, b] = hexToRgb(accentColor);
    const lum = luminance(r, g, b);

    return {
      accentColor,
      dimColor: `rgba(${r}, ${g}, ${b}, 0.12)`,
      glowColor: `rgba(${r}, ${g}, ${b}, 0.35)`,
      borderColor: `rgba(${r}, ${g}, ${b}, 0.28)`,
      textOnAccent: lum > 0.35 ? '#000000' : '#FFFFFF',
    };
  }, [accentColor]);
}
