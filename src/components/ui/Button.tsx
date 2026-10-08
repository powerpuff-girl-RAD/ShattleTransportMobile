import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type PressableProps,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { Colors, FontSize, FontWeight, LetterSpacing, Radius, Spacing } from '@/constants/theme';
import { Text } from './Text';

// ─── Variant definitions ───────────────────────────────────────────────────

type Variant =
  | 'primary'    // Orange filled  — main CTA  (Continue as Passenger)
  | 'outline'    // White border   — secondary (Continue as Visitor)
  | 'ghost';     // No border/fill — tertiary  (Continue without an account)

interface ButtonProps extends Omit<PressableProps, 'style'> {
  variant?: Variant;
  label?: string;
  title?: string;
  loading?: boolean;
  style?: ViewStyle;
}

// ─── Component ─────────────────────────────────────────────────────────────

export function Button({
  variant = 'primary',
  label,
  title,
  loading = false,
  style,
  disabled,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const buttonLabel = label ?? title ?? '';

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !isDisabled && styles[`${variant}Pressed`],
        isDisabled && styles.disabled,
        style,
      ]}
      disabled={isDisabled}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? Colors.white : Colors.white}
          size="small"
        />
      ) : (
        <Text variant="label" style={[styles.label, styles[`${variant}Label`]]}>
          {buttonLabel}
        </Text>
      )}
    </Pressable>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const BUTTON_HEIGHT = 54;

const styles = StyleSheet.create({
  base: {
    height: BUTTON_HEIGHT,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.six,
  },

  // ── primary (orange fill) ──
  primary: {
    backgroundColor: Colors.orange,
  },
  primaryPressed: {
    backgroundColor: Colors.orangePressed,
  },
  primaryLabel: {
    color: Colors.white,
  },

  // ── outline (white border) ──
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  outlinePressed: {
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  outlineLabel: {
    color: Colors.white,
  },

  // ── ghost (no border, text only) ──
  ghost: {
    backgroundColor: 'transparent',
    height: 'auto' as unknown as number,   // shrink-wrap content
    paddingVertical: Spacing.two,
  },
  ghostPressed: {
    opacity: 0.60,
  },
  ghostLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    letterSpacing: LetterSpacing.normal,
  },

  label: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    letterSpacing: LetterSpacing.wide,
  },

  disabled: {
    opacity: 0.45,
  },
});
