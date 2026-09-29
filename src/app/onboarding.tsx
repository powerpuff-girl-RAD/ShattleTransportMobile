import { useRouter } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { BrandLogo } from '@/components/BrandLogo';
import { DotPaginator } from '@/components/DotPaginator';
import { Screen, Text } from '@/components/ui';
import { Layout, Spacing } from '@/constants/theme';

/**
 * Onboarding screen — slide 1 of 3.
 * Displays the brand hero. Tapping anywhere advances to role selection.
 */
export default function Onboarding() {
  const router = useRouter();

  return (
    <Screen>
      <TouchableOpacity
        style={styles.touchArea}
        activeOpacity={1}
        onPress={() => router.push('/role-select')}
        accessibilityLabel="Tap to continue"
      >
        {/* ── Hero area ─────────────────────────────────────────────── */}
        <View style={styles.hero}>
          <BrandLogo />
        </View>

        {/* ── Bottom area: dots ─────────────────────────────────────── */}
        <View style={styles.bottom}>
          <Text variant="caption" style={styles.hint}>
            Tap anywhere to continue
          </Text>
          <DotPaginator total={3} current={0} />
        </View>
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  touchArea: {
    flex: 1,
    paddingHorizontal: Layout.screenPaddingH,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: {
    paddingBottom: Spacing.ten,
    alignItems: 'center',
    gap: Spacing.four,
  },
  hint: {
    opacity: 0.5,
  },
});
