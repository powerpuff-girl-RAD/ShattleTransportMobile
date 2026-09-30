import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Gradient } from '@/constants/theme';


// ─── Component ─────────────────────────────────────────────────────────────

interface SplitScreenProps {
  /** Content rendered inside the compact gradient header band. */
  header: ReactNode;
  /** Content rendered inside the scrollable white body section. */
  children: ReactNode;
  /** Override the gradient header height (excluding safe-area top inset). */
  headerHeight?: number;
  /** Extra style applied to the white body container. */
  bodyStyle?: ViewStyle;
}

/**
 * SplitScreen
 * Layout used for forms (registration, settings) that follow the design pattern:
 *   ┌─────────────────────┐
 *   │  Gradient header    │ ← compact brand strip
 *   ├─────────────────────┤
 *   │  White scrollable   │ ← form content
 *   │  body               │
 *   └─────────────────────┘
 *
 * Handles safe-area insets and keyboard avoidance so every screen that
 * uses it doesn't need to repeat that boilerplate.
 */
export function SplitScreen({
  header,
  children,
  headerHeight = 180,
  bodyStyle,
}: SplitScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      {/* ── Gradient header ──────────────────────────────────────── */}
      <LinearGradient
        colors={Gradient.brand.colors}
        locations={Gradient.brand.locations}
        start={Gradient.brand.start}
        end={Gradient.brand.end}
        style={[
          styles.header,
          {
            paddingTop: insets.top,
            height: headerHeight + insets.top,
          },
        ]}
      >
        {header}
      </LinearGradient>

      {/* ── White form body ──────────────────────────────────────── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.bodyFlex}
      >
        <ScrollView
          style={styles.bodyFlex}
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + 32 },
            bodyStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surfaceLight,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  bodyFlex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
});
