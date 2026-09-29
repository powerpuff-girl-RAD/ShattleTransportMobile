import { StyleSheet, View } from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { Text } from '@/components/ui';

/**
 * BrandLogo
 * Reusable brand identity block used on every onboarding/auth screen.
 * Renders the bus icon container + app name + subtitle in one shot.
 */
interface BrandLogoProps {
  /** Suppress the subtitle tagline (e.g. on the login screen). */
  hideSubtitle?: boolean;
}

export function BrandLogo({ hideSubtitle = false }: BrandLogoProps) {
  return (
    <View style={styles.container}>
      {/* Bus icon in a glass-style rounded container */}
      <View style={styles.iconContainer}>
        <Text style={styles.iconEmoji}>🚌</Text>
      </View>

      <Text variant="title" style={styles.appName}>
        Shattle Transport
      </Text>

      {!hideSubtitle && (
        <Text variant="subtitle" style={styles.tagline}>
          Plan journeys, tap to pay and carry your ticket in one place.
        </Text>
      )}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const ICON_SIZE = 72;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.four,
  },
  iconContainer: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: Radius.xl,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 34,
    // Optionally adjust vertical alignment per platform
    lineHeight: ICON_SIZE - 10,
  },
  appName: {
    marginTop: Spacing.two,
  },
  tagline: {
    paddingHorizontal: Spacing.nine,
  },
});
