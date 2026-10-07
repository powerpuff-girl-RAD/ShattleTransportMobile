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
import {
    getActiveJourney as apiGetActiveJourney,
    boardJourney as apiBoardJourney,
    alightJourney as apiAlightJourney,
    getNotifications as apiGetNotifications,
} from '@/api/journeyApi';
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
import type {
    Journey,
    BoardingPayload,
    BoardingResult,
    AlightingPayload,
    AlightingResult,
    NotificationItem,
} from '@/api/journeyApi';

// ─── State ────────────────────────────────────────────────────────────────

interface PassengerState {
    profile: PassengerProfileData | null;
    token: DigitalToken | null;
    qr: QRGenerationResult | null;
    activeJourney: Journey | null;
    notifications: NotificationItem[];
    isLoading: boolean;
    tokenLoading: boolean;
    journeyLoading: boolean;
    error: string | null;
}

const initialState: PassengerState = {
    profile: null,
    token: null,
    qr: null,
    activeJourney: null,
    notifications: [],
    isLoading: false,
    tokenLoading: false,
    journeyLoading: false,
    error: null,
};

type Action =
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_TOKEN_LOADING'; payload: boolean }
    | { type: 'SET_JOURNEY_LOADING'; payload: boolean }
    | { type: 'SET_PROFILE'; payload: PassengerProfileData }
    | { type: 'SET_BALANCE'; payload: number }
    | { type: 'SET_TOKEN'; payload: DigitalToken | null }
    | { type: 'SET_QR'; payload: QRGenerationResult | null }
    | { type: 'SET_ACTIVE_JOURNEY'; payload: Journey | null }
    | { type: 'SET_NOTIFICATIONS'; payload: NotificationItem[] }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'CLEAR' };

function reducer(state: PassengerState, action: Action): PassengerState {
    switch (action.type) {
        case 'SET_LOADING': return { ...state, isLoading: action.payload, error: null };
        case 'SET_TOKEN_LOADING': return { ...state, tokenLoading: action.payload };
        case 'SET_JOURNEY_LOADING': return { ...state, journeyLoading: action.payload };
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
        case 'SET_ACTIVE_JOURNEY': return { ...state, activeJourney: action.payload, journeyLoading: false };
        case 'SET_NOTIFICATIONS': return { ...state, notifications: action.payload };
        case 'SET_ERROR': return { ...state, error: action.payload, isLoading: false, tokenLoading: false, journeyLoading: false };
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
    loadActiveJourney: () => Promise<void>;
    boardJourney: (payload: BoardingPayload) => Promise<BoardingResult>;
    alightJourney: (payload: AlightingPayload) => Promise<AlightingResult>;
    loadNotifications: () => Promise<void>;
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

    /** Change password. */
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

    /** Load active token. */
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

    /** Activate token. */
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

    /** Refresh QR JWT token. */
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

    /** Deactivate token. */
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

    /** Load currently active journey */
    const loadActiveJourney = useCallback(async () => {
        dispatch({ type: 'SET_JOURNEY_LOADING', payload: true });
        try {
            const active = await apiGetActiveJourney();
            dispatch({ type: 'SET_ACTIVE_JOURNEY', payload: active });
        } catch {
            dispatch({ type: 'SET_JOURNEY_LOADING', payload: false });
        }
    }, []);

    /** Board journey (tap in) */
    const boardJourney = useCallback(async (payload: BoardingPayload): Promise<BoardingResult> => {
        dispatch({ type: 'SET_JOURNEY_LOADING', payload: true });
        try {
            const result = await apiBoardJourney(payload);
            if (result.status === 'Accepted' && result.journey) {
                dispatch({ type: 'SET_ACTIVE_JOURNEY', payload: result.journey });
            }
            dispatch({ type: 'SET_JOURNEY_LOADING', payload: false });
            return result;
        } catch (err: any) {
            const resData = err?.response?.data;
            dispatch({ type: 'SET_JOURNEY_LOADING', payload: false });
            if (resData && resData.status === 'Rejected') {
                return resData as BoardingResult;
            }
            throw err;
        }
    }, []);

    /** Alight journey (tap out) */
    const alightJourney = useCallback(async (payload: AlightingPayload): Promise<AlightingResult> => {
        dispatch({ type: 'SET_JOURNEY_LOADING', payload: true });
        try {
            const result = await apiAlightJourney(payload);
            dispatch({ type: 'SET_ACTIVE_JOURNEY', payload: null });
            dispatch({ type: 'SET_BALANCE', payload: result.newBalance });
            dispatch({ type: 'SET_JOURNEY_LOADING', payload: false });
            return result;
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Failed to complete journey tap-out';
            dispatch({ type: 'SET_ERROR', payload: msg });
            throw err;
        }
    }, []);

    /** Load notifications */
    const loadNotifications = useCallback(async () => {
        try {
            const list = await apiGetNotifications();
            dispatch({ type: 'SET_NOTIFICATIONS', payload: list });
        } catch {
            // ignore
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
            loadActiveJourney,
            boardJourney,
            alightJourney,
            loadNotifications,
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