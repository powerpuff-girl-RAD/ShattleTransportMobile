import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AuthProvider } from '@/store/authStore';

// Keep the native splash visible until the auth state has loaded
SplashScreen.preventAutoHideAsync();

/**
 * Root layout — wraps the entire app in the AuthProvider and
 * configures a header-less Stack navigator.
 *
 * The actual "where do I go on launch?" logic lives in src/app/index.tsx.
 */
export default function RootLayout() {
  useEffect(() => {
    // AuthProvider reads SecureStore asynchronously. Once the JS bundle is
    // ready the splash can safely hide; loading states in index.tsx handle
    // any remaining async work.
    SplashScreen.hideAsync();
  }, []);

  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
    </AuthProvider>
  );
}
