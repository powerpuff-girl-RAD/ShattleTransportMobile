import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';

import { apiClient } from '@/api/apiClient';
import { useAuth } from '@/store/authStore';

/** True when the shared apiClient could not refresh the access token. */
function isSessionExpired(error: any): boolean {
    return Boolean(error?.config?.url?.includes('/auth/refresh')) || error?.message === 'No refresh token stored';
}

/**
 * Sends the inspector back to Login when their session can't be renewed
 * (refresh token expired after 7 days, or replaced by a login on another device).
 * Without this, apiClient clears the stored tokens but every screen just keeps
 * showing "Failed to load…".
 */
export function useSessionGuard() {
    const { signOut } = useAuth();
    const handling = useRef(false);

    useEffect(() => {
        // Runs after apiClient's own refresh interceptor, so it sees the final error
        const id = apiClient.interceptors.response.use(undefined, async (error) => {
            if (isSessionExpired(error) && !handling.current) {
                handling.current = true;
                await signOut();
                Alert.alert('Session expired', 'Please log in again.');
                router.replace('/login');
                // No reset: other requests waiting on the same refresh fail too, and the
                // layout unmounts on Login, so the next sign-in starts with a fresh guard
            }
            return Promise.reject(error);
        });
        return () => apiClient.interceptors.response.eject(id);
    }, [signOut]);
}
