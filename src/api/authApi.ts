import * as SecureStore from "expo-secure-store";
import axios from "axios";

import { SECURE_STORE_KEYS, apiClient } from "./apiClient";

// ─── Types ────────────────────────────────────────────────────────────────

export type UserRole = "passenger" | "inspector" | "manager" | "admin";

export interface AuthUser {
    id: number;
    email: string;
    role: UserRole;
}

export interface AuthSession {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
}

export interface LoginPayload {
    email: string;
    password: string;
}

export interface RegisterPayload {
    email: string;
    password: string;
    fullName?: string;
    role?: UserRole;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Persist auth session in SecureStore after login / register. */
export async function saveSession(session: AuthSession): Promise<void> {
    await SecureStore.setItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN, session.accessToken);
    await SecureStore.setItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN, session.refreshToken);
    await SecureStore.setItemAsync(SECURE_STORE_KEYS.USER, JSON.stringify(session.user));
}

/** Read persisted session from SecureStore (returns null if none). */
export async function readSession(): Promise<AuthSession | null> {
    const [accessToken, refreshToken, userJson] = await Promise.all([
        SecureStore.getItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN),
        SecureStore.getItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN),
        SecureStore.getItemAsync(SECURE_STORE_KEYS.USER),
    ]);
    if (!accessToken || !refreshToken || !userJson) return null;
    try {
        const user: AuthUser = JSON.parse(userJson);
        return { accessToken, refreshToken, user };
    } catch {
        return null;
    }
}

/** Remove all stored auth data (logout). */
export async function clearSession(): Promise<void> {
    await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN);
    await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.USER);
}

// ─── API calls ────────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 * Returns tokens + user. Call saveSession() after a successful login.
 */
export async function login(payload: LoginPayload): Promise<AuthSession> {
    const { data } = await apiClient.post<AuthSession & { success: boolean }>(
        "/auth/login",
        payload,
    );
    return {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
    };
}

/**
 * POST /api/auth/register
 * Only used for passenger self-registration.
 * Employee accounts are created by managers via the web portal.
 */
export async function register(payload: RegisterPayload): Promise<AuthSession> {
    const { data } = await apiClient.post<AuthSession & { success: boolean }>(
        "/auth/register",
        payload,
    );
    return {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
    };
}

/**
 * POST /api/auth/logout
 * Clears the refresh token on the server. Always call clearSession() afterwards.
 */
export async function logout(): Promise<void> {
    try {
        await apiClient.post("/auth/logout");
    } finally {
        await clearSession();
    }
}

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's profile.
 */
export async function getMe(): Promise<AuthUser> {
    const { data } = await apiClient.get<{ success: boolean; user: AuthUser }>("/auth/me");
    return data.user;
}

/**
 * POST /api/auth/refresh  (raw — called by the interceptor in apiClient.ts)
 * You generally don't call this directly; the apiClient interceptor handles it.
 */
export async function refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
    const { data } = await axios.post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken });
    return { accessToken: data.accessToken, refreshToken: data.refreshToken };
}
