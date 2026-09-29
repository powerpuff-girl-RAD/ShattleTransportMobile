import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/store/authStore';

/**
 * Auth gate — the first screen Expo Router renders.
 *
 * Decision tree:
 *   isLoading          → show a full-screen spinner (auth state not yet read)
 *   user === null      → /onboarding  (not authenticated)
 *   role === passenger → /passenger   (passenger dashboard)
 *   role === inspector → /inspector   (inspector dashboard)
 *   any other role     → /onboarding  (managers/admins use the web portal)
 */
export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!user) return <Redirect href="/onboarding" />;
  if (user.role === 'passenger') return <Redirect href="/passenger" />;
  if (user.role === 'inspector') return <Redirect href="/inspector" />;

  // Managers / admins should use the web portal — send back to onboarding
  return <Redirect href="/onboarding" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: Colors.gradientTop,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
