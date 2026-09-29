import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { Text } from './Text';

// ─── Component ─────────────────────────────────────────────────────────────

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  /** Extra style on the outer wrapper View. */
  containerStyle?: ViewStyle;
}

/**
 * Styled text input for forms.
 * Renders an optional label above and an error message below.
 * Focus state is handled internally to highlight the border.
 */
export function Input({ label, error, containerStyle, style, ...rest }: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <Text variant="label" style={styles.label}>
          {label}
        </Text>
      )}

      <TextInput
        style={[
          styles.input,
          focused && styles.inputFocused,
          error ? styles.inputError : null,
        ]}
        placeholderTextColor={Colors.textMuted}
        selectionColor={Colors.primary}
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

      {error && (
        <Text variant="caption" color={Colors.error} style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.one,
  },
  label: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.one,
  },
  input: {
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: Colors.inputBg,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    paddingHorizontal: Spacing.four,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  inputFocused: {
    borderColor: Colors.inputFocused,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  inputError: {
    borderColor: Colors.error,
  },
  error: {
    textAlign: 'left',
    marginTop: Spacing.one,
  },
});
