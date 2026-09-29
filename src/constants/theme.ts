/**
 * ─────────────────────────────────────────────────────────────────────────
 *  SHATTLE TRANSPORT  —  Master Design System
 *  Single source of truth for ALL colours, typography, spacing, and layout.
 *  Import from here; never hard-code a value anywhere else.
 * ─────────────────────────────────────────────────────────────────────────
 */

import '@/global.css';
import { Platform } from 'react-native';

// ─── Brand Colours ────────────────────────────────────────────────────────
export const Colors = {
  // Gradient stops (top → bottom)
  gradientTop: '#083C2F',
  gradientMid: '#0A6048',
  gradientBottom: '#0DC87A',

  // Primary brand green (used for accents, active states)
  primary: '#0DC87A',
  primaryDark: '#0A9A5F',

  // CTA orange — "Continue as Passenger" style buttons
  orange: '#E07820',
  orangePressed: '#C46918',

  // Neutral
  white: '#FFFFFF',
  black: '#000000',

  // Text on dark / gradient backgrounds
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.70)',
  textMuted: 'rgba(255,255,255,0.45)',

  // Error / success
  error: '#E53935',
  success: '#0DC87A',

  // Glass / overlay surfaces
  glass: 'rgba(0,0,0,0.22)',
  glassBorder: 'rgba(255,255,255,0.18)',
  inputBg: 'rgba(255,255,255,0.12)',
  inputBorder: 'rgba(255,255,255,0.28)',
  inputFocused: 'rgba(255,255,255,0.55)',
  overlay: 'rgba(0,0,0,0.45)',
} as const;

// ─── Gradient Config ──────────────────────────────────────────────────────
export const Gradient = {
  brand: {
    colors: [Colors.gradientTop, Colors.gradientMid, Colors.gradientBottom] as const,
    locations: [0, 0.45, 1] as const,
    start: { x: 0, y: 0 } as const,
    end: { x: 0, y: 1 } as const,
  },
} as const;

// ─── Typography ───────────────────────────────────────────────────────────
export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 30,
  '3xl': 36,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  black: '900' as const,
};

export const LetterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 1,
  wider: 2,
  widest: 4,
} as const;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', mono: 'ui-monospace' },
  android: { sans: 'Roboto', mono: 'monospace' },
  default: { sans: 'normal', mono: 'monospace' },
  web: { sans: 'var(--font-display)', mono: 'var(--font-mono)' },
})!;

// ─── Spacing (4-point base grid) ──────────────────────────────────────────
export const Spacing = {
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
  seven: 28,
  eight: 32,
  nine: 40,
  ten: 48,
  eleven: 56,
  twelve: 64,
} as const;

// ─── Border Radius ────────────────────────────────────────────────────────
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;

// ─── Shadows ──────────────────────────────────────────────────────────────
export const Shadow = {
  sm: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.14, shadowRadius: 5, elevation: 2 },
    android: { elevation: 2 },
    default: {},
  }),
  md: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.20, shadowRadius: 12, elevation: 5 },
    android: { elevation: 5 },
    default: {},
  }),
  lg: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.26, shadowRadius: 20, elevation: 9 },
    android: { elevation: 9 },
    default: {},
  }),
} as const;

// ─── Layout ───────────────────────────────────────────────────────────────
export const Layout = {
  maxContentWidth: 428,
  screenPaddingH: Spacing.six,    // horizontal screen padding
  bottomTabHeight: 80,
  headerHeight: 56,
} as const;

// ─── Z-Index ──────────────────────────────────────────────────────────────
export const ZIndex = {
  base: 0,
  above: 10,
  modal: 100,
} as const;
