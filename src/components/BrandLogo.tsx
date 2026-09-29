import { StyleSheet, View } from 'react-native';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { Text } from '@/components/ui';


/**
 * BrandLogo
 * Reusable brand identity block used on every onboarding/auth screen.
 * Renders the bus icon container + app name + subtitle in one shot.
 */
interface BrandLogoProps {
  /** Suppress the subtitle tagline (e.g. on the login screen). */
  hideSubtitle?: boolean;
  /**
   * Compact layout for tight spaces (registration header band).
   * Reduces icon size, font size, and vertical spacing.
   */
  compact?: boolean;
}


export function BrandLogo({ hideSubtitle = false, compact = false }: BrandLogoProps) {
  return (
    <View style={compact ? [styles.container, styles.containerCompact] : styles.container}>
      {/* Bus icon in a glass-style rounded container */}
      <View style={compact ? [styles.iconContainer, styles.iconContainerCompact] : styles.iconContainer}>
        <Text style={compact ? [styles.iconEmoji, styles.iconEmojiCompact] : styles.iconEmoji}>
          🚌
        </Text>
      </View>

      <Text
        variant="title"
        style={compact ? [styles.appName, styles.appNameCompact] : styles.appName}
      >
        Shattle Transport
      </Text>

      {!hideSubtitle && (
        <Text
          variant="subtitle"
          style={compact ? [styles.tagline, styles.taglineCompact] : styles.tagline}
        >
          {compact
            ? 'Plan journeys, tap to pay and carry tickets'
            : 'Plan journeys, tap to pay and carry your ticket in one place.'}
        </Text>
      )}
    </View>
  );
}



// ─── Styles ────────────────────────────────────────────────────────────────

const ICON_SIZE = 72;
const ICON_SIZE_COMPACT = 52;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.four,
  },
  containerCompact: {
    gap: Spacing.two,
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
  iconContainerCompact: {
    width: ICON_SIZE_COMPACT,
    height: ICON_SIZE_COMPACT,
    borderRadius: Radius.lg,
  },
  iconEmoji: {
    fontSize: 34,
    lineHeight: 38,   // slightly above fontSize to centre the glyph
  },
  iconEmojiCompact: {
    fontSize: 22,
    lineHeight: 26,
  },

  appName: {
    marginTop: Spacing.two,
  },
  appNameCompact: {
    fontSize: FontSize.xl,
    marginTop: Spacing.one,
  },
  tagline: {
    paddingHorizontal: Spacing.nine,
  },
  taglineCompact: {
    fontSize: FontSize.xs,
    paddingHorizontal: Spacing.four,
  },
});
