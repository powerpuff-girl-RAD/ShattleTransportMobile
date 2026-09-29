import { StyleSheet, View } from 'react-native';

import { Button, Screen, Text } from '@/components/ui';
import { Colors, FontSize, Spacing } from '@/constants/theme';
import { useAuth } from '@/store/authStore';

/**
 * Inspector Dashboard (home screen after inspector login).
 * Placeholder — ticket validation and scan features will be built next.
 */
export default function InspectorDashboard() {
  const { user, signOut } = useAuth();

  return (
    <Screen>
      <View style={styles.container}>
        {/* ── Header ─────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text variant="caption">Logged in as Inspector,</Text>
          <Text variant="heading">{user?.email ?? 'Inspector'}</Text>
        </View>

        {/* ── Role badge ─────────────────────────────────────────── */}
        <View style={styles.badge}>
          <Text style={styles.badgeEmoji}>🔍</Text>
          <Text variant="heading">Inspector Dashboard</Text>
          <Text variant="subtitle">
            Ticket validation, scan history, and shift schedule will appear here.
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
