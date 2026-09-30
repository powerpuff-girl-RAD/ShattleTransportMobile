import { type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { Text } from './Text';

// ─── Component ─────────────────────────────────────────────────────────────

interface CheckboxProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Label — supports a ReactNode so you can embed styled links inline. */
  label?: ReactNode;
  error?: string;
  containerStyle?: ViewStyle;
}

/**
 * Checkbox
 * Square check control with optional rich-text label.
 * The entire row (box + label) is tappable.
 */
export function Checkbox({
  checked,
  onChange,
  label,
  error,
  containerStyle,
}: CheckboxProps) {
  return (
    <View style={containerStyle}>
      <Pressable
        onPress={() => onChange(!checked)}
        style={styles.row}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
      >
        {/* ── Box ──────────────────────────────────────────────── */}
        <View style={[styles.box, checked && styles.boxChecked]}>
          {checked && <Text style={styles.tick}>✓</Text>}
        </View>

        {/* ── Label ────────────────────────────────────────────── */}
        {label && (
          <View style={styles.labelWrap}>
            {typeof label === 'string' ? (
              <Text variant="body" style={styles.labelText}>
                {label}
              </Text>
            ) : (
              label
            )}
          </View>
        )}
      </Pressable>

      {/* ── Inline error ─────────────────────────────────────── */}
      {error && (
        <Text variant="caption" color={Colors.error} style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const BOX_SIZE = 22;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two + 2,
  },
  box: {
    width: BOX_SIZE,
    height: BOX_SIZE,
    borderRadius: Radius.sm - 2,
    borderWidth: 2,
    borderColor: Colors.orange,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,    // align with first line of label text
  },
  boxChecked: {
    backgroundColor: Colors.orange,
  },
  tick: {
    fontSize: FontSize.sm,
    color: Colors.white,
    fontWeight: '700',
    lineHeight: BOX_SIZE - 4,
  },
  labelWrap: {
    flex: 1,
  },
  labelText: {
    fontSize: FontSize.sm,
    color: Colors.inputLightLabel,
    lineHeight: FontSize.sm * 1.55,
  },
  error: {
    marginTop: Spacing.one,
    textAlign: 'left',
  },
});
