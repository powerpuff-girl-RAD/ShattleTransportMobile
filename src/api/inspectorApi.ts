import { apiClient } from './apiClient';

// ─── Types ────────────────────────────────────────────────────────────────
// These match the JSON the backend sends (see the mappers in
// ShattleTransportBackend/src/service/inspector.service.js).

export type InspectionResult = 'Valid' | 'Invalid';

export type ViolationType =
    | 'No Boarding Scan'
    | 'Expired Token'
    | 'Insufficient Credit'
    | 'Invalid Token'
    | 'Other';

export type InspectionLocation = 'En Route' | 'At Stop' | 'Terminal';

export interface InspectorProfile {
    id: number;
    name: string;
    email: string;
    badge: string;             // e.g. "INS-0003"
}

export interface InspectorShift {
    scheduleId: number;
    routeNumber: string;       // "177"
    routeName: string;         // "Kaduwela - Kolpity"
    vehicleNumber: string;     // "NB-1234"
    startTime: string;         // "08:00"
    endTime: string;           // "20:00"
    onDuty: boolean;
    startedAt: string | null;  // ISO timestamp when the shift was started
}

export interface TodayStats {
    total: number;
    valid: number;
    violations: number;
}

export interface Inspection {
    id: number;
    tokenSerial: string;       // "TK-88214"
    routeNumber: string;
    routeName: string;
    busNumber: string;
    result: InspectionResult;
    /** Violation type when result is Invalid. */
    reason: ViolationType | null;
    inspectedAt: string;       // ISO timestamp
}

/** Everything the Dashboard screen needs, returned by one API call. */
export interface InspectorDashboard {
    profile: InspectorProfile;
    shift: InspectorShift | null;   // null = no shift scheduled today
    todayStats: TodayStats;
    recentInspections: Inspection[];
}

export interface Violation {
    id: string;
    inspectionId: number;
    tokenSerial: string;
    violationType: ViolationType;
    location: InspectionLocation;
    notes: string;
    recordedAt: string;        // ISO timestamp
}

export interface RecordViolationPayload {
    inspectionId: number;
    tokenSerial: string;
    violationType: ViolationType;
    location: InspectionLocation;
    notes: string;
}

/** Result of validating a scanned passenger QR against the backend. */
export type QRValidationResult =
    | {
        valid: true;
        token: {
            serial: string;
            type: string;
            status: string;
            passengerName: string | null;
            passengerEmail: string | null;
            balance: number;
        };
    }
    | { valid: false; reason: string };

// ─── Dashboard & shift (live backend) ─────────────────────────────────────

/** GET /api/inspector/dashboard */
export async function getDashboard(): Promise<InspectorDashboard> {
    const res = await apiClient.get<{ success: boolean } & InspectorDashboard>('/inspector/dashboard');
    const { profile, shift, todayStats, recentInspections } = res.data;
    return { profile, shift, todayStats, recentInspections };
}

/** POST /api/inspector/shift/start — fails with 404 (no shift today) or 409 (already started) */
export async function startShift(): Promise<InspectorShift> {
    const res = await apiClient.post<{ success: boolean; shift: InspectorShift }>('/inspector/shift/start');
    return res.data.shift;
}

/** POST /api/inspector/shift/end — fails with 409 if no shift is active */
export async function endShift(): Promise<InspectorShift> {
    const res = await apiClient.post<{ success: boolean; shift: InspectorShift }>('/inspector/shift/end');
    return res.data.shift;
}

// ─── QR validation (live backend, used by the Scan screen) ────────────────

/**
 * Sends a scanned QR payload (short-lived passenger JWT) to the backend.
 * The backend replies 200 with `valid: false` for expired/blocked/unknown
 * tokens, so callers only need to handle network errors in the catch block.
 */
export async function validateQR(qrPayload: string): Promise<QRValidationResult> {
    const res = await apiClient.post<QRValidationResult>('/passenger/token/validate', { qrPayload });
    return res.data;
}

// ─── Temporary mocks ──────────────────────────────────────────────────────
// TODO(Screen 2 & 4): replace with POST /api/inspector/inspect and
// POST /api/inspector/violations once those endpoints exist.

let mockInspections: Inspection[] = [];

export async function createInspection(inspection: Omit<Inspection, 'id' | 'inspectedAt'>): Promise<Inspection> {
    const created: Inspection = { ...inspection, id: Date.now(), inspectedAt: new Date().toISOString() };
    mockInspections = [created, ...mockInspections];
    return created;
}

export async function recordViolation(payload: RecordViolationPayload): Promise<Violation> {
    return { ...payload, id: `VIO-${Date.now()}`, recordedAt: new Date().toISOString() };
}
