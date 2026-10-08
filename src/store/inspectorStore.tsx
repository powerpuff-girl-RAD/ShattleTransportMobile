import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useReducer,
} from 'react';

import {
    createInspection as apiCreateInspection,
    endShift as apiEndShift,
    getDashboard,
    recordViolation as apiRecordViolation,
    startShift as apiStartShift,
} from '@/api/inspectorApi';
import type {
    Inspection,
    InspectorProfile,
    InspectorShift,
    RecordViolationPayload,
    TodayStats,
    Violation,
} from '@/api/inspectorApi';

// ─── State ────────────────────────────────────────────────────────────────

interface InspectorState {
    profile: InspectorProfile | null;
    shift: InspectorShift | null;
    todayStats: TodayStats;
    recentInspections: Inspection[];
    violations: Violation[];
    isLoading: boolean;
    error: string | null;
}

const initialState: InspectorState = {
    profile: null,
    shift: null,
    todayStats: { total: 0, valid: 0, violations: 0 },
    recentInspections: [],
    violations: [],
    isLoading: false,
    error: null,
};

type Action =
    | { type: 'SET_LOADING'; payload: boolean }
    | {
        type: 'SET_DASHBOARD';
        payload: Pick<InspectorState, 'profile' | 'shift' | 'todayStats' | 'recentInspections'>;
    }
    | { type: 'SET_SHIFT'; payload: InspectorShift }
    | { type: 'ADD_INSPECTION'; payload: Inspection }
    | { type: 'ADD_VIOLATION'; payload: Violation }
    | { type: 'SET_ERROR'; payload: string | null };

// Reducer: the only place state changes. Each action returns a NEW state object.
function reducer(state: InspectorState, action: Action): InspectorState {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload, error: null };
        case 'SET_DASHBOARD':
            return { ...state, ...action.payload, isLoading: false };
        case 'SET_SHIFT':
            return { ...state, shift: action.payload, error: null };
        case 'ADD_INSPECTION': {
            const isValid = action.payload.result === 'Valid';
            return {
                ...state,
                // keep only the 3 newest for the Dashboard list
                recentInspections: [action.payload, ...state.recentInspections].slice(0, 3),
                todayStats: {
                    total: state.todayStats.total + 1,
                    valid: state.todayStats.valid + (isValid ? 1 : 0),
                    violations: state.todayStats.violations + (isValid ? 0 : 1),
                },
            };
        }
        case 'ADD_VIOLATION':
            return { ...state, violations: [action.payload, ...state.violations] };
        case 'SET_ERROR':
            return { ...state, error: action.payload, isLoading: false };
        default:
            return state;
    }
}

/** Reads the backend's { success:false, message } error body, if there is one. */
function messageFrom(err: any, fallback: string): string {
    return err?.response?.data?.message || fallback;
}

// ─── Context ──────────────────────────────────────────────────────────────

interface InspectorContextValue extends InspectorState {
    loadDashboard: () => Promise<void>;
    toggleShift: () => Promise<void>;
    addInspection: (inspection: Omit<Inspection, 'id' | 'inspectedAt'>) => Promise<Inspection>;
    recordViolation: (payload: RecordViolationPayload) => Promise<Violation>;
}

const InspectorContext = createContext<InspectorContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────

export function InspectorProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState);

    /** One request: profile, today's shift, stats and recent inspections. */
    const loadDashboard = useCallback(async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const dashboard = await getDashboard();
            dispatch({ type: 'SET_DASHBOARD', payload: dashboard });
        } catch (err) {
            dispatch({ type: 'SET_ERROR', payload: messageFrom(err, 'Failed to load dashboard') });
        }
    }, []);

    /** Starts the shift if off duty, ends it if on duty. Throws so the screen can react. */
    const toggleShift = useCallback(async () => {
        if (!state.shift) return;
        try {
            const shift = state.shift.onDuty ? await apiEndShift() : await apiStartShift();
            dispatch({ type: 'SET_SHIFT', payload: shift });
        } catch (err) {
            dispatch({ type: 'SET_ERROR', payload: messageFrom(err, 'Failed to update shift') });
            throw err;
        }
    }, [state.shift]);

    /** Saves the outcome of a scan so it appears in Recent Inspections. */
    const addInspection = useCallback(async (inspection: Omit<Inspection, 'id' | 'inspectedAt'>) => {
        const created = await apiCreateInspection(inspection);
        dispatch({ type: 'ADD_INSPECTION', payload: created });
        return created;
    }, []);

    /** Records a violation — throws on failure so the form can show the error. */
    const recordViolation = useCallback(async (payload: RecordViolationPayload) => {
        try {
            const violation = await apiRecordViolation(payload);
            dispatch({ type: 'ADD_VIOLATION', payload: violation });
            return violation;
        } catch (err) {
            dispatch({ type: 'SET_ERROR', payload: messageFrom(err, 'Failed to record violation') });
            throw err;
        }
    }, []);

    const value = useMemo<InspectorContextValue>(
        () => ({ ...state, loadDashboard, toggleShift, addInspection, recordViolation }),
        [state, loadDashboard, toggleShift, addInspection, recordViolation]
    );

    return (
        <InspectorContext.Provider value={value}>
            {children}
        </InspectorContext.Provider>
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useInspector(): InspectorContextValue {
    const ctx = useContext(InspectorContext);
    if (!ctx) throw new Error('useInspector must be used inside <InspectorProvider>');
    return ctx;
}
