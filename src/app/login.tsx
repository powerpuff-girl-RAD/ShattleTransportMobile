import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { BrandLogo } from '@/components/BrandLogo';
import { Button, Input, Screen, Text } from '@/components/ui';
import { Layout, Spacing } from '@/constants/theme';
import { useAuth } from '@/store/authStore';
import { getErrorMessage } from '@/utils/api';

/**
 * Login screen
 *
 * Accepts any registered account (passenger OR inspector).
 * After a successful login the auth gate in index.tsx handles the redirect:
 *   role === 'passenger' → /passenger
 *   role === 'inspector' → /inspector
 *
 * The login form itself is role-agnostic; the API response determines the
 * destination — no duplicate redirect logic needed here.
 */
export default function Login() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Field-level validation ────────────────────────────────────────────
  const [emailErr, setEmailErr] = useState('');
  const [passwordErr, setPasswordErr] = useState('');

  function validate(): boolean {
    let valid = true;
    if (!email.trim()) {
      setEmailErr('Email address is required.');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailErr('Enter a valid email address.');
      valid = false;
    } else {
      setEmailErr('');
    }

    if (!password) {
      setPasswordErr('Password is required.');
      valid = false;
    } else if (password.length < 6) {
      setPasswordErr('Password must be at least 6 characters.');
      valid = false;
    } else {
      setPasswordErr('');
    }

    return valid;
  }

  // ── Submit handler ────────────────────────────────────────────────────
  async function handleLogin() {
    setError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
      // signIn updates the auth context → index.tsx Redirect fires automatically
      router.replace('/');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Brand ───────────────────────────────────────────────── */}
          <View style={styles.hero}>
            <BrandLogo hideSubtitle />
            <Text variant="subtitle" style={styles.welcomeText}>
              Welcome back. Sign in to continue.
            </Text>
          </View>

          {/* ── Form ────────────────────────────────────────────────── */}
          <View style={styles.form}>
            <Input
              label="Email address"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              returnKeyType="next"
              value={email}
              onChangeText={(v) => { setEmail(v); setEmailErr(''); setError(''); }}
              error={emailErr}
            />

            <Input
              label="Password"
              placeholder="••••••••"
              secureTextEntry
              autoComplete="password"
              returnKeyType="done"
              value={password}
              onChangeText={(v) => { setPassword(v); setPasswordErr(''); setError(''); }}
              onSubmitEditing={handleLogin}
              error={passwordErr}
            />

            {/* API-level error (wrong credentials, network, etc.) */}
            {error ? (
              <Text variant="caption" color="#E53935" style={styles.apiError}>
                {error}
              </Text>
            ) : null}

            <Button
              variant="primary"
              label="Sign In"
              loading={loading}
              onPress={handleLogin}
              style={styles.signInButton}
            />

            <Button
              variant="ghost"
              label="← Back to start"
              onPress={() => router.replace('/onboarding')}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Layout.screenPaddingH,
    paddingBottom: Spacing.ten,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.ten,
    paddingBottom: Spacing.eight,
    gap: Spacing.three,
  },
  welcomeText: {
    marginTop: Spacing.two,
  },
  form: {
    gap: Spacing.four,
  },
  apiError: {
    textAlign: 'center',
  },
  signInButton: {
    marginTop: Spacing.two,
  },
});
