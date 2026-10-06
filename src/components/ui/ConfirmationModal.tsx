import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/constants/theme';
import { Text } from './Text';

export interface ConfirmationModalProps {
  visible: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmationModal({
  visible,
  title = 'Sign Out',
  message = 'Are you sure you want to sign out of your account?',
  confirmLabel = 'Yes',
  cancelLabel = 'No',
  isDestructive = true,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={isLoading ? undefined : onCancel} />

        <View style={styles.card}>
          {/* Icon Badge */}
          <View style={[styles.iconBadge, isDestructive ? styles.iconBadgeDestructive : styles.iconBadgeDefault]}>
            <Text style={styles.iconEmoji}>{isDestructive ? '🚪' : 'ℹ️'}</Text>
          </View>

          {/* Title & Message */}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            {/* Cancel (No) Button */}
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.cancelButton,
                pressed && styles.cancelButtonPressed,
              ]}
              onPress={onCancel}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
            >
              <Text style={styles.cancelButtonText}>{cancelLabel}</Text>
            </Pressable>

            {/* Confirm (Yes) Button */}
            <Pressable
              style={({ pressed }) => [
                styles.button,
                isDestructive ? styles.confirmDestructiveButton : styles.confirmDefaultButton,
                pressed && !isLoading && styles.confirmButtonPressed,
                isLoading && styles.buttonDisabled,
              ]}
              onPress={onConfirm}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.confirmButtonText}>{confirmLabel}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.six,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.white,
    borderRadius: Radius['2xl'],
    paddingHorizontal: Spacing.six,
    paddingTop: Spacing.seven,
    paddingBottom: Spacing.six,
    alignItems: 'center',
    ...Shadow.lg,
  },
  iconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.four,
  },
  iconBadgeDestructive: {
    backgroundColor: '#FEE2E2', // light red
  },
  iconBadgeDefault: {
    backgroundColor: '#E0F2FE', // light blue
  },
  iconEmoji: {
    fontSize: FontSize['2xl'],
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textDark,
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
  message: {
    fontSize: FontSize.sm,
    color: Colors.textDarkSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.six,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    width: '100%',
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.inputLightBorder,
  },
  cancelButtonPressed: {
    backgroundColor: '#E2E8F0',
  },
  cancelButtonText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textDark,
  },
  confirmDestructiveButton: {
    backgroundColor: Colors.error,
  },
  confirmDefaultButton: {
    backgroundColor: Colors.orange,
  },
  confirmButtonPressed: {
    opacity: 0.85,
  },
  confirmButtonText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});