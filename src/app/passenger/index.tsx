import { StyleSheet, View } from 'react-native';

import { Button, Screen, Text } from '@/components/ui';
import { Colors, FontSize, Spacing } from '@/constants/theme';
import { useAuth } from '@/store/authStore';

/**
 * Passenger Dashboard (home screen after passenger login).
 * This is a placeholder — journey features will be built in the next sprint.
 */
export default function PassengerDashboard() {
  const { user, signOut } = useAuth();

  return (
    <Screen>
      <View style={styles.container}>
        {/* ── Header ─────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text variant="caption">Welcome back,</Text>
          <Text variant="heading">{user?.email ?? 'Passenger'}</Text>
        </View>

        {/* ── Role badge ─────────────────────────────────────────── */}
        <View style={styles.badge}>
          <Text style={styles.badgeEmoji}>🎫</Text>
          <Text variant="heading">Passenger Dashboard</Text>
          <Text variant="subtitle">
            Journey history, balance top-up, and QR ticket will appear here.
          </Text>
        </View>

        {/* ── Sign out ───────────────────────────────────────────── */}
        <Button variant="outline" label="Sign Out" onPress={signOut} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.six,
    gap: Spacing.six,
  },
  header: {
    paddingTop: Spacing.four,
    gap: Spacing.one,
  },
  badge: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
  },
  badgeEmoji: {
    fontSize: FontSize['3xl'],
    color: Colors.textPrimary,
  },
});
