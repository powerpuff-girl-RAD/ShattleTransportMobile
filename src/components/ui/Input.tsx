import { useState, type ReactNode } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { Text } from './Text';

// ─── Types ─────────────────────────────────────────────────────────────────

/**
 * dark  — Glass-style input for gradient/dark backgrounds (login, onboarding).
 * light — White/bordered input for light-background screens (registration, settings).
 */
type InputVariant = 'dark' | 'light';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  variant?: InputVariant;
  /** Optional element rendered inside the right edge of the input (e.g. eye toggle). */
  rightIcon?: ReactNode;
  /** Extra style on the outer wrapper View. */
  containerStyle?: ViewStyle;
}

// ─── Component ─────────────────────────────────────────────────────────────

/**
 * Styled text input for forms.
 * Supports dark (gradient bg) and light (white bg) variants so
 * both login and registration screens use the same component without duplication.
 */
export function Input({
  label,
  error,
  variant = 'dark',
  rightIcon,
  containerStyle,
  style,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);

  const isLight = variant === 'light';

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <Text
          variant="label"
          style={[styles.label, styles.labelLight]}
        >
          {label}
        </Text>
      )}

      {/* Input row — TextInput + optional right icon */}
      <View style={styles.inputRow}>
        <TextInput
          style={[
            styles.input,
            isLight ? styles.inputLight : styles.inputDark,
            focused && (isLight ? styles.inputLightFocused : styles.inputDarkFocused),
            error ? styles.inputError : null,
            rightIcon ? styles.inputWithIcon : null,
          ]}
          placeholderTextColor={
            isLight ? Colors.inputLightPlaceholder : Colors.textMuted
          }
          selectionColor={isLight ? Colors.inputLightFocused : Colors.primary}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          {...rest}
        />

        {rightIcon != null && (
          <View style={styles.iconWrapper}>
            {rightIcon}
          </View>
        )}
      </View>

      {error && (
        <Text
          variant="caption"
          color={isLight ? Colors.inputLightFocused : Colors.error}
          style={styles.error}
        >
          {error}
        </Text>
      )}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const INPUT_HEIGHT = 52;

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.one,
  },

  // ── Label ──
  label: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: Spacing.one,
    color: Colors.textSecondary,
  },
  labelLight: {
    color: Colors.inputLightLabel,
  },

  // ── Input layout ──
  inputRow: {
    position: 'relative',
  },
  input: {
    height: INPUT_HEIGHT,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.four,
    fontSize: FontSize.base,
  },
  inputWithIcon: {
    paddingRight: Spacing.ten,   // leave room for the icon
  },

  // ── Dark variant (on gradient) ──
  inputDark: {
    backgroundColor: Colors.inputBg,
    borderColor: Colors.inputBorder,
    color: Colors.textPrimary,
  },
  inputDarkFocused: {
    borderColor: Colors.inputFocused,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  // ── Light variant (on white surface) ──
  inputLight: {
    backgroundColor: Colors.inputLightBg,
    borderColor: Colors.inputLightBorder,
    color: Colors.inputLightText,
  },
  inputLightFocused: {
    borderColor: Colors.inputLightFocused,
  },

  // ── Error state ──
  inputError: {
    borderColor: Colors.error,
  },

  // ── Icon slot (positioned inside the input on the right) ──
  iconWrapper: {
    position: 'absolute',
    right: Spacing.four,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    // 'box-none' lets touches pass through the wrapper to the TextInput behind it
    pointerEvents: 'box-none' as 'box-none',
  },

  // ── Error message ──
  error: {
    textAlign: 'left',
    marginTop: Spacing.one,
  },
});
