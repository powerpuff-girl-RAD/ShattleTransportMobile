import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useReducer,
} from 'react';

import {
    getMyProfile,
    updateMyProfile,
    changePassword as apiChangePassword,
    topUpAccount as apiTopUpAccount,
} from '@/api/passengerApi';
import {
    getActiveToken,
    activateToken as apiActivateToken,
    generateQR,
    deactivateToken as apiDeactivateToken,
} from '@/api/tokenApi';
import type {
    PassengerProfileData,
    UpdateProfilePayload,
    TopUpPayload,
    TopUpResponse,
} from '@/api/passengerApi';
import type {
    DigitalToken,
    QRGenerationResult,
    ActivateTokenPayload,
} from '@/api/tokenApi';

// ─── State ────────────────────────────────────────────────────────────────

interface PassengerState {
    profile: PassengerProfileData | null;
    token: DigitalToken | null;
    qr: QRGenerationResult | null;
    isLoading: boolean;
    tokenLoading: boolean;
    error: string | null;
}

const initialState: PassengerState = {
    profile: null,
    token: null,
    qr: null,
    isLoading: false,
    tokenLoading: false,
    error: null,
};

type Action =
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_TOKEN_LOADING'; payload: boolean }
    | { type: 'SET_PROFILE'; payload: PassengerProfileData }
    | { type: 'SET_BALANCE'; payload: number }
    | { type: 'SET_TOKEN'; payload: DigitalToken | null }
    | { type: 'SET_QR'; payload: QRGenerationResult | null }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'CLEAR' };

function reducer(state: PassengerState, action: Action): PassengerState {
    switch (action.type) {
        case 'SET_LOADING': return { ...state, isLoading: action.payload, error: null };
        case 'SET_TOKEN_LOADING': return { ...state, tokenLoading: action.payload };
        case 'SET_PROFILE': return { ...state, profile: action.payload, isLoading: false };
        case 'SET_BALANCE':
            if (!state.profile) return state;
            return {
                ...state,
                profile: {
                    ...state.profile,
                    account: {
                        ...state.profile.account,
                        balance: action.payload,
                    },
                },
            };
        case 'SET_TOKEN': return { ...state, token: action.payload, tokenLoading: false };
        case 'SET_QR': return { ...state, qr: action.payload, tokenLoading: false };
        case 'SET_ERROR': return { ...state, error: action.payload, isLoading: false, tokenLoading: false };
        case 'CLEAR': return initialState;
        default: return state;
    }
}

// ─── Context ──────────────────────────────────────────────────────────────

interface PassengerContextValue extends PassengerState {
    loadProfile: () => Promise<void>;
    updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
    changePassword: (current: string, next: string) => Promise<void>;
    loadToken: () => Promise<void>;
    activateToken: (payload: ActivateTokenPayload) => Promise<string>;
    refreshQR: () => Promise<void>;
    deactivateToken: () => Promise<void>;
    topUpWallet: (payload: TopUpPayload) => Promise<TopUpResponse>;
    clearError: () => void;
}

const PassengerContext = createContext<PassengerContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────

export function PassengerProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState);

    /** Load profile + balance from backend. */
    const loadProfile = useCallback(async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const profile = await getMyProfile();
            dispatch({ type: 'SET_PROFILE', payload: profile });
        } catch {
            dispatch({ type: 'SET_ERROR', payload: 'Failed to load profile' });
        }
    }, []);

    /** Update personal info. */
    const updateProfile = useCallback(async (payload: UpdateProfilePayload) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const updated = await updateMyProfile(payload);
            dispatch({ type: 'SET_PROFILE', payload: updated });
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Profile update failed';
            dispatch({ type: 'SET_ERROR', payload: msg });
            throw err;
        }
    }, []);

    /** Change password — throws on failure so the screen can show the error. */
    const changePassword = useCallback(async (current: string, next: string) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            await apiChangePassword(current, next);
            dispatch({ type: 'SET_LOADING', payload: false });
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Password change failed';
            dispatch({ type: 'SET_ERROR', payload: msg });
            throw err;
        }
    }, []);

    /** Load the passenger's active token. */
    const loadToken = useCallback(async () => {
        dispatch({ type: 'SET_TOKEN_LOADING', payload: true });
        try {
            const token = await getActiveToken();
            dispatch({ type: 'SET_TOKEN', payload: token });
        } catch (err: any) {
            if (err?.response?.status === 404) {
                dispatch({ type: 'SET_TOKEN', payload: null });
            } else {
                dispatch({ type: 'SET_ERROR', payload: 'Failed to load token' });
            }
        }
    }, []);

    /** Activate (link) a new token serial. Returns the success message. */
    const activateToken = useCallback(async (payload: ActivateTokenPayload): Promise<string> => {
        dispatch({ type: 'SET_TOKEN_LOADING', payload: true });
        try {
            const result = await apiActivateToken(payload);
            dispatch({ type: 'SET_TOKEN', payload: result.token });
            return result.message;
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Token activation failed';
            dispatch({ type: 'SET_ERROR', payload: msg });
            throw err;
        }
    }, []);

    /** Fetch a fresh QR JWT from the backend (called on mount and on "Refresh" tap). */
    const refreshQR = useCallback(async () => {
        dispatch({ type: 'SET_TOKEN_LOADING', payload: true });
        try {
            const qr = await generateQR();
            dispatch({ type: 'SET_QR', payload: qr });
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Failed to generate QR code';
            dispatch({ type: 'SET_ERROR', payload: msg });
            throw err;
        }
    }, []);

    /** Deactivate the passenger's active token. */
    const deactivateToken = useCallback(async () => {
        if (!state.token) return;
        dispatch({ type: 'SET_TOKEN_LOADING', payload: true });
        try {
            await apiDeactivateToken(state.token.serial);
            dispatch({ type: 'SET_TOKEN', payload: null });
            dispatch({ type: 'SET_QR', payload: null });
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Deactivation failed';
            dispatch({ type: 'SET_ERROR', payload: msg });
            throw err;
        }
    }, [state.token]);

    /** Process Top-Up Payment */
    const topUpWallet = useCallback(async (payload: TopUpPayload): Promise<TopUpResponse> => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const res = await apiTopUpAccount(payload);
            dispatch({ type: 'SET_BALANCE', payload: res.newBalance });
            dispatch({ type: 'SET_LOADING', payload: false });
            return res;
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Top-up transaction failed';
            dispatch({ type: 'SET_ERROR', payload: msg });
            throw err;
        }
    }, []);

    const clearError = useCallback(() => dispatch({ type: 'SET_ERROR', payload: null }), []);

    const value = useMemo<PassengerContextValue>(
        () => ({
            ...state,
            loadProfile,
            updateProfile,
            changePassword,
            loadToken,
            activateToken,
            refreshQR,
            deactivateToken,
            topUpWallet,
            clearError,
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [state]
    );

    return (
        <PassengerContext.Provider value={value}>
            {children}
        </PassengerContext.Provider>
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export function usePassenger(): PassengerContextValue {
    const ctx = useContext(PassengerContext);
    if (!ctx) throw new Error('usePassenger must be used inside <PassengerProvider>');
    return ctx;
}