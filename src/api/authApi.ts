import axios from "axios";
import * as storage from "@/utils/secureStorage";

import { SECURE_STORE_KEYS, apiClient } from "./apiClient";


// ─── Types ────────────────────────────────────────────────────────────────

// ─── Types ────────────────────────────────────────────────────────────────

/**
 * Backend returns Title Case roles (e.g. "Inspector", "Passenger").
 * We normalise to lowercase internally so all comparisons are consistent.
 */
export type UserRole = 'passenger' | 'inspector' | 'manager' | 'admin';

/** Raw role string as the backend may return it (Title Case or lower). */
type RawRole = string;

/** Normalise any backend role string to lowercase UserRole. */
function normaliseRole(raw: RawRole): UserRole {
    return raw.toLowerCase() as UserRole;
}

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

/** Persist auth session in SecureStore (native) / localStorage (web) after login / register. */
export async function saveSession(session: AuthSession): Promise<void> {
    await storage.setItem(SECURE_STORE_KEYS.ACCESS_TOKEN, session.accessToken);
    await storage.setItem(SECURE_STORE_KEYS.REFRESH_TOKEN, session.refreshToken);
    await storage.setItem(SECURE_STORE_KEYS.USER, JSON.stringify(session.user));
}

/** Read persisted session (returns null if none). */
export async function readSession(): Promise<AuthSession | null> {
    const [accessToken, refreshToken, userJson] = await Promise.all([
        storage.getItem(SECURE_STORE_KEYS.ACCESS_TOKEN),
        storage.getItem(SECURE_STORE_KEYS.REFRESH_TOKEN),
        storage.getItem(SECURE_STORE_KEYS.USER),
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
    await storage.deleteItem(SECURE_STORE_KEYS.ACCESS_TOKEN);
    await storage.deleteItem(SECURE_STORE_KEYS.REFRESH_TOKEN);
    await storage.deleteItem(SECURE_STORE_KEYS.USER);
}

// ─── API calls ────────────────────────────────────────────────────────────


/**
 * POST /api/auth/login
 * Normalises the role to lowercase (backend sends Title Case, e.g. "Inspector").
 * Sets Authorization on apiClient.defaults immediately so every subsequent
 * request in this session is authenticated without waiting for SecureStore reads.
 */
export async function login(payload: LoginPayload): Promise<AuthSession> {
    const { data } = await apiClient.post<{
        success: boolean;
        accessToken: string;
        refreshToken: string;
        user: { id: number; email: string; role: string };
    }>('/auth/login', payload);

    // ── Set header immediately — backend requires: Authorization: Bearer <token>
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;

    return {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: {
            id: data.user.id,
            email: data.user.email,
            role: normaliseRole(data.user.role),   // "Inspector" → "inspector"
        },
    };
}

/**
 * POST /api/auth/register
 * Only used for passenger self-registration.
 * Employee accounts are created by managers via the web portal.
 */
export async function register(payload: RegisterPayload): Promise<AuthSession> {
    const { data } = await apiClient.post<{
        success: boolean;
        accessToken: string;
        refreshToken: string;
        user: { id: number; email: string; role: string };
    }>('/auth/register', payload);

    // ── Set header immediately after registration
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;

    return {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: {
            id: data.user.id,
            email: data.user.email,
            role: normaliseRole(data.user.role),
        },
    };
}


/**
 * POST /api/auth/logout
 * Clears the refresh token on the server and removes the in-memory header.
 * Server-side errors (e.g. 401 if the token is already expired) are intentionally
 * swallowed — the local session is always cleared regardless.
 */
export async function logout(): Promise<void> {
    try {
        await apiClient.post('/auth/logout');
    } catch {
        // Token may already be expired or invalid on the server — that's fine.
        // We still wipe the local session below.
    } finally {
        await clearSession();
        delete apiClient.defaults.headers.common['Authorization'];
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
