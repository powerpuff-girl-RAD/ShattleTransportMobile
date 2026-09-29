import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { BrandLogo } from '@/components/BrandLogo';
import { DotPaginator } from '@/components/DotPaginator';
import { Button, Screen } from '@/components/ui';
import { Layout, Spacing } from '@/constants/theme';

/**
 * Role Selection screen — slide 3 of 3.
 *
 * "Continue as Passenger" → login screen (handles both passenger & inspector
 *   roles; the dashboard redirect is based on the API response role).
 * "Continue as Visitor"   → visitor stub (future implementation).
 * "Continue without an account" → guest mode stub.
 */
export default function RoleSelect() {
  const router = useRouter();

  return (
    <Screen>
      <View style={styles.container}>
        {/* ── Hero ──────────────────────────────────────────────────── */}
        <View style={styles.hero}>
          <BrandLogo />
        </View>

        {/* ── Actions + dots ────────────────────────────────────────── */}
        <View style={styles.bottom}>
          <View style={styles.buttons}>
            <Button
              variant="primary"
              label="Continue as Passenger"
              onPress={() => router.push('/login')}
            />
            <Button
              variant="outline"
              label="Continue as Visitor"
              onPress={() => {
                // TODO: implement visitor / temporary pass flow
                router.push('/login');
              }}
            />
            <Button
              variant="ghost"
              label="Continue without an account"
              onPress={() => {
                // TODO: implement guest browse mode
                router.push('/login');
              }}
            />
          </View>

          <DotPaginator total={3} current={2} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
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
    gap: Spacing.six,
  },
  buttons: {
    gap: Spacing.three,
  },
});
