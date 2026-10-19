import { apiClient } from './apiClient';

// ─── Types ────────────────────────────────────────────────────────────────

export type TokenType = 'QR' | 'Smartcard' | 'Barcode';
export type TokenStatus = 'Active' | 'Blocked' | 'Expired' | 'Deactivated';

export interface DigitalToken {
    id: number;
    serial: string;
    type: TokenType;
    status: TokenStatus;
    activatedAt: string;
    expiresAt: string | null;
    lastUsedAt: string | null;
}

export interface QRGenerationResult {
    qrPayload: string;   // short-lived signed JWT — encode this in the QR image
    tokenSerial: string;
    tokenId: number;
    expiresIn: number;   // seconds until the QR JWT expires (300 = 5 min)
}

export interface ActivateTokenPayload {
    tokenSerial: string;
    tokenType?: TokenType;
}

// ─── Token API ────────────────────────────────────────────────────────────

/** Activates (links) a token serial to the authenticated passenger's account. */
export async function activateToken(payload: ActivateTokenPayload): Promise<{ message: string; token: DigitalToken }> {
    const res = await apiClient.post<{
        success: boolean;
        message: string;
        token: DigitalToken;
    }>('/passenger/token/activate', payload);
    return { message: res.data.message, token: res.data.token };
}

/** Retrieves the passenger's current active token. */
export async function getActiveToken(): Promise<DigitalToken> {
    const res = await apiClient.get<{ success: boolean; token: DigitalToken }>(
        '/passenger/token'
    );
    return res.data.token;
}

/**
 * Requests a fresh short-lived QR JWT from the backend.
 * The returned `qrPayload` string should be encoded into the QR image.
 * Expires in 5 minutes — call again to refresh.
 */
export async function generateQR(): Promise<QRGenerationResult> {
    const res = await apiClient.get<QRGenerationResult & { success: boolean }>(
        '/passenger/token/qr'
    );
    const { qrPayload, tokenSerial, tokenId, expiresIn } = res.data;
    return { qrPayload, tokenSerial, tokenId, expiresIn };
}

/** Deactivates (unlinks) the specified token from the passenger's account. */
export async function deactivateToken(tokenSerial: string): Promise<void> {
    await apiClient.delete(`/passenger/token/${tokenSerial}`);
}

