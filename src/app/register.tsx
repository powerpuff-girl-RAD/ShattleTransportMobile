import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text as RNText,
  View,
} from 'react-native';

import { BrandLogo } from '@/components/BrandLogo';
import { Button, Checkbox, Input, SplitScreen, Text } from '@/components/ui';
import { Colors, FontSize, Layout, Spacing } from '@/constants/theme';
import { useAuth } from '@/store/authStore';
import { getErrorMessage } from '@/utils/api';

// ─── Field-level validation helpers ───────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Sri Lanka NIC: 9 digits + V/X  OR  12 digits; Passport: A-Z + 7 digits
const NIC_RE = /^(\d{9}[VvXx]|\d{12}|[A-Za-z]\d{7})$/;

// ─── Screen ────────────────────────────────────────────────────────────────

/**
 * Passenger Registration Screen
 *
 * Collects: fullName, email, phone, nic, password, confirmPassword, termsAccepted.
 * Calls POST /api/auth/register with { email, password, fullName, role:'passenger' }.
 * Phone and NIC are validated client-side (backend schema extension is a future task).
 * On success the session is persisted and the user is redirected to /passenger.
 */
export default function Register() {
  const router = useRouter();
  const { signUp } = useAuth();

  // ── Form state ──────────────────────────────────────────────────────────
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nic, setNic] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Error state (one per field + API-level) ─────────────────────────────
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  function clearFieldError(field: string) {
    setErrors((prev) => ({ ...prev, [field]: '' }));
    setApiError('');
  }

  // ── Validation ──────────────────────────────────────────────────────────
  function validate(): boolean {
    const next: Record<string, string> = {};

    if (!fullName.trim() || fullName.trim().length < 2) {
      next.fullName = 'Enter your full name (at least 2 characters).';
    }
    if (!email.trim()) {
      next.email = 'Email address is required.';
    } else if (!EMAIL_RE.test(email.trim())) {
      next.email = 'Enter a valid email address.';
    }
    if (!phone.trim()) {
      next.phone = 'Phone number is required.';
    } else if (!/^\+?\d{7,15}$/.test(phone.replace(/\s/g, ''))) {
      next.phone = 'Enter a valid phone number (e.g. +94 77 123 4567).';
    }
    if (!nic.trim()) {
      next.nic = 'NIC or Passport number is required.';
    } else if (!NIC_RE.test(nic.trim())) {
      next.nic = 'Enter a valid NIC (e.g. 200123456789) or Passport (e.g. N1234567).';
    }
    if (!password) {
      next.password = 'Password is required.';
    } else if (password.length < 8) {
      next.password = 'Password must be at least 8 characters.';
    }
    if (!confirmPassword) {
      next.confirmPassword = 'Please confirm your password.';
    } else if (confirmPassword !== password) {
      next.confirmPassword = 'Passwords do not match.';
    }
    if (!termsAccepted) {
      next.terms = 'You must agree to the Terms of Service to continue.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  // ── Submit ──────────────────────────────────────────────────────────────
  async function handleRegister() {
    setApiError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await signUp({
        email: email.trim().toLowerCase(),
        password,
        fullName: fullName.trim(),
        role: 'passenger',
      });
      // signUp → session saved → auth context updated → index.tsx redirects
      router.replace('/');
    } catch (err) {
      setApiError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  // ── Eye-toggle button (reused for both password fields) ─────────────────
  function EyeToggle({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
    return (
      <Pressable onPress={onToggle} hitSlop={8} accessibilityLabel={visible ? 'Hide password' : 'Show password'}>
        <RNText style={styles.eyeIcon}>{visible ? '🙈' : '👁'}</RNText>
      </Pressable>
    );
  }

  // ── Terms label with tappable links ─────────────────────────────────────
  const TermsLabel = (
    <RNText style={styles.termsText}>
      I agree to the{' '}
      <RNText style={styles.termsLink} onPress={() => { /* TODO: open terms */ }}>
        Terms of Service
      </RNText>
      {' & '}
      <RNText style={styles.termsLink} onPress={() => { /* TODO: open privacy policy */ }}>
        Privacy Policy
      </RNText>
    </RNText>
  );

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <SplitScreen
      header={<BrandLogo compact />}
      bodyStyle={styles.bodyPad}
    >
      {/* ── Form title ─────────────────────────────────────────────── */}
      <Text variant="heading" style={styles.formTitle}>
        Create Account
      </Text>

      {/* ── Fields ─────────────────────────────────────────────────── */}
      <View style={styles.fields}>
        <Input
          variant="light"
          label="Full Name"
          placeholder="Nethum Dilchitha"
          autoCapitalize="words"
          autoComplete="name"
          returnKeyType="next"
          value={fullName}
          onChangeText={(v) => { setFullName(v); clearFieldError('fullName'); }}
          error={errors.fullName}
        />

        <Input
          variant="light"
          label="Email Address"
          placeholder="nethum@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          returnKeyType="next"
          value={email}
          onChangeText={(v) => { setEmail(v); clearFieldError('email'); }}
          error={errors.email}
        />

        <Input
          variant="light"
          label="Phone Number"
          placeholder="+94 77 123 4567"
          keyboardType="phone-pad"
          autoComplete="tel"
          returnKeyType="next"
          value={phone}
          onChangeText={(v) => { setPhone(v); clearFieldError('phone'); }}
          error={errors.phone}
        />

        <Input
          variant="light"
          label="NIC / Passport"
          placeholder="200123456789 or N1234567"
          autoCapitalize="characters"
          returnKeyType="next"
          value={nic}
          onChangeText={(v) => { setNic(v); clearFieldError('nic'); }}
          error={errors.nic}
        />

        <Input
          variant="light"
          label="Password"
          placeholder="••••••••"
          secureTextEntry={!showPassword}
          autoComplete="new-password"
          returnKeyType="next"
          value={password}
          onChangeText={(v) => { setPassword(v); clearFieldError('password'); }}
          error={errors.password}
          rightIcon={
            <EyeToggle visible={showPassword} onToggle={() => setShowPassword((p) => !p)} />
          }
        />

        <Input
          variant="light"
          label="Confirm Password"
          placeholder="••••••••"
          secureTextEntry={!showConfirm}
          autoComplete="new-password"
          returnKeyType="done"
          value={confirmPassword}
          onChangeText={(v) => { setConfirmPassword(v); clearFieldError('confirmPassword'); }}
          onSubmitEditing={handleRegister}
          error={errors.confirmPassword}
          rightIcon={
            <EyeToggle visible={showConfirm} onToggle={() => setShowConfirm((p) => !p)} />
          }
        />

        {/* ── Terms checkbox ──────────────────────────────────────── */}
        <Checkbox
          checked={termsAccepted}
          onChange={(v) => { setTermsAccepted(v); clearFieldError('terms'); }}
          label={TermsLabel}
          error={errors.terms}
          containerStyle={styles.terms}
        />

        {/* ── API error ───────────────────────────────────────────── */}
        {apiError ? (
          <Text variant="caption" color={Colors.error} style={styles.apiError}>
            {apiError}
          </Text>
        ) : null}

        {/* ── Submit ──────────────────────────────────────────────── */}
        <Button
          variant="primary"
          label="Register"
          loading={loading}
          onPress={handleRegister}
        />

        {/* ── Login link ──────────────────────────────────────────── */}
        <View style={styles.loginRow}>
          <Text variant="caption" color={Colors.textDarkSecondary}>
            Already have an account?{' '}
          </Text>
          <Pressable onPress={() => router.replace('/login')} hitSlop={6}>
            <Text variant="caption" color={Colors.orange} style={styles.loginLink}>
              Login
            </Text>
          </Pressable>
        </View>
      </View>
    </SplitScreen>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  bodyPad: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing.six,
  },
  formTitle: {
    color: Colors.textDark,
    marginBottom: Spacing.four,
  },
  fields: {
    gap: Spacing.four,
  },
  terms: {
    marginTop: Spacing.two,
  },
  termsText: {
    fontSize: FontSize.sm,
    color: Colors.textDarkSecondary,
    lineHeight: FontSize.sm * 1.55,
    flexShrink: 1,
  },
  termsLink: {
    color: Colors.orange,
    fontWeight: '600',
  },
  apiError: {
    textAlign: 'center',
  },
  eyeIcon: {
    fontSize: 18,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.two,
    paddingBottom: Spacing.four,
  },
  loginLink: {
    fontWeight: '600',
  },
});
