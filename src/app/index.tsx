import { Redirect, router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/store/authStore';

/**
 * Auth gate — the first screen Expo Router renders.
 *
 * Decision tree (on initial load):
 *   isLoading          → full-screen spinner (auth state not yet read)
 *   user === null      → /onboarding  (not authenticated)
 *   role === passenger → /passenger   (passenger dashboard)
 *   role === inspector → /inspector   (inspector dashboard)
 *   any other role     → /onboarding  (managers/admins use the web portal)
 *
 * Mid-session logout:
 *   The useEffect watches `user` and navigates to /onboarding whenever
 *   it becomes null after the initial load has completed (i.e. after signOut).
 */
export default function Index() {
  const { user, isLoading } = useAuth();

  // ── Redirect on logout (mid-session) ────────────────────────────────────
  useEffect(() => {
    // Only act after the initial session check has finished
    if (!isLoading && !user) {
      router.replace('/onboarding');
    }
  }, [user, isLoading]);

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
