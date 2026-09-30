import { apiClient } from './apiClient';

// ─── Types ────────────────────────────────────────────────────────────────

export interface PassengerAccount {
    id: number;
    balance: number;
    currency: string;
    status: string;
}

export interface PassengerProfileData {
    userId: number;
    email: string;
    fullName: string | null;
    role: string;
    memberSince: string;
    phone: string | null;
    address: string | null;
    dateOfBirth: string | null;
    nic: string | null;
    avatarUrl: string | null;
    account: PassengerAccount;
}

export interface UpdateProfilePayload {
    fullName?: string;
    phone?: string;
    address?: string;
    dateOfBirth?: string;
    nic?: string;
}

// ─── Profile API ──────────────────────────────────────────────────────────

/** Fetches the authenticated passenger's full profile including account balance. */
export async function getMyProfile(): Promise<PassengerProfileData> {
    const res = await apiClient.get<{ success: boolean; profile: PassengerProfileData }>(
        '/passenger/profile'
    );
    return res.data.profile;
}

/** Updates the passenger's personal information. Returns the updated profile. */
export async function updateMyProfile(payload: UpdateProfilePayload): Promise<PassengerProfileData> {
    const res = await apiClient.put<{ success: boolean; profile: PassengerProfileData }>(
        '/passenger/profile',
        payload
    );
    return res.data.profile;
}

/** Changes the authenticated passenger's password. */
export async function changePassword(
    currentPassword: string,
    newPassword: string
): Promise<void> {
    await apiClient.put('/passenger/password', { currentPassword, newPassword });
}

