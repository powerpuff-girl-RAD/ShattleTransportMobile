import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useReducer,
} from 'react';

import {
    endShift as apiEndShift,
    getDashboard,
    inspect as apiInspect,
    recordViolation as apiRecordViolation,
    startShift as apiStartShift,
} from '@/api/inspectorApi';
import type {
    Inspection,
    InspectInput,
    InspectionOutcome,
    InspectorProfile,
    InspectorShift,
    RecordViolationPayload,
    TodayStats,
    Violation,
} from '@/api/inspectorApi';

// ─── State ────────────────────────────────────────────────────────────────
// Only state that several screens share lives here. Screens that just show a
// list (History, Violations, Statistics, Schedule) fetch their own data.

interface InspectorState {
    profile: InspectorProfile | null;
    shift: InspectorShift | null;
    todayStats: TodayStats;
    recentInspections: Inspection[];
    /** The most recent scan result — read by the Inspection Result screen. */
    lastOutcome: InspectionOutcome | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: InspectorState = {
    profile: null,
    shift: null,
    todayStats: { total: 0, valid: 0, violations: 0 },
    recentInspections: [],
    lastOutcome: null,
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
    | { type: 'ADD_INSPECTION'; payload: InspectionOutcome }
    | { type: 'VIOLATION_RECORDED'; payload: Violation }
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
            const { inspection } = action.payload;
            const isValid = inspection.result === 'Valid';
            return {
                ...state,
                lastOutcome: action.payload,
                // keep only the 3 newest for the Dashboard list
                recentInspections: [inspection, ...state.recentInspections].slice(0, 3),
                todayStats: {
                    total: state.todayStats.total + 1,
                    valid: state.todayStats.valid + (isValid ? 1 : 0),
                    violations: state.todayStats.violations + (isValid ? 0 : 1),
                },
            };
        }
        case 'VIOLATION_RECORDED': {
            // Mark the inspection everywhere it is shown, so "Record Violation" disappears
            const id = action.payload.inspectionId;
            const mark = (i: Inspection) => (i.id === id ? { ...i, hasViolation: true } : i);
            return {
                ...state,
                recentInspections: state.recentInspections.map(mark),
                lastOutcome: state.lastOutcome
                    ? { ...state.lastOutcome, inspection: mark(state.lastOutcome.inspection) }
                    : null,
            };
        }
        case 'SET_ERROR':
            return { ...state, error: action.payload, isLoading: false };
        default:
            return state;
    }
}

/** Reads the backend's { success:false, message } error body, if there is one. */
export function messageFrom(err: any, fallback: string): string {
    return err?.response?.data?.message || fallback;
}

// ─── Context ──────────────────────────────────────────────────────────────

interface InspectorContextValue extends InspectorState {
    loadDashboard: () => Promise<void>;
    toggleShift: () => Promise<void>;
    inspectToken: (input: InspectInput) => Promise<InspectionOutcome>;
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

    /**
     * Sends a scanned QR / typed serial to the backend, which runs the checks
     * and saves the inspection. Throws so the Scan screen can show the error.
     */
    const inspectToken = useCallback(async (input: InspectInput) => {
        const outcome = await apiInspect(input);
        dispatch({ type: 'ADD_INSPECTION', payload: outcome });
        return outcome;
    }, []);

    /** Records a violation for an invalid inspection. Throws so the form can show the error. */
    const recordViolation = useCallback(async (payload: RecordViolationPayload) => {
        const violation = await apiRecordViolation(payload);
        dispatch({ type: 'VIOLATION_RECORDED', payload: violation });
        return violation;
    }, []);

    const value = useMemo<InspectorContextValue>(
        () => ({ ...state, loadDashboard, toggleShift, inspectToken, recordViolation }),
        [state, loadDashboard, toggleShift, inspectToken, recordViolation]
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
