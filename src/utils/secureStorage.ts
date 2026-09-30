/**
 * secureStorage.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Platform-aware key-value storage abstraction.
 *
 *  • Native (iOS / Android) → expo-secure-store  (encrypted hardware keychain)
 *  • Web                    → localStorage        (best available in browser)
 *
 * All call-sites use this module instead of calling SecureStore directly so
 * that the app runs on every platform without crashing.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/** Store a string value under the given key. */
export async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

/** Retrieve a string value, or null if it does not exist. */
export async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

/** Remove a stored value. */
export async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}
