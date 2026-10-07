import { StyleSheet, Text as RNText, type TextStyle, type TextProps, type StyleProp } from 'react-native';
import { Colors, FontSize, FontWeight, LetterSpacing } from '@/constants/theme';

// ─── Variant definitions ───────────────────────────────────────────────────

type Variant =
  | 'title'      // Screen hero title  — bold, all-caps, large
  | 'heading'    // Section heading    — bold
  | 'subtitle'   // Under-title copy   — regular, secondary colour
  | 'body'       // Body / paragraph   — regular
  | 'label'      // Button text        — semibold
  | 'caption'    // Small helper text  — muted
  | 'code';      // Monospace          — regular

interface AppTextProps extends TextProps {
  variant?: Variant;
  /** Override the font colour. */
  color?: string;
  style?: StyleProp<TextStyle>;
}

// ─── Component ─────────────────────────────────────────────────────────────

export function Text({ variant = 'body', color, style, ...rest }: AppTextProps) {
  return (
    <RNText
      style={[styles.base, styles[variant], color ? { color } : null, style]}
      {...rest}
    />
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  base: {
    color: Colors.textPrimary,
  },
  title: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    letterSpacing: LetterSpacing.widest,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  heading: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: LetterSpacing.tight,
  },
  subtitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: FontSize.base * 1.5,
  },
  body: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.regular,
    color: Colors.textPrimary,
    lineHeight: FontSize.base * 1.5,
  },
  label: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    letterSpacing: LetterSpacing.wide,
  },
  caption: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  code: {
    fontSize: FontSize.sm,
    fontFamily: 'monospace',
    color: Colors.textSecondary,
  },
});
