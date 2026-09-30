/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';

/**
 * Returns the current design-system colour tokens.
 *
 * The app uses a single brand palette (no separate light/dark theme object),
 * so this hook simply exposes the flat Colors map.  Screens and components
 * import from here rather than from theme.ts directly so the abstraction layer
 * is preserved if a dark-mode variant is added in the future.
 */
export function useTheme() {
  return Colors;
}
