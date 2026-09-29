import { StyleSheet, View } from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';

// ─── Component ─────────────────────────────────────────────────────────────

interface DotPaginatorProps {
  /** Total number of pages. */
  total: number;
  /** Zero-based index of the active page. */
  current: number;
}

/**
 * DotPaginator
 * Renders a row of dots indicating onboarding progress.
 * Active dot is full-white; inactive dots are semi-transparent.
 */
export function DotPaginator({ total, current }: DotPaginatorProps) {
  return (
    <View style={styles.row} accessibilityRole="none" aria-hidden>
      {Array.from({ length: total }, (_, index) => (
        <View
          key={index}
          style={[styles.dot, index === current ? styles.dotActive : styles.dotInactive]}
        />
      ))}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const DOT_SIZE = 7;
const DOT_ACTIVE_SIZE = 9;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  dot: {
    borderRadius: Radius.full,
  },
  dotActive: {
    width: DOT_ACTIVE_SIZE,
    height: DOT_ACTIVE_SIZE,
    backgroundColor: Colors.white,
  },
  dotInactive: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
});
