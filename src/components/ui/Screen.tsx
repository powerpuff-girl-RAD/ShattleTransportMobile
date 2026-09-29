import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gradient, Layout } from '@/constants/theme';

// ─── Component ─────────────────────────────────────────────────────────────

interface ScreenProps {
  children: React.ReactNode;
  /** Extra style applied to the inner safe-area container. */
  style?: ViewStyle;
  /** Constrain content to maxContentWidth (useful for tablets/web). */
  constrain?: boolean;
}

/**
 * Full-screen gradient wrapper used on every auth screen.
 * Replaces the need to set up LinearGradient + SafeAreaView individually
 * in each screen — zero duplication.
 */
export function Screen({ children, style, constrain = true }: ScreenProps) {
  return (
    <LinearGradient
      colors={Gradient.brand.colors}
      locations={Gradient.brand.locations}
      start={Gradient.brand.start}
      end={Gradient.brand.end}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.content, constrain && styles.constrained, style]}>
          {children}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    width: '100%',
  },
  constrained: {
    maxWidth: Layout.maxContentWidth,
  },
});
