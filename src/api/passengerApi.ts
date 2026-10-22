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

export interface TopUpPayload {
    amount: number;
    paymentMethod?: 'Debit Card' | 'Credit Card';
    cardNumber: string;
    expiry?: string;
    cvv?: string;
    cardholderName?: string;
}

export interface TopUpTransaction {
    id: number;
    transactionRef: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    cardLast4?: string;
    cardType?: string;
    cardholderName?: string;
    status: string;
    createdAt: string;
}

export interface TopUpResponse {
    success: boolean;
    message: string;
    transaction: TopUpTransaction;
    previousBalance: number;
    newBalance: number;
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

// ─── Top-Up API ───────────────────────────────────────────────────────────

/** Submits a top-up transaction via card payment gateway. */
export async function topUpAccount(payload: TopUpPayload): Promise<TopUpResponse> {
    const res = await apiClient.post<TopUpResponse>(
        '/passenger/topup',
        payload
    );
    return res.data;
}

/** Retrieves top-up history. */
export async function getTopUpHistory(limit: number = 20): Promise<TopUpTransaction[]> {
    const res = await apiClient.get<{ success: boolean; history: TopUpTransaction[] }>(
        `/passenger/topup/history?limit=${limit}`
    );
    return res.data.history;
}

/** Retrieves single transaction receipt. */
export async function getTopUpReceipt(ref: string): Promise<TopUpTransaction & { currentBalance: number }> {
    const res = await apiClient.get<{ success: boolean; receipt: TopUpTransaction & { currentBalance: number } }>(
        `/passenger/topup/${ref}`
    );
    return res.data.receipt;
}